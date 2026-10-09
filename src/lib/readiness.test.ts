import { describe, it, expect, beforeEach } from "vitest";
import { ContractorProfile, Job, Property } from "./types";
import {
  diffSchedules,
  parallelLevels,
  recommendIntervention,
  scheduleProperty,
  statusFor,
} from "./readiness";
import { getDB, getProperties, getJobsByProperty, getContractorProfiles, getNotifications, resetDB } from "./mock-db";
import { applyRecommendation, getRecommendation, getSchedule, simulateContractorDelay, completeJob } from "./readiness-actions";

const property: Property = {
  id: "p",
  agentId: "a",
  address: "42 Oak Lane",
  checkoutDate: "2026-11-10",
  targetReadyDate: "2026-11-18",
  status: "in_turnover",
  forecastHistory: [],
  interventions: [],
};

const profile = (userId: string, skills: string[], nextAvailableDate: string): ContractorProfile => ({
  userId, skills, nextAvailableDate, experience: "", location: "", hourlyRate: 0, bio: "",
});

const job = (id: string, trade: string, durationDays: number, extra: Partial<Job> = {}): Job => ({
  id, title: id, trade, durationDays, issues: [], category: trade, priority: "Medium", description: "",
  jobAmount: 0, status: "in_progress", agentId: "a", createdAt: "", propertyId: "p", dependsOn: [], ...extra,
});

const demoJobs = (): Job[] => [
  job("elec", "Electrical", 2, { contractorId: "dan" }),
  job("plaster", "Plastering", 1, { contractorId: "mike", dependsOn: ["elec"] }),
  job("paint", "Painting", 2, { contractorId: "mike", dependsOn: ["plaster"] }),
  job("clean", "Cleaning", 1, { status: "published", dependsOn: ["paint"] }),
];

const demoProfiles = (danAvailable = "2026-11-12") => [
  profile("dan", ["Electrical"], danAvailable),
  profile("priya", ["Electrical"], "2026-11-13"),
  profile("mike", ["Plastering", "Painting"], "2026-11-12"),
  profile("sarah", ["Cleaning"], "2026-11-14"),
];

describe("readiness engine", () => {
  it("forecasts the demo property ready on 18 Nov", () => {
    const s = scheduleProperty(property, demoJobs(), demoProfiles());
    expect(s.tasks.map((t) => [t.jobId, t.start, t.end])).toEqual([
      ["elec", "2026-11-12", "2026-11-14"],
      ["plaster", "2026-11-14", "2026-11-15"],
      ["paint", "2026-11-15", "2026-11-17"],
      ["clean", "2026-11-17", "2026-11-18"],
    ]);
    expect(s.readyDate).toBe("2026-11-18");
    expect(s.status).toBe("on_track");
    expect(s.tasks[3].state).toBe("unassigned");
    expect(s.tasks[3].assumedContractorId).toBe("sarah");
    expect(recommendIntervention(property, demoJobs(), demoProfiles())).toBeNull();
  });

  it("recalculates to 21 Nov when the electrician is unavailable for 3 more days", () => {
    const before = scheduleProperty(property, demoJobs(), demoProfiles());
    const after = scheduleProperty(property, demoJobs(), demoProfiles("2026-11-15"));
    expect(after.readyDate).toBe("2026-11-21");
    expect(after.status).toBe("delayed");
    const diff = diffSchedules(before, after);
    expect(diff.deltaDays).toBe(3);
    expect(diff.rootTask?.jobId).toBe("elec");
    expect(diff.reason).toBe("elec delayed due to contractor availability");
  });

  it("recommends reassigning to the earlier electrician, recovering 2 days", () => {
    const rec = recommendIntervention(property, demoJobs(), demoProfiles("2026-11-15"));
    expect(rec).toMatchObject({
      jobId: "elec",
      alternativeContractorId: "priya",
      alternativeAvailableDate: "2026-11-13",
      currentForecast: "2026-11-21",
      revisedForecast: "2026-11-19",
      daysRecovered: 2,
    });
    const applied = demoJobs().map((j) => (j.id === "elec" ? { ...j, contractorId: "priya" } : j));
    const s = scheduleProperty(property, applied, demoProfiles("2026-11-15"));
    expect(s.readyDate).toBe("2026-11-19");
    expect(s.status).toBe("at_risk");
  });

  it("runs independent tasks in parallel and chains non-parallel ones", () => {
    const jobs = [
      job("paint", "Painting", 3, { contractorId: "mike" }),
      job("handle", "Repairs", 1, { canRunParallel: true }),
      job("carpet", "Cleaning", 1, { canRunParallel: false }),
    ];
    const profiles = [profile("mike", ["Painting"], "2026-11-10"), profile("bob", ["Repairs"], "2026-11-10"), profile("sarah", ["Cleaning"], "2026-11-10")];
    const s = scheduleProperty(property, jobs, profiles);
    expect(s.tasks.map((t) => t.start)).toEqual(["2026-11-10", "2026-11-10", "2026-11-11"]);
    expect(parallelLevels(s.tasks).map((l) => l.map((t) => t.jobId))).toEqual([["paint", "handle"], ["carpet"]]);
  });

  it("does not double-book a contractor on the same property", () => {
    const jobs = [
      job("a", "Painting", 2, { contractorId: "mike", canRunParallel: true }),
      job("b", "Painting", 2, { contractorId: "mike", canRunParallel: true }),
    ];
    const s = scheduleProperty(property, jobs, [profile("mike", ["Painting"], "2026-11-10")]);
    expect(s.tasks[1].start).toBe("2026-11-12");
    expect(s.tasks[1].constraint.kind).toBe("contractor_busy");
  });

  it("does not book the assumed contractor of unassigned tasks", () => {
    const jobs = [
      job("a", "Painting", 2, { canRunParallel: true }),
      job("b", "Painting", 2, { canRunParallel: true }),
    ];
    const s = scheduleProperty(property, jobs, [profile("mike", ["Painting"], "2026-11-10")]);
    expect(s.tasks.map((t) => t.start)).toEqual(["2026-11-10", "2026-11-10"]);
  });

  it("uses actual dates for started and completed tasks", () => {
    const jobs = demoJobs();
    jobs[0] = { ...jobs[0], status: "completed", startedAt: "2026-11-12", completedAt: "2026-11-14" };
    const s = scheduleProperty(property, jobs, demoProfiles());
    expect(s.tasks[0].end).toBe("2026-11-15");
    expect(s.readyDate).toBe("2026-11-19");
  });

  it("maps days late to a status", () => {
    expect(statusFor(-2)).toBe("on_track");
    expect(statusFor(0)).toBe("on_track");
    expect(statusFor(1)).toBe("at_risk");
    expect(statusFor(2)).toBe("at_risk");
    expect(statusFor(3)).toBe("delayed");
  });
});

describe("seeded demo data", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDB();
  });

  it("stores forecasts that match the engine", () => {
    for (const p of getProperties()) {
      const s = scheduleProperty(p, getJobsByProperty(p.id), getContractorProfiles());
      expect([p.address, p.forecastHistory.at(-1)?.forecast]).toEqual([p.address, s.readyDate]);
    }
  });

  it("runs the full 42 Oak Lane scenario: 18 → 21 → 19 Nov", () => {
    expect(getSchedule("prop-oak")!.readyDate).toBe("2026-11-18");

    simulateContractorDelay("contractor-3", 3);
    expect(getSchedule("prop-oak")!.readyDate).toBe("2026-11-21");
    const history = getDB().properties.find((p) => p.id === "prop-oak")!.forecastHistory;
    expect(history.at(-1)).toMatchObject({ forecast: "2026-11-21", reason: "Electrical Repair delayed due to contractor availability" });
    const types = getNotifications("agent-1").map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(["forecast_updated", "delay_risk", "alternative_available"]));

    const rec = getRecommendation("prop-oak")!;
    expect(rec).toMatchObject({ alternativeContractorId: "contractor-4", revisedForecast: "2026-11-19", daysRecovered: 2 });
    applyRecommendation("prop-oak", rec);
    expect(getSchedule("prop-oak")!.readyDate).toBe("2026-11-19");
    const oak = getDB().properties.find((p) => p.id === "prop-oak")!;
    expect(oak.interventions).toHaveLength(1);
    expect(oak.interventions[0].daysRecovered).toBe(2);
  });

  it("marks a property ready to let when its last task completes", () => {
    completeJob("job-3", "Mike Johnson");
    const elm = getDB().properties.find((p) => p.id === "prop-elm")!;
    expect(elm.status).toBe("ready_to_let");
    expect(getNotifications("agent-2").some((n) => n.type === "property_ready")).toBe(true);
  });
});
