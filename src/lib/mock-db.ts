import { User, Job, Bid, Notification, ContractorProfile } from "./types";

const STORAGE_KEY = "voidzero_db";

interface MockDB {
  users: User[];
  jobs: Job[];
  notifications: Notification[];
  contractorProfiles: ContractorProfile[];
  savedJobs: Record<string, string[]>; // contractorId -> jobId[]
}

const SEED_DATA: MockDB = {
  users: [
    { id: "agent-1", name: "Alice Parker", email: "alice@agency.com", role: "agent", password: "password" },
    { id: "agent-2", name: "James Wilson", email: "james@agency.com", role: "agent", password: "password" },
    { id: "contractor-1", name: "Mike Johnson", email: "mike@build.com", role: "contractor", password: "password" },
    { id: "contractor-2", name: "Sarah Chen", email: "sarah@build.com", role: "contractor", password: "password" },
  ],
  jobs: [
    {
      id: "job-1", title: "Full Property Repaint – 42 Oak Lane", issues: ["Wall damage", "Paint wear"],
      category: "Painting", priority: "Medium", description: "Multiple rooms need repainting after tenant checkout.",
      jobAmount: 1200, negotiable: true, status: "published", agentId: "agent-1", bids: [], createdAt: "2026-03-20T10:00:00Z",
    },
    {
      id: "job-2", title: "Deep Clean – 8 Maple Drive", issues: ["Dirty carpet", "General cleaning"],
      category: "Cleaning", priority: "High", description: "End-of-tenancy deep clean required.",
      jobAmount: 450, negotiable: false, status: "pending", agentId: "agent-1",
      bids: [
        { id: "bid-1", contractorId: "contractor-1", jobId: "job-2", bidAmount: 420, message: "Can do this within 2 days.", status: "pending", createdAt: "2026-03-22T09:00:00Z" },
        { id: "bid-2", contractorId: "contractor-2", jobId: "job-2", bidAmount: 400, message: "Experienced in deep cleans.", status: "pending", createdAt: "2026-03-22T14:00:00Z" },
      ],
      createdAt: "2026-03-21T08:00:00Z",
    },
    {
      id: "job-3", title: "Handle Repair – 15 Elm Street", issues: ["Broken handle"],
      category: "Repairs", priority: "Medium", description: "Kitchen and bathroom door handles need replacing.",
      jobAmount: 180, negotiable: true, status: "in_progress", agentId: "agent-2", contractorId: "contractor-1",
      bids: [
        { id: "bid-3", contractorId: "contractor-1", jobId: "job-3", bidAmount: 160, message: "I have the parts ready.", status: "accepted", createdAt: "2026-03-19T11:00:00Z" },
      ],
      createdAt: "2026-03-18T10:00:00Z",
    },
    {
      id: "job-4", title: "Post-Tenancy Clean – 3 Birch Court", issues: ["General cleaning"],
      category: "Cleaning", priority: "High", description: "Standard checkout clean.",
      jobAmount: 300, negotiable: false, status: "completed", agentId: "agent-1", contractorId: "contractor-2",
      bids: [
        { id: "bid-4", contractorId: "contractor-2", jobId: "job-4", bidAmount: 300, message: "Available immediately.", status: "accepted", createdAt: "2026-03-10T09:00:00Z" },
      ],
      createdAt: "2026-03-09T10:00:00Z",
    },
  ],
  notifications: [
    { id: "n-1", userId: "agent-1", message: "Mike placed a bid on Deep Clean – 8 Maple Drive", read: false, createdAt: "2026-03-22T09:00:00Z" },
    { id: "n-2", userId: "agent-1", message: "Sarah placed a bid on Deep Clean – 8 Maple Drive", read: false, createdAt: "2026-03-22T14:00:00Z" },
    { id: "n-3", userId: "agent-1", message: "Sarah completed Post-Tenancy Clean – 3 Birch Court", read: true, createdAt: "2026-03-15T16:00:00Z" },
    { id: "n-4", userId: "contractor-1", message: "Your bid was accepted for Handle Repair – 15 Elm Street", read: true, createdAt: "2026-03-19T12:00:00Z" },
  ],
  contractorProfiles: [
    { userId: "contractor-1", skills: ["Repairs", "Painting"], experience: "5 years", location: "London", hourlyRate: 35, bio: "Experienced handyman specialising in property repairs." },
    { userId: "contractor-2", skills: ["Cleaning"], experience: "3 years", location: "Manchester", hourlyRate: 25, bio: "Professional cleaning services for residential properties." },
  ],
  savedJobs: { "contractor-1": ["job-1"] },
};

function loadDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const db = structuredClone(SEED_DATA);
  saveDB(db);
  return db;
}

function saveDB(db: MockDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// --- Public API ---

export function getDB(): MockDB { return loadDB(); }

export function resetDB() { saveDB(structuredClone(SEED_DATA)); }

// Users
export function getUsers() { return loadDB().users; }
export function getUserById(id: string) { return loadDB().users.find(u => u.id === id); }
export function findUser(email: string, password: string) { return loadDB().users.find(u => u.email === email && u.password === password); }
export function createUser(user: User) { const db = loadDB(); db.users.push(user); saveDB(db); }

// Jobs
export function getJobs() { return loadDB().jobs; }
export function getJobById(id: string) { return loadDB().jobs.find(j => j.id === id); }
export function getJobsByAgent(agentId: string) { return loadDB().jobs.filter(j => j.agentId === agentId); }
export function getPublishedJobs() { return loadDB().jobs.filter(j => j.status !== "draft"); }
export function createJob(job: Job) { const db = loadDB(); db.jobs.push(job); saveDB(db); }
export function updateJob(id: string, updates: Partial<Job>) {
  const db = loadDB();
  const idx = db.jobs.findIndex(j => j.id === id);
  if (idx !== -1) { db.jobs[idx] = { ...db.jobs[idx], ...updates }; saveDB(db); }
}

// Bids
export function addBidToJob(jobId: string, bid: Bid) {
  const db = loadDB();
  const job = db.jobs.find(j => j.id === jobId);
  if (job) {
    job.bids.push(bid);
    if (job.status === "published") job.status = "pending";
    saveDB(db);
  }
}
export function updateBidStatus(jobId: string, bidId: string, status: Bid["status"]) {
  const db = loadDB();
  const job = db.jobs.find(j => j.id === jobId);
  if (job) {
    const bid = job.bids.find(b => b.id === bidId);
    if (bid) {
      bid.status = status;
      if (status === "accepted") {
        job.contractorId = bid.contractorId;
        job.status = "in_progress";
        job.bids.filter(b => b.id !== bidId).forEach(b => b.status = "rejected");
      }
      saveDB(db);
    }
  }
}

// Notifications
export function getNotifications(userId: string) { return loadDB().notifications.filter(n => n.userId === userId); }
export function addNotification(n: Notification) { const db = loadDB(); db.notifications.push(n); saveDB(db); }
export function markNotificationRead(id: string) {
  const db = loadDB();
  const n = db.notifications.find(x => x.id === id);
  if (n) { n.read = true; saveDB(db); }
}

// Contractor Profiles
export function getContractorProfile(userId: string) { return loadDB().contractorProfiles.find(p => p.userId === userId); }
export function upsertContractorProfile(profile: ContractorProfile) {
  const db = loadDB();
  const idx = db.contractorProfiles.findIndex(p => p.userId === profile.userId);
  if (idx !== -1) db.contractorProfiles[idx] = profile;
  else db.contractorProfiles.push(profile);
  saveDB(db);
}

// Saved Jobs
export function getSavedJobs(contractorId: string): string[] { return loadDB().savedJobs[contractorId] || []; }
export function toggleSaveJob(contractorId: string, jobId: string) {
  const db = loadDB();
  if (!db.savedJobs[contractorId]) db.savedJobs[contractorId] = [];
  const idx = db.savedJobs[contractorId].indexOf(jobId);
  if (idx !== -1) db.savedJobs[contractorId].splice(idx, 1);
  else db.savedJobs[contractorId].push(jobId);
  saveDB(db);
}
