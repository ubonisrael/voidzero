export type UserRole = "agent" | "contractor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface ContractorProfile {
  userId: string;
  skills: string[];
  experience: string;
  location: string;
  hourlyRate: number;
  bio: string;
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
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const ISSUE_CATEGORY_MAP: Record<string, string> = {
  "Wall damage": "Painting",
  "Dirty carpet": "Cleaning",
  "Broken handle": "Repairs",
  "Paint wear": "Painting",
  "General cleaning": "Cleaning",
};

export const CATEGORY_PRIORITY_MAP: Record<string, string> = {
  Cleaning: "High",
  Painting: "Medium",
  Repairs: "Medium",
};

export const AVAILABLE_ISSUES = [
  "Wall damage",
  "Dirty carpet",
  "Broken handle",
  "Paint wear",
  "General cleaning",
];
