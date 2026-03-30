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
  negotiable: boolean;
  status: "draft" | "published" | "pending" | "in_progress" | "completed";
  contractorId?: string;
  agentId: string;
  bids: Bid[];
  createdAt: string;
}

export interface Bid {
  id: string;
  contractorId: string;
  jobId: string;
  bidAmount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
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
