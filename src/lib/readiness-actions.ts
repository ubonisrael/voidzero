// Side-effecting readiness operations: every change that can move a property's
// forecast goes through `withRecalculation`, which schedules the property before
// and after the change, records forecast history and raises notifications.

import {
  getContractorProfile,
  getContractorProfiles,
  getJobById,
  getJobs,
  getJobsByProperty,
  getProperties,
  getPropertyById,
  getUserById,
  notify,
  updateContractorAvailability,
  updateJob,
  updateProperty,
} from "./mock-db";
import {
  Recommendation,
  Schedule,
  addDays,
  diffDays,
  diffSchedules,
  formatDate,
  maxDate,
  recommendIntervention,
  scheduleProperty,
  todayISO,
} from "./readiness";

export function getSchedule(propertyId: string): Schedule | null {
  const property = getPropertyById(propertyId);
  if (!property) return null;
  return scheduleProperty(property, getJobsByProperty(propertyId), getContractorProfiles());
}

export function getRecommendation(propertyId: string): Recommendation | null {
  const property = getPropertyById(propertyId);
  if (!property) return null;
  return recommendIntervention(property, getJobsByProperty(propertyId), getContractorProfiles());
}

const planLink = (propertyId: string) => `/dashboard/readiness/${propertyId}`;
const contractorName = (id: string) => getUserById(id)?.name ?? "Contractor";

/**
 * Runs `mutate`, then recalculates the readiness forecast of each affected
 * property from its underlying task data.
 */
export function withRecalculation<T>(propertyIds: (string | undefined)[], cause: string, mutate: () => T): T {
  const ids = [...new Set(propertyIds.filter(Boolean) as string[])];
  const before = new Map(ids.map((id) => [id, getSchedule(id)]));
  const result = mutate();
  for (const id of ids) {
    const prev = before.get(id);
    if (prev) recordForecast(id, prev, cause);
  }
  return result;
}

function recordForecast(propertyId: string, before: Schedule, cause: string) {
  const property = getPropertyById(propertyId)!;
  const after = getSchedule(propertyId)!;
  const diff = diffSchedules(before, after);
  const lastForecast = property.forecastHistory.at(-1)?.forecast ?? before.readyDate;
  const link = planLink(propertyId);

  if (after.readyDate !== lastForecast) {
    const reason = diff.reason ?? cause;
    updateProperty(propertyId, {
      forecastHistory: [...property.forecastHistory, { at: new Date().toISOString(), forecast: after.readyDate, reason }],
    });
    notify({
      userId: property.agentId,
      type: "forecast_updated",
      title: "Readiness Forecast Updated",
      message: `Predicted ready-to-let date for ${property.address} changed from ${formatDate(lastForecast, "long")} to ${formatDate(after.readyDate, "long")}. ${reason}.`,
      link,
    });
  }

  if (diff.rootTask && diff.rootTaskShift > 0) {
    const days = diff.rootTaskShift;
    notify({
      userId: property.agentId,
      type: "delay_risk",
      title: "Delay Risk",
      message: `${diff.rootTask.title} at ${property.address} is expected to finish ${days} day${days === 1 ? "" : "s"} late.`,
      link,
    });
    const rec = getRecommendation(propertyId);
    if (rec) {
      const earlier = diffDays(rec.currentAvailableDate, rec.alternativeAvailableDate);
      notify({
        userId: property.agentId,
        type: "alternative_available",
        title: "Alternative Available",
        message: `Another qualified ${rec.trade.toLowerCase()} contractor (${contractorName(rec.alternativeContractorId)}) is available ${earlier} day${earlier === 1 ? "" : "s"} earlier for ${rec.taskTitle} at ${property.address}.`,
        link,
      });
    }
  }

  if (after.allComplete && property.status !== "ready_to_let") {
    updateProperty(propertyId, { status: "ready_to_let" });
    notify({
      userId: property.agentId,
      type: "property_ready",
      title: "Property Ready",
      message: `All required turnover activities at ${property.address} are complete. Property status changed to Ready to Let.`,
      link,
    });
  }
}

/** Records the first forecast for a newly created property. */
export function initialiseForecast(propertyId: string, reason = "Checkout report created") {
  const schedule = getSchedule(propertyId)!;
  updateProperty(propertyId, {
    forecastHistory: [{ at: new Date().toISOString(), forecast: schedule.readyDate, reason }],
  });
  return schedule;
}

/** Properties still in turnover with unfinished work assigned to the contractor. */
export function propertiesForContractor(contractorId: string) {
  const ids = new Set(
    getJobs()
      .filter((j) => j.contractorId === contractorId && j.status !== "completed" && j.propertyId)
      .map((j) => j.propertyId!),
  );
  return getProperties().filter((p) => ids.has(p.id) && p.status === "in_turnover").map((p) => p.id);
}

/** Demo control: the contractor becomes unavailable for `days` additional days. */
export function simulateContractorDelay(contractorId: string, days: number) {
  const profile = getContractorProfile(contractorId);
  if (!profile?.nextAvailableDate) return;
  withRecalculation(
    propertiesForContractor(contractorId),
    `${contractorName(contractorId)} unavailable for ${days} additional day${days === 1 ? "" : "s"}`,
    () => updateContractorAvailability(contractorId, addDays(profile.nextAvailableDate!, days)),
  );
}

export function applyRecommendation(propertyId: string, rec: Recommendation) {
  const before = getSchedule(propertyId)!;
  withRecalculation([propertyId], "Recommendation applied", () => {
    updateJob(rec.jobId, { contractorId: rec.alternativeContractorId });
    const after = getSchedule(propertyId)!;
    const property = getPropertyById(propertyId)!;
    updateProperty(propertyId, {
      interventions: [
        ...property.interventions,
        {
          at: new Date().toISOString(),
          jobId: rec.jobId,
          fromContractorId: rec.currentContractorId,
          toContractorId: rec.alternativeContractorId,
          daysRecovered: diffDays(before.readyDate, after.readyDate),
        },
      ],
    });
  });
  const property = getPropertyById(propertyId)!;
  notify({
    userId: rec.currentContractorId,
    message: `'${rec.taskTitle}' at ${property.address} has been reassigned to another contractor.`,
  });
  notify({
    userId: rec.alternativeContractorId,
    message: `You have been assigned '${rec.taskTitle}' at ${property.address}, starting ${formatDate(rec.alternativeAvailableDate, "long")}.`,
  });
}

/**
 * The scheduled start of a job. In the demo, progress recorded before a task's
 * scheduled date is recorded on the scheduled date, so the seeded future-dated
 * scenario stays consistent.
 */
function scheduledTask(jobId: string) {
  const job = getJobById(jobId);
  if (!job?.propertyId) return null;
  return getSchedule(job.propertyId)?.tasks.find((t) => t.jobId === jobId) ?? null;
}

export function startJob(jobId: string, by: string) {
  const job = getJobById(jobId);
  if (!job) return;
  const task = scheduledTask(jobId);
  const startedAt = task ? maxDate(todayISO(), task.start) : todayISO();
  withRecalculation([job.propertyId], `${by} started ${job.title}`, () => updateJob(jobId, { startedAt }));
}

export function completeJob(jobId: string, by: string) {
  const job = getJobById(jobId);
  if (!job) return;
  const task = scheduledTask(jobId);
  const startedAt = job.startedAt ?? (task ? maxDate(todayISO(), task.start) : todayISO());
  const completedAt = task ? maxDate(todayISO(), addDays(task.end, -1), startedAt) : maxDate(todayISO(), startedAt);
  withRecalculation([job.propertyId], `${by} completed ${job.title}`, () =>
    updateJob(jobId, { status: "completed", startedAt, completedAt }),
  );
}

/** What-if: the start and finish a job would get if this contractor claimed it. */
export function projectedSchedule(jobId: string, contractorId: string) {
  const job = getJobById(jobId);
  const property = job?.propertyId ? getPropertyById(job.propertyId) : undefined;
  if (!job || !property) return null;
  const jobs = getJobsByProperty(property.id).map((j) => (j.id === jobId ? { ...j, contractorId } : j));
  return scheduleProperty(property, jobs, getContractorProfiles()).tasks.find((t) => t.jobId === jobId) ?? null;
}
