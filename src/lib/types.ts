export type UserRole = "agent" | "contractor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export type ContractorAvailability = "available" | "busy" | "unavailable";

export interface ContractorProfile {
  userId: string;
  skills: string[];
  experience: string;
  location: string;
  hourlyRate: number;
  bio: string;
  availability?: ContractorAvailability;
  /** ISO date (YYYY-MM-DD) from which the contractor can start new work. */
  nextAvailableDate?: string;
  // Seeded demonstration stats
  avgCompletionDays?: number;
  jobsCompleted?: number;
  onTimePct?: number;
}

export interface Job {
  id: string;
  title: string;
  issues: string[];
  category: string;
  priority: string;
  description: string;
  jobAmount: number;
  status: "draft" | "published" | "in_progress" | "completed";
  contractorId?: string;
  agentId: string;
  createdAt: string;
  // Readiness fields: a job is one repair task within a property turnover
  propertyId?: string;
  trade?: string;
  durationDays?: number;
  /** Job ids this task must happen after. */
  dependsOn?: string[];
  /** When false and there is no explicit dependency, the task waits for the previous task. */
  canRunParallel?: boolean;
  /** ISO date (YYYY-MM-DD) */
  estimatedStartDate?: string;
  /** ISO date (YYYY-MM-DD) the work actually started */
  startedAt?: string;
  /** ISO date (YYYY-MM-DD) the work actually finished */
  completedAt?: string;
}

export interface ForecastEntry {
  at: string;
  /** ISO date (YYYY-MM-DD) */
  forecast: string;
  reason: string;
}

export interface Intervention {
  at: string;
  jobId: string;
  fromContractorId?: string;
  toContractorId: string;
  daysRecovered: number;
}

export interface Property {
  id: string;
  agentId: string;
  address: string;
  /** ISO date (YYYY-MM-DD) */
  checkoutDate: string;
  /** ISO date (YYYY-MM-DD) */
  targetReadyDate: string;
  status: "in_turnover" | "ready_to_let";
  forecastHistory: ForecastEntry[];
  interventions: Intervention[];
}

/** Completed historical turnovers. Demonstration data only. */
export interface TurnoverRecord {
  address: string;
  checkoutDate: string;
  targetReadyDate: string;
  forecastReadyDate: string;
  actualReadyDate: string;
  delayCause?: string;
  interventions: number;
  daysRecovered: number;
}

export type NotificationType =
  | "general"
  | "delay_risk"
  | "forecast_updated"
  | "alternative_available"
  | "property_ready";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: NotificationType;
  title?: string;
  link?: string;
}

export const ISSUE_CATEGORY_MAP: Record<string, string> = {
  "Wall damage": "Painting",
  "Dirty carpet": "Cleaning",
  "Broken handle": "Repairs",
  "Paint wear": "Painting",
  "General cleaning": "Cleaning",
  "Electrical fault": "Electrical",
  "Plaster damage": "Plastering",
};

export const CATEGORY_PRIORITY_MAP: Record<string, string> = {
  Cleaning: "High",
  Painting: "Medium",
  Repairs: "Medium",
  Electrical: "High",
  Plastering: "Medium",
  Plumbing: "High",
  Carpentry: "Low",
};

export const AVAILABLE_ISSUES = [
  "Wall damage",
  "Dirty carpet",
  "Broken handle",
  "Paint wear",
  "General cleaning",
  "Electrical fault",
  "Plaster damage",
];

export const TRADES = ["Electrical", "Plastering", "Painting", "Cleaning", "Repairs", "Plumbing", "Carpentry"];

export const PRIORITIES = ["High", "Medium", "Low"];
