# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

VoidZero is a frontend-only proof of concept (scaffolded by Lovable: Vite + React 18 + TypeScript + shadcn/ui + Tailwind). It's a marketplace where property letting **agents** file checkout reports as repair jobs and **contractors** claim them. On top of that, a Property Readiness layer forecasts when each property will be ready to let. There is no backend. All data lives in `localStorage`.

## Commands

```bash
npm run dev          # Vite dev server on port 8080
npm run build        # production build to dist/
npm run build:dev    # development-mode build (enables lovable-tagger)
npm run lint         # eslint
npm test             # vitest run (jsdom)
npm run test:watch   # vitest watch mode
npx vitest run src/path/to/file.test.ts   # single test file
npx vitest run -t "test name"             # single test by name
```

Vitest picks up `src/**/*.{test,spec}.{ts,tsx}`, with globals enabled and setup in `src/test/setup.ts`. The real tests are in `src/lib/readiness.test.ts`; they include the seeded 42 Oak Lane demo (18 → 21 → 19 Nov), so a change to the seed data or the scheduler that breaks the demo fails here. `npm run lint` reports three errors, in `components/ui/command.tsx`, `components/ui/textarea.tsx` and `tailwind.config.ts`; those were there before and can be ignored. Playwright config comes from `lovable-agent-playwright-config`. No e2e specs exist yet.

Both `bun.lock` and `package-lock.json` are checked in.

## Architecture

**Data layer: `src/lib/mock-db.ts`.** This is a fake database. The whole DB (`users`, `jobs`, `notifications`, `contractorProfiles`, `savedJobs`, `properties`, `turnoverHistory`) is one JSON blob under the `localStorage` key `voidzero_db`. On first load it is seeded from `SEED_DATA`. Every exported function loads the blob, changes it and saves it again (there is no caching). **Bump `DB_VERSION` whenever you change `SEED_DATA`**: browsers holding an older version are reseeded automatically. The seeded properties carry a literal `forecastHistory`, and a test checks it against the engine's output. Pages call these functions directly and keep the results in local `useState`. React Query is wired up in `App.tsx` but nothing uses it.

**Auth: `src/lib/auth-context.tsx`.** `AuthProvider` and `useAuth()` check credentials against the mock DB, which stores plaintext passwords. The current user's id is kept in `localStorage` under `voidzero_current_user`. Seed logins include `alice@agency.com` (agent) and `mike@build.com` (contractor); every seed password is `password`.

**Routing and roles: `src/App.tsx`.** There are two roles (`UserRole` in `src/lib/types.ts`), and each has its own route tree and layout:
- Agent: `/dashboard/*`, guarded by `RequireAgent`, rendered in `components/agent/AgentLayout.tsx`. Pages live in `src/pages/agent/`.
- Contractor: `/contractor/*`, guarded by `RequireContractor`, rendered in `components/contractor/ContractorLayout.tsx`. Pages live in `src/pages/contractor/`.

Each layout is a shadcn `Sidebar` with a hardcoded nav `items` array and an `<Outlet />`. A new page needs both a route in `App.tsx` and an entry in the matching layout's `items`.

**Property readiness.** A `Property` groups one checkout's jobs, and each `Job` is one repair task (`propertyId`, `trade`, `durationDays`, `dependsOn`, `canRunParallel`, `estimatedStartDate`, `startedAt`, `completedAt`). The logic has two layers:
- `src/lib/readiness.ts` is pure. `scheduleProperty()` sets each task's start to the latest of: its planned start, the ends of its dependencies, its contractor's `nextAvailableDate`, and the end of that contractor's previous task on the property. Task `end` dates are exclusive, and the ready date is the latest `end`. Status is on track if the ready date is on or before the target, at risk if 1–2 days late, and delayed if 3 or more days late. `recommendIntervention()` tries reassigning tasks held back by contractor availability to earlier-available contractors with the same skill. `diffSchedules()` works out the reason for a delay.
- `src/lib/readiness-actions.ts` holds the side effects. **Any change that can move a forecast must be wrapped in `withRecalculation(propertyIds, cause, mutate)`.** It schedules the property before and after the change, appends to `forecastHistory`, and sends the readiness notifications (`delay_risk`, `forecast_updated`, `alternative_available`, `property_ready`). Claim, start, complete, profile availability edits, simulated delays and applying a recommendation all go through it.
- Demo dates are fixed in Nov 2026. `startJob` and `completeJob` record progress made before a task's scheduled date on that scheduled date.

**Job lifecycle.** `Job.status` moves `draft → published → in_progress → completed`.
- An agent creates a property and its jobs in `CreateReport.tsx`. The selected issues generate one task per trade through `ISSUE_CATEGORY_MAP`, and the trade sets the default priority through `CATEGORY_PRIORITY_MAP` (both in `types.ts`). `in_progress` means claimed; a claimed job hasn't actually started until `startedAt` is set.
- Contractors claim published jobs on a **first-come basis** with `claimJob()` (the old bidding workflow was removed). A claim fails if the job is no longer `published` or already has a contractor.
- General notifications are created by hand with `addNotification()` or `notify()` at each state change (see `Marketplace.tsx`, `CurrentJobs.tsx` and `agent/JobDetail.tsx`). Readiness notifications come from `withRecalculation`.

**UI.** `src/components/ui/` holds generated shadcn components (config in `components.json`). Prefer adding new ones with the shadcn CLI over hand-writing them. The landing page is `pages/Index.tsx`, built from the sections in `components/landing/`. The `@/` alias points to `src/`.
