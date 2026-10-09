// Property readiness engine: pure, rule-based scheduling of a property's repair
// tasks. No storage access here; see readiness-actions.ts for side effects.
//
// Date convention: dates are ISO "YYYY-MM-DD" strings. A task occupies whole
// days and `end` is exclusive (a 2-day task starting 12 Nov has end 14 Nov), so
// the predicted ready-to-let date is the latest task end.

import { ContractorProfile, Job, Property } from "./types";

export type ConstraintKind = "start_date" | "dependency" | "contractor" | "contractor_busy" | "actual";

export interface Constraint {
  kind: ConstraintKind;
  date: string;
  /** For "dependency": the job the task waits on. */
  jobId?: string;
  /** For "contractor"/"contractor_busy": the contractor whose availability binds. */
  contractorId?: string;
}

export type TaskState = "completed" | "in_progress" | "scheduled" | "unassigned";

export interface ScheduledTask {
  jobId: string;
  title: string;
  trade: string;
  durationDays: number;
  start: string;
  end: string;
  deps: string[];
  constraint: Constraint;
  state: TaskState;
  contractorId?: string;
  /** For unassigned tasks: the earliest-available qualified contractor assumed by the forecast. */
  assumedContractorId?: string;
}

export type ReadinessStatus = "on_track" | "at_risk" | "delayed" | "ready_to_let";

export interface Schedule {
  tasks: ScheduledTask[];
  readyDate: string;
  status: ReadinessStatus;
  /** Positive = days late against target, negative = days of slack. */
  daysLate: number;
  allComplete: boolean;
}

// --- date helpers ---

const DAY_MS = 86_400_000;

function toUTC(date: string) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number) {
  return new Date(toUTC(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  return Math.round((toUTC(a) - toUTC(b)) / DAY_MS);
}

export function maxDate(...dates: string[]) {
  return dates.reduce((a, b) => (b > a ? b : a));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** "12 Nov" for a 1-day task, otherwise "12 Nov – 13 Nov" (end is exclusive). */
export function formatTaskDates(start: string, end: string) {
  const last = addDays(end, -1);
  return last <= start ? formatDate(start) : `${formatDate(start)} – ${formatDate(last)}`;
}

export function formatDate(date: string, style: "short" | "long" = "short") {
  return new Date(toUTC(date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: style === "short" ? "short" : "long",
    timeZone: "UTC",
  });
}

// --- scheduling ---

export function statusFor(daysLate: number): Exclude<ReadinessStatus, "ready_to_let"> {
  if (daysLate <= 0) return "on_track";
  if (daysLate <= 2) return "at_risk";
  return "delayed";
}

/** Explicit dependencies, or the previous task when the task cannot run in parallel. */
export function effectiveDeps(jobs: Job[]): Map<string, string[]> {
  const ids = new Set(jobs.map((j) => j.id));
  const deps = new Map<string, string[]>();
  jobs.forEach((job, i) => {
    const explicit = (job.dependsOn ?? []).filter((d) => ids.has(d) && d !== job.id);
    if (explicit.length) deps.set(job.id, explicit);
    else if (job.canRunParallel === false && i > 0) deps.set(job.id, [jobs[i - 1].id]);
    else deps.set(job.id, []);
  });
  return deps;
}

function topoOrder(jobs: Job[], deps: Map<string, string[]>): Job[] {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: Job[] = [];
  const visit = (id: string) => {
    if (visited.has(id) || visiting.has(id)) return; // cycles are ignored rather than crashing
    visiting.add(id);
    deps.get(id)?.forEach(visit);
    visiting.delete(id);
    visited.add(id);
    order.push(byId.get(id)!);
  };
  jobs.forEach((j) => visit(j.id));
  return order;
}

/** Earliest-available contractor with the given skill. */
export function earliestQualified(trade: string, profiles: ContractorProfile[], excludeId?: string) {
  return profiles
    .filter((p) => p.skills.includes(trade) && p.userId !== excludeId && p.nextAvailableDate)
    .sort((a, b) => a.nextAvailableDate!.localeCompare(b.nextAvailableDate!) || (b.onTimePct ?? 0) - (a.onTimePct ?? 0))[0];
}

export function scheduleProperty(property: Property, jobs: Job[], profiles: ContractorProfile[]): Schedule {
  const deps = effectiveDeps(jobs);
  const profileById = new Map(profiles.map((p) => [p.userId, p]));
  const scheduled = new Map<string, ScheduledTask>();
  // When an assigned contractor is next free on this property, so they never do two tasks at once.
  const contractorFreeFrom = new Map<string, string>();

  for (const job of topoOrder(jobs, deps)) {
    const duration = Math.max(1, job.durationDays ?? 1);
    const trade = job.trade ?? job.category;
    const taskDeps = deps.get(job.id) ?? [];
    const contractorId = job.contractorId;
    let assumedContractorId: string | undefined;
    if (!contractorId) assumedContractorId = earliestQualified(trade, profiles)?.userId;
    const workerId = contractorId ?? assumedContractorId;

    let start: string;
    let end: string;
    let constraint: Constraint;
    let state: TaskState;

    if (job.status === "completed" && job.completedAt) {
      end = addDays(job.completedAt, 1);
      start = job.startedAt ?? addDays(end, -duration);
      constraint = { kind: "actual", date: start };
      state = "completed";
    } else if (job.startedAt) {
      start = job.startedAt;
      end = addDays(start, duration);
      constraint = { kind: "actual", date: start };
      state = "in_progress";
    } else {
      // The binding constraint is the latest candidate; earlier entries win ties.
      const candidates: Constraint[] = [];
      for (const d of taskDeps) {
        const dep = scheduled.get(d);
        if (dep) candidates.push({ kind: "dependency", date: dep.end, jobId: d });
      }
      const available = workerId ? profileById.get(workerId)?.nextAvailableDate : undefined;
      if (available) candidates.push({ kind: "contractor", date: available, contractorId: workerId });
      const busyUntil = contractorId ? contractorFreeFrom.get(contractorId) : undefined;
      if (busyUntil) candidates.push({ kind: "contractor_busy", date: busyUntil, contractorId });
      candidates.push({ kind: "start_date", date: job.estimatedStartDate ?? property.checkoutDate });

      constraint = candidates.reduce((best, c) => (c.date > best.date ? c : best));
      start = constraint.date;
      end = addDays(start, duration);
      state = contractorId ? "scheduled" : "unassigned";
    }

    // Only assigned contractors are booked; an unassigned task's assumed contractor is a best case, not a booking.
    if (contractorId) contractorFreeFrom.set(contractorId, maxDate(end, contractorFreeFrom.get(contractorId) ?? end));
    scheduled.set(job.id, {
      jobId: job.id,
      title: job.title,
      trade,
      durationDays: duration,
      start,
      end,
      deps: taskDeps,
      constraint,
      state,
      contractorId,
      assumedContractorId,
    });
  }

  // Keep the original task order for display.
  const tasks = jobs.map((j) => scheduled.get(j.id)!);
  const readyDate = tasks.length ? maxDate(...tasks.map((t) => t.end)) : property.checkoutDate;
  const daysLate = diffDays(readyDate, property.targetReadyDate);
  const allComplete = tasks.length > 0 && tasks.every((t) => t.state === "completed");
  const status: ReadinessStatus =
    property.status === "ready_to_let" || allComplete ? "ready_to_let" : statusFor(daysLate);
  return { tasks, readyDate, status, daysLate, allComplete };
}

/** Groups tasks by dependency depth so tasks that can run simultaneously sit together. */
export function parallelLevels(tasks: ScheduledTask[]): ScheduledTask[][] {
  const byId = new Map(tasks.map((t) => [t.jobId, t]));
  const level = new Map<string, number>();
  const depth = (t: ScheduledTask, seen = new Set<string>()): number => {
    if (level.has(t.jobId)) return level.get(t.jobId)!;
    if (seen.has(t.jobId)) return 0;
    seen.add(t.jobId);
    const parents = t.deps.map((d) => byId.get(d)).filter(Boolean) as ScheduledTask[];
    const l = parents.length ? 1 + Math.max(...parents.map((p) => depth(p, seen))) : 0;
    level.set(t.jobId, l);
    return l;
  };
  tasks.forEach((t) => depth(t));
  const levels: ScheduledTask[][] = [];
  tasks.forEach((t) => {
    const l = level.get(t.jobId)!;
    (levels[l] ??= []).push(t);
  });
  return levels.filter(Boolean);
}

export function describeConstraint(task: ScheduledTask, tasks: ScheduledTask[], contractorName?: (id: string) => string) {
  const c = task.constraint;
  const who = c.contractorId && contractorName ? contractorName(c.contractorId) : "Contractor";
  switch (c.kind) {
    case "dependency":
      return `Waiting on ${tasks.find((t) => t.jobId === c.jobId)?.title ?? "previous task"}`;
    case "contractor":
      return `${who} available ${formatDate(c.date)}`;
    case "contractor_busy":
      return `${who} busy on another task until ${formatDate(c.date)}`;
    case "actual":
      return task.state === "completed" ? "Completed" : `Started ${formatDate(c.date)}`;
    default:
      return `Planned start ${formatDate(c.date)}`;
  }
}

export interface ScheduleDiff {
  deltaDays: number;
  reason?: string;
  /** The first task (in dependency order) whose start moved. */
  rootTask?: ScheduledTask;
  /** Days the root task now finishes later (or earlier, if negative). */
  rootTaskShift: number;
}

export function diffSchedules(before: Schedule, after: Schedule): ScheduleDiff {
  const deltaDays = diffDays(after.readyDate, before.readyDate);
  const prev = new Map(before.tasks.map((t) => [t.jobId, t]));
  // Walk in start order so the root cause comes before its knock-on effects.
  const moved = [...after.tasks]
    .sort((a, b) => a.start.localeCompare(b.start))
    .find((t) => {
      const p = prev.get(t.jobId);
      return p && (p.start !== t.start || p.end !== t.end) && t.constraint.kind !== "dependency";
    });
  if (!moved) return { deltaDays, rootTaskShift: 0 };
  const shift = diffDays(moved.end, prev.get(moved.jobId)!.end);
  const later = shift > 0;
  let reason: string;
  switch (moved.constraint.kind) {
    case "contractor":
      reason = later
        ? `${moved.title} delayed due to contractor availability`
        : `${moved.title} brought forward by an earlier-available contractor`;
      break;
    case "contractor_busy":
      reason = `${moved.title} rescheduled around the contractor's other work`;
      break;
    case "actual":
      reason = `${moved.title} progress recorded`;
      break;
    default:
      reason = `${moved.title} start date changed`;
  }
  return { deltaDays, reason, rootTask: moved, rootTaskShift: shift };
}

export interface Recommendation {
  jobId: string;
  taskTitle: string;
  trade: string;
  currentContractorId: string;
  currentAvailableDate: string;
  alternativeContractorId: string;
  alternativeAvailableDate: string;
  currentForecast: string;
  revisedForecast: string;
  daysRecovered: number;
}

/**
 * For each not-yet-started task whose start is held back by its contractor's
 * availability, tries every other qualified contractor available earlier and
 * returns the reassignment that brings the ready-to-let date forward the most.
 */
export function recommendIntervention(
  property: Property,
  jobs: Job[],
  profiles: ContractorProfile[],
): Recommendation | null {
  const current = scheduleProperty(property, jobs, profiles);
  if (current.status === "ready_to_let") return null;
  let best: Recommendation | null = null;

  for (const task of current.tasks) {
    if (task.state !== "scheduled" || task.constraint.kind !== "contractor" || !task.contractorId) continue;
    const currentAvailable = task.constraint.date;
    const alternatives = profiles.filter(
      (p) =>
        p.userId !== task.contractorId &&
        p.skills.includes(task.trade) &&
        p.nextAvailableDate &&
        p.nextAvailableDate < currentAvailable,
    );
    for (const alt of alternatives) {
      const whatIf = jobs.map((j) => (j.id === task.jobId ? { ...j, contractorId: alt.userId } : j));
      const revised = scheduleProperty(property, whatIf, profiles).readyDate;
      const recovered = diffDays(current.readyDate, revised);
      if (recovered > 0 && (!best || recovered > best.daysRecovered)) {
        best = {
          jobId: task.jobId,
          taskTitle: task.title,
          trade: task.trade,
          currentContractorId: task.contractorId,
          currentAvailableDate: currentAvailable,
          alternativeContractorId: alt.userId,
          alternativeAvailableDate: alt.nextAvailableDate!,
          currentForecast: current.readyDate,
          revisedForecast: revised,
          daysRecovered: recovered,
        };
      }
    }
  }
  return best;
}

export const STATUS_LABEL: Record<ReadinessStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  delayed: "Delayed",
  ready_to_let: "Ready to Let",
};

export const STATUS_CLASS: Record<ReadinessStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-700",
  at_risk: "bg-amber-100 text-amber-700",
  delayed: "bg-red-100 text-red-700",
  ready_to_let: "bg-primary/10 text-primary",
};
