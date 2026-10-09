import { Link } from "react-router-dom";
import { ArrowDown, CheckCircle2, Home } from "lucide-react";
import { Schedule, ScheduledTask, addDays, describeConstraint, formatDate, parallelLevels } from "@/lib/readiness";
import { getUserById } from "@/lib/mock-db";

const contractorName = (id: string) => getUserById(id)?.name ?? "Contractor";

const STATE_CLASS: Record<ScheduledTask["state"], string> = {
  completed: "border-emerald-300 bg-emerald-50",
  in_progress: "border-blue-300 bg-blue-50",
  scheduled: "border-border bg-card",
  unassigned: "border-dashed border-muted-foreground/40 bg-card",
};

const STATE_LABEL: Record<ScheduledTask["state"], string> = {
  completed: "Completed",
  in_progress: "In progress",
  scheduled: "Scheduled",
  unassigned: "Awaiting contractor",
};

function TaskNode({ task, tasks, highlight }: { task: ScheduledTask; tasks: ScheduledTask[]; highlight: boolean }) {
  const lastDay = formatDate(addDays(task.end, -1));
  const who = task.contractorId
    ? contractorName(task.contractorId)
    : task.assumedContractorId
      ? `Unassigned (earliest: ${contractorName(task.assumedContractorId)})`
      : "Unassigned";
  return (
    <Link
      to={`/dashboard/jobs/${task.jobId}`}
      className={`block w-full sm:w-64 rounded-lg border p-3 text-sm hover:shadow-md transition-shadow ${STATE_CLASS[task.state]} ${highlight ? "ring-2 ring-amber-400" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{task.title}</p>
        {task.state === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
      </div>
      <p className="text-xs text-muted-foreground">
        {task.trade} · {task.durationDays} day{task.durationDays === 1 ? "" : "s"} · {STATE_LABEL[task.state]}
      </p>
      <p className="text-xs mt-1">
        {formatDate(task.start)}
        {task.durationDays > 1 && ` – ${lastDay}`}
      </p>
      <p className="text-xs text-muted-foreground truncate">{who}</p>
      <p className={`text-xs mt-1 ${highlight ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
        {describeConstraint(task, tasks, contractorName)}
      </p>
    </Link>
  );
}

export function RepairSequence({ schedule, highlightJobId }: { schedule: Schedule; highlightJobId?: string }) {
  const levels = parallelLevels(schedule.tasks);
  return (
    <div className="flex flex-col items-center gap-2">
      {levels.map((level, i) => (
        <div key={i} className="flex flex-col items-center gap-2 w-full">
          {level.length > 1 && <span className="text-xs uppercase tracking-wide text-muted-foreground">Running in parallel</span>}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full">
            {level.map((t) => (
              <TaskNode key={t.jobId} task={t} tasks={schedule.tasks} highlight={t.jobId === highlightJobId} />
            ))}
          </div>
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 font-display font-bold">
        <Home className="h-4 w-4" />
        READY TO LET · {formatDate(schedule.readyDate, "long")}
      </div>
    </div>
  );
}
