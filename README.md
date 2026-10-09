# VoidZero

VoidZero helps letting agents turn properties around between tenancies. A checkout report becomes a set of repair jobs. Contractors claim those jobs in a marketplace. The **Property Readiness** layer forecasts when the whole property will be ready to let and spots delays. It also recommends interventions that bring the date forward.

VoidZero doesn't just track individual repair jobs. It works out how those jobs, their dependencies, their durations and the contractors' availability together decide when the property is ready to let.

This is a proof of concept. It is frontend only, and all data lives in the browser's `localStorage`.

## Running it

```bash
npm install
npm run dev     # http://localhost:8080
npm test        # readiness engine tests
```

## Demo walkthrough

Demo accounts all use the password `password`:

| Role | Email |
| --- | --- |
| Letting agent | `alice@agency.com` |
| Contractor (cleaner) | `sarah@build.com` |
| Contractor (electrician) | `dan@spark.com`, `priya@spark.com` |

**Main scenario: 42 Oak Lane**

1. Log in as Alice. The dashboard shows properties in turnover with their target date, forecast and status. Click **42 Oak Lane**.
2. The **Property Readiness Plan** shows Electrical (2 days) → Plaster (1 day) → Painting (2 days) → Deep Cleaning (1 day) → **Ready to Let on 18 November**, which is On Track.
3. Under **Demo Controls**, click **Simulate delay** on Electrical Repair (+3 days). The electrician's availability moves to 15 November. The forecast is recalculated to **21 November**, with *Delay Detected: +3 Days, Reason: Electrical Repair delayed due to contractor availability*.
4. The **Delay Risk Detected** card recommends reassigning the electrical repair to Priya Shah, who is available 13 November. That gives a revised forecast of 19 November, recovering 2 days. Click **Apply Recommendation**: the job is reassigned, the forecast becomes **19 November**, and the page shows **2 Days Recovered**.
5. **Notifications** now show Delay Risk, Readiness Forecast Updated and Alternative Available. **Analytics** counts the intervention and the days recovered.

Click **Reset demo data** (on the plan page or in Settings) to start again.

**Other things to try**

- **Create Report:** enter the property details and pick inspection issues. Repair tasks are generated with duration, trade, "must happen after", "can run in parallel", priority and estimated start. A live forecast preview updates as you edit.
- **Contractor marketplace:** log in as Sarah. Each job shows when it would start if she claimed it, based on her availability. Claiming, starting and completing jobs all update the property's forecast. When the last task completes, the agent gets a **Property Ready** notification.
- **Contractor profile:** changing the next available date recalculates the forecast of every property with work assigned to that contractor.

## How the forecast works

The forecast is rule-based; there is no machine learning. Each task starts on the latest of these dates:

- its estimated start date (or the checkout date);
- the end of the tasks it must happen after;
- its contractor's next available date;
- the end of that contractor's previous task on the same property.

The predicted ready-to-let date is when the last task finishes. A property is **On Track** if that date is on or before the target, **At Risk** if it is 1–2 days late, and **Delayed** if it is 3 or more days late. Unassigned tasks assume the earliest-available qualified contractor.

Analytics history and contractor performance stats are **seeded demonstration data**, not real customer performance.
