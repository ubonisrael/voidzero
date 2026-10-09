import { Property } from "@/lib/types";
import { Schedule, ScheduledTask, addDays, describeConstraint, diffDays, formatDate, maxDate } from "@/lib/readiness";
import { getUserById } from "@/lib/mock-db";

const contractorName = (id: string) => getUserById(id)?.name ?? "Contractor";

const BAR_CLASS: Record<ScheduledTask["state"], string> = {
  completed: "bg-emerald-500",
  in_progress: "bg-blue-500",
  scheduled: "bg-primary",
  unassigned: "bg-muted-foreground/50",
};

/** Gantt-style view of task bars against days from checkout. */
export function ScheduleTimeline({ property, schedule }: { property: Property; schedule: Schedule }) {
  const start = [property.checkoutDate, ...schedule.tasks.map((t) => t.start)].reduce((a, b) => (b < a ? b : a));
  // One spare day after the later of the ready and target dates keeps both markers inside the chart.
  const end = addDays(maxDate(schedule.readyDate, property.targetReadyDate), 1);
  const days = Math.max(1, diffDays(end, start));
  const pct = (date: string) => `${(diffDays(date, start) / days) * 100}%`;
  const dayList = Array.from({ length: days }, (_, i) => addDays(start, i));
  const tickEvery = days > 21 ? 3 : 1;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] text-xs">
        <div className="flex">
          <div className="w-44 shrink-0" />
          <div className="relative flex-1 h-6 overflow-hidden">
            {dayList.map((d, i) =>
              i % tickEvery === 0 ? (
                <span key={d} className="absolute -translate-x-1/2 text-muted-foreground whitespace-nowrap" style={{ left: `calc(${pct(d)} + ${50 / days}%)` }}>
                  {formatDate(d)}
                </span>
              ) : null,
            )}
          </div>
        </div>
        <div className="relative">
          {schedule.tasks.map((t) => (
            <div key={t.jobId} className="flex items-center border-t py-2">
              <div className="w-44 shrink-0 pr-2">
                <p className="font-medium truncate">{t.title}</p>
                <p className="text-muted-foreground truncate">{describeConstraint(t, schedule.tasks, contractorName)}</p>
              </div>
              <div className="relative flex-1 h-6 bg-muted/40 rounded">
                <div
                  className={`absolute top-0 h-6 rounded ${BAR_CLASS[t.state]}`}
                  style={{ left: pct(t.start), width: `${(diffDays(t.end, t.start) / days) * 100}%` }}
                  title={`${formatDate(t.start)} – ${formatDate(addDays(t.end, -1))}`}
                />
              </div>
            </div>
          ))}
          {/* Target ready date (start of that day) and predicted ready date markers */}
          <div className="absolute inset-y-0 left-44 right-0 pointer-events-none">
            <div className="absolute inset-y-0 border-l-2 border-dashed border-amber-500" style={{ left: pct(property.targetReadyDate) }} />
            <div className="absolute inset-y-0 border-l-2 border-primary" style={{ left: pct(schedule.readyDate) }} />
          </div>
        </div>
        <div className="flex gap-4 pt-3 pl-44 text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-3 border-l-2 border-dashed border-amber-500" />Target {formatDate(property.targetReadyDate)}</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 border-l-2 border-primary" />Predicted ready {formatDate(schedule.readyDate)}</span>
        </div>
      </div>
    </div>
  );
}
