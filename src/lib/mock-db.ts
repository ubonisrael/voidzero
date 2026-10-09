import {
  User,
  Job,
  Notification,
  ContractorProfile,
  Property,
  TurnoverRecord,
} from "./types";

const STORAGE_KEY = "voidzero_db";
// Bump when SEED_DATA changes so browsers holding an older blob are reseeded.
const DB_VERSION = 2;

interface MockDB {
  version: number;
  users: User[];
  jobs: Job[];
  notifications: Notification[];
  contractorProfiles: ContractorProfile[];
  savedJobs: Record<string, string[]>;
  properties: Property[];
  turnoverHistory: TurnoverRecord[];
}

function contractor(id: string, name: string, email: string): User {
  return { id, name, email, role: "contractor", password: "password" };
}

function task(
  fields: Pick<Job, "id" | "title" | "trade" | "durationDays" | "propertyId" | "jobAmount"> &
    Partial<Job>,
): Job {
  return {
    issues: [],
    category: fields.trade!,
    priority: "Medium",
    description: "",
    status: "in_progress",
    agentId: "agent-1",
    createdAt: "2026-11-01T09:00:00Z",
    dependsOn: [],
    canRunParallel: false,
    ...fields,
  };
}

const SEED_DATA: MockDB = {
  version: DB_VERSION,
  users: [
    {
      id: "agent-1",
      name: "Alice Parker",
      email: "alice@agency.com",
      role: "agent",
      password: "password",
    },
    {
      id: "agent-2",
      name: "James Wilson",
      email: "james@agency.com",
      role: "agent",
      password: "password",
    },
    contractor("contractor-1", "Mike Johnson", "mike@build.com"),
    contractor("contractor-2", "Sarah Chen", "sarah@build.com"),
    contractor("contractor-3", "Dan Okafor", "dan@spark.com"),
    contractor("contractor-4", "Priya Shah", "priya@spark.com"),
    contractor("contractor-5", "Tom Reed", "tom@build.com"),
    contractor("contractor-6", "Ravi Patel", "ravi@flow.com"),
  ],
  properties: [
    {
      id: "prop-oak",
      agentId: "agent-1",
      address: "42 Oak Lane",
      checkoutDate: "2026-11-10",
      targetReadyDate: "2026-11-18",
      status: "in_turnover",
      forecastHistory: [
        { at: "2026-11-10T09:00:00Z", forecast: "2026-11-18", reason: "Checkout report created" },
      ],
      interventions: [],
    },
    {
      id: "prop-maple",
      agentId: "agent-1",
      address: "8 Maple Drive",
      checkoutDate: "2026-11-15",
      targetReadyDate: "2026-11-20",
      status: "in_turnover",
      forecastHistory: [
        { at: "2026-11-15T09:00:00Z", forecast: "2026-11-20", reason: "Checkout report created" },
      ],
      interventions: [],
    },
    {
      id: "prop-king",
      agentId: "agent-1",
      address: "15 King Street",
      checkoutDate: "2026-11-14",
      targetReadyDate: "2026-11-22",
      status: "in_turnover",
      forecastHistory: [
        { at: "2026-11-14T09:00:00Z", forecast: "2026-11-22", reason: "Checkout report created" },
        {
          at: "2026-11-15T11:00:00Z",
          forecast: "2026-11-25",
          reason: "Leak Repair delayed due to contractor availability",
        },
      ],
      interventions: [],
    },
    {
      id: "prop-elm",
      agentId: "agent-2",
      address: "15 Elm Street",
      checkoutDate: "2026-11-10",
      targetReadyDate: "2026-11-14",
      status: "in_turnover",
      forecastHistory: [
        { at: "2026-11-10T09:00:00Z", forecast: "2026-11-13", reason: "Checkout report created" },
      ],
      interventions: [],
    },
    {
      id: "prop-birch",
      agentId: "agent-1",
      address: "3 Birch Court",
      checkoutDate: "2026-03-09",
      targetReadyDate: "2026-03-14",
      status: "ready_to_let",
      forecastHistory: [
        { at: "2026-03-09T10:00:00Z", forecast: "2026-03-14", reason: "Checkout report created" },
      ],
      interventions: [],
    },
  ],
  jobs: [
    // 42 Oak Lane: the main demonstration scenario
    task({
      id: "job-oak-elec",
      title: "Electrical Repair",
      trade: "Electrical",
      priority: "High",
      issues: ["Electrical fault"],
      description: "Replace faulty sockets and light fittings in the living room and hallway.",
      durationDays: 2,
      propertyId: "prop-oak",
      jobAmount: 420,
      contractorId: "contractor-3",
    }),
    task({
      id: "job-oak-plaster",
      title: "Plaster Repair",
      trade: "Plastering",
      issues: ["Plaster damage"],
      description: "Make good the walls opened up for the electrical work.",
      durationDays: 1,
      propertyId: "prop-oak",
      jobAmount: 180,
      contractorId: "contractor-1",
      dependsOn: ["job-oak-elec"],
    }),
    task({
      id: "job-oak-paint",
      title: "Painting",
      trade: "Painting",
      issues: ["Wall damage", "Paint wear"],
      description: "Repaint living room, hallway and bedroom.",
      durationDays: 2,
      propertyId: "prop-oak",
      jobAmount: 650,
      contractorId: "contractor-1",
      dependsOn: ["job-oak-plaster"],
    }),
    task({
      id: "job-oak-clean",
      title: "Deep Cleaning",
      trade: "Cleaning",
      priority: "High",
      issues: ["Dirty carpet", "General cleaning"],
      description: "End-of-tenancy deep clean including carpets.",
      durationDays: 1,
      propertyId: "prop-oak",
      jobAmount: 260,
      status: "published",
      dependsOn: ["job-oak-paint"],
    }),
    // 8 Maple Drive: on track, with a parallel task
    task({
      id: "job-maple-paint",
      title: "Painting",
      trade: "Painting",
      issues: ["Paint wear"],
      description: "Repaint all bedrooms.",
      durationDays: 3,
      propertyId: "prop-maple",
      jobAmount: 780,
      contractorId: "contractor-5",
    }),
    task({
      id: "job-maple-handle",
      title: "Handle Repair",
      trade: "Repairs",
      issues: ["Broken handle"],
      description: "Replace kitchen cupboard handles.",
      durationDays: 1,
      propertyId: "prop-maple",
      jobAmount: 90,
      contractorId: "contractor-1",
      canRunParallel: true,
      estimatedStartDate: "2026-11-16",
    }),
    task({
      id: "job-maple-clean",
      title: "Deep Cleaning",
      trade: "Cleaning",
      priority: "High",
      issues: ["General cleaning"],
      description: "End-of-tenancy deep clean.",
      durationDays: 1,
      propertyId: "prop-maple",
      jobAmount: 240,
      contractorId: "contractor-2",
      dependsOn: ["job-maple-paint"],
    }),
    // 15 King Street: delayed, no alternative plumber available
    task({
      id: "job-king-plumb",
      title: "Leak Repair",
      trade: "Plumbing",
      priority: "High",
      description: "Fix leaking pipe under the bathroom floor.",
      durationDays: 2,
      propertyId: "prop-king",
      jobAmount: 380,
      contractorId: "contractor-6",
    }),
    task({
      id: "job-king-plaster",
      title: "Plaster Repair",
      trade: "Plastering",
      issues: ["Plaster damage"],
      description: "Re-plaster water-damaged ceiling.",
      durationDays: 1,
      propertyId: "prop-king",
      jobAmount: 200,
      contractorId: "contractor-5",
      dependsOn: ["job-king-plumb"],
    }),
    task({
      id: "job-king-paint",
      title: "Painting",
      trade: "Painting",
      issues: ["Wall damage"],
      description: "Repaint bathroom and landing.",
      durationDays: 2,
      propertyId: "prop-king",
      jobAmount: 420,
      contractorId: "contractor-5",
      dependsOn: ["job-king-plaster"],
    }),
    task({
      id: "job-king-clean",
      title: "Deep Cleaning",
      trade: "Cleaning",
      priority: "High",
      issues: ["General cleaning"],
      description: "End-of-tenancy deep clean.",
      durationDays: 1,
      propertyId: "prop-king",
      jobAmount: 220,
      contractorId: "contractor-2",
      dependsOn: ["job-king-paint"],
    }),
    {
      id: "job-3",
      title: "Handle Repair – 15 Elm Street",
      issues: ["Broken handle"],
      category: "Repairs",
      priority: "Medium",
      description: "Kitchen and bathroom door handles need replacing.",
      jobAmount: 180,
      status: "in_progress",
      agentId: "agent-2",
      contractorId: "contractor-1",
      createdAt: "2026-03-18T10:00:00Z",
      propertyId: "prop-elm",
      trade: "Repairs",
      durationDays: 1,
      dependsOn: [],
      canRunParallel: false,
    },
    {
      id: "job-4",
      title: "Post-Tenancy Clean – 3 Birch Court",
      issues: ["General cleaning"],
      category: "Cleaning",
      priority: "High",
      description: "Standard checkout clean.",
      jobAmount: 300,
      status: "completed",
      agentId: "agent-1",
      contractorId: "contractor-2",
      createdAt: "2026-03-09T10:00:00Z",
      propertyId: "prop-birch",
      trade: "Cleaning",
      durationDays: 1,
      dependsOn: [],
      canRunParallel: false,
      startedAt: "2026-03-13",
      completedAt: "2026-03-13",
    },
  ],
  notifications: [
    {
      id: "n-1",
      userId: "agent-2",
      message: "Mike claimed the job 'Handle Repair – 15 Elm Street'",
      read: true,
      createdAt: "2026-03-19T12:00:00Z",
    },
    {
      id: "n-2",
      userId: "agent-1",
      message: "Sarah completed 'Post-Tenancy Clean – 3 Birch Court'",
      read: true,
      createdAt: "2026-03-15T16:00:00Z",
    },
    {
      id: "n-3",
      userId: "contractor-1",
      message: "You claimed 'Handle Repair – 15 Elm Street'",
      read: true,
      createdAt: "2026-03-19T12:00:00Z",
    },
    {
      id: "n-4",
      userId: "agent-1",
      type: "property_ready",
      title: "Property Ready",
      message:
        "All required turnover activities at 3 Birch Court are complete. Property status changed to Ready to Let.",
      link: "/dashboard/readiness/prop-birch",
      read: true,
      createdAt: "2026-03-15T16:01:00Z",
    },
    {
      id: "n-5",
      userId: "agent-1",
      type: "delay_risk",
      title: "Delay Risk",
      message: "Leak Repair at 15 King Street is expected to finish 3 days late.",
      link: "/dashboard/readiness/prop-king",
      read: false,
      createdAt: "2026-10-08T11:00:00Z",
    },
  ],
  contractorProfiles: [
    {
      userId: "contractor-1",
      skills: ["Repairs", "Painting", "Plastering"],
      experience: "5 years",
      location: "London",
      hourlyRate: 35,
      bio: "Experienced handyman specialising in property repairs.",
      availability: "busy",
      nextAvailableDate: "2026-11-12",
      avgCompletionDays: 1.8,
      jobsCompleted: 64,
      onTimePct: 91,
    },
    {
      userId: "contractor-2",
      skills: ["Cleaning"],
      experience: "3 years",
      location: "Manchester",
      hourlyRate: 25,
      bio: "Professional cleaning services for residential properties.",
      availability: "available",
      nextAvailableDate: "2026-11-14",
      avgCompletionDays: 1.0,
      jobsCompleted: 112,
      onTimePct: 96,
    },
    {
      userId: "contractor-3",
      skills: ["Electrical"],
      experience: "8 years",
      location: "London",
      hourlyRate: 48,
      bio: "NICEIC-registered electrician for rewires, fault finding and certification.",
      availability: "busy",
      nextAvailableDate: "2026-11-12",
      avgCompletionDays: 2.4,
      jobsCompleted: 87,
      onTimePct: 78,
    },
    {
      userId: "contractor-4",
      skills: ["Electrical"],
      experience: "6 years",
      location: "London",
      hourlyRate: 50,
      bio: "Qualified electrician focused on fast turnarounds for letting agents.",
      availability: "available",
      nextAvailableDate: "2026-11-13",
      avgCompletionDays: 1.9,
      jobsCompleted: 53,
      onTimePct: 94,
    },
    {
      userId: "contractor-5",
      skills: ["Painting", "Plastering"],
      experience: "10 years",
      location: "London",
      hourlyRate: 32,
      bio: "Painter and decorator, plastering and making good.",
      availability: "busy",
      nextAvailableDate: "2026-11-16",
      avgCompletionDays: 2.2,
      jobsCompleted: 140,
      onTimePct: 88,
    },
    {
      userId: "contractor-6",
      skills: ["Plumbing"],
      experience: "12 years",
      location: "London",
      hourlyRate: 55,
      bio: "Gas Safe plumber: leaks, bathrooms and heating.",
      availability: "busy",
      nextAvailableDate: "2026-11-19",
      avgCompletionDays: 2.6,
      jobsCompleted: 98,
      onTimePct: 82,
    },
  ],
  savedJobs: { "contractor-2": ["job-oak-clean"] },
  turnoverHistory: [
    { address: "3 Birch Court", checkoutDate: "2026-03-09", targetReadyDate: "2026-03-14", forecastReadyDate: "2026-03-14", actualReadyDate: "2026-03-14", interventions: 0, daysRecovered: 0 },
    { address: "21 Cedar Road", checkoutDate: "2026-04-02", targetReadyDate: "2026-04-10", forecastReadyDate: "2026-04-10", actualReadyDate: "2026-04-13", delayCause: "Contractor availability", interventions: 0, daysRecovered: 0 },
    { address: "7 Willow Close", checkoutDate: "2026-04-20", targetReadyDate: "2026-04-28", forecastReadyDate: "2026-04-29", actualReadyDate: "2026-04-28", interventions: 1, daysRecovered: 2 },
    { address: "56 Ash Grove", checkoutDate: "2026-05-11", targetReadyDate: "2026-05-18", forecastReadyDate: "2026-05-18", actualReadyDate: "2026-05-22", delayCause: "Materials delay", interventions: 0, daysRecovered: 0 },
    { address: "9 Holly Mews", checkoutDate: "2026-06-01", targetReadyDate: "2026-06-09", forecastReadyDate: "2026-06-11", actualReadyDate: "2026-06-10", delayCause: "Contractor availability", interventions: 1, daysRecovered: 1 },
    { address: "14 Beech Avenue", checkoutDate: "2026-07-06", targetReadyDate: "2026-07-13", forecastReadyDate: "2026-07-13", actualReadyDate: "2026-07-13", interventions: 0, daysRecovered: 0 },
    { address: "30 Rowan Street", checkoutDate: "2026-08-03", targetReadyDate: "2026-08-12", forecastReadyDate: "2026-08-13", actualReadyDate: "2026-08-15", delayCause: "Dependent task overran", interventions: 0, daysRecovered: 0 },
    { address: "2 Poplar Way", checkoutDate: "2026-09-07", targetReadyDate: "2026-09-15", forecastReadyDate: "2026-09-17", actualReadyDate: "2026-09-16", delayCause: "Contractor availability", interventions: 1, daysRecovered: 2 },
  ],
};

function loadDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as MockDB;
      if (db.version === DB_VERSION) return db;
    }
  } catch {
    /* ignore */
  }
  const db = structuredClone(SEED_DATA);
  saveDB(db);
  return db;
}

function saveDB(db: MockDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let idCounter = 0;
export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// --- Public API ---

export function getDB(): MockDB {
  return loadDB();
}

export function resetDB() {
  saveDB(structuredClone(SEED_DATA));
}

// Users
export function getUsers() {
  return loadDB().users;
}
export function getUserById(id: string) {
  return loadDB().users.find((u) => u.id === id);
}
export function findUser(email: string, password: string) {
  return loadDB().users.find(
    (u) => u.email === email && u.password === password,
  );
}
export function createUser(user: User) {
  const db = loadDB();
  db.users.push(user);
  saveDB(db);
}

// Jobs
export function getJobs() {
  return loadDB().jobs;
}
export function getPublishedJobs() {
  return loadDB().jobs.filter((j) => j.status === "published");
}
export function getJobsByAgent(agentId: string) {
  return loadDB().jobs.filter((j) => j.agentId === agentId);
}
export function getJobsByProperty(propertyId: string) {
  return loadDB().jobs.filter((j) => j.propertyId === propertyId);
}
export function createJob(job: Job) {
  const db = loadDB();
  db.jobs.push(job);
  saveDB(db);
}
export function updateJob(id: string, updates: Partial<Job>) {
  const db = loadDB();
  const idx = db.jobs.findIndex((j) => j.id === id);
  if (idx !== -1) {
    db.jobs[idx] = { ...db.jobs[idx], ...updates };
    saveDB(db);
  }
}

export function getJobById(id: string) {
  return loadDB().jobs.find((j) => j.id === id);
}

// Claim job
export function claimJob(jobId: string, contractorId: string) {
  const db = loadDB();
  const job = db.jobs.find((j) => j.id === jobId);
  if (job && job.status === "published" && !job.contractorId) {
    job.contractorId = contractorId;
    job.status = "in_progress";
    saveDB(db);
    return true;
  }
  return false;
}

// Properties
export function getProperties() {
  return loadDB().properties;
}
export function getPropertiesByAgent(agentId: string) {
  return loadDB().properties.filter((p) => p.agentId === agentId);
}
export function getPropertyById(id: string) {
  return loadDB().properties.find((p) => p.id === id);
}
export function createProperty(property: Property) {
  const db = loadDB();
  db.properties.push(property);
  saveDB(db);
}
export function updateProperty(id: string, updates: Partial<Property>) {
  const db = loadDB();
  const idx = db.properties.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.properties[idx] = { ...db.properties[idx], ...updates };
    saveDB(db);
  }
}

// Turnover history (demonstration data)
export function getTurnoverHistory() {
  return loadDB().turnoverHistory;
}

// Notifications
export function getNotifications(userId: string) {
  return loadDB().notifications.filter((n) => n.userId === userId);
}
export function addNotification(n: Notification) {
  const db = loadDB();
  db.notifications.push(n);
  saveDB(db);
}
export function notify(n: Omit<Notification, "id" | "read" | "createdAt">) {
  addNotification({ ...n, id: newId("n"), read: false, createdAt: new Date().toISOString() });
}
export function markNotificationRead(id: string) {
  const db = loadDB();
  const n = db.notifications.find((x) => x.id === id);
  if (n) {
    n.read = true;
    saveDB(db);
  }
}

// Contractor Profiles
export function getContractorProfiles() {
  return loadDB().contractorProfiles;
}
export function getContractorProfile(userId: string) {
  return loadDB().contractorProfiles.find((p) => p.userId === userId);
}
export function upsertContractorProfile(profile: ContractorProfile) {
  const db = loadDB();
  const idx = db.contractorProfiles.findIndex(
    (p) => p.userId === profile.userId,
  );
  if (idx !== -1) db.contractorProfiles[idx] = profile;
  else db.contractorProfiles.push(profile);
  saveDB(db);
}
export function updateContractorAvailability(userId: string, nextAvailableDate: string) {
  const db = loadDB();
  const profile = db.contractorProfiles.find((p) => p.userId === userId);
  if (profile) {
    profile.nextAvailableDate = nextAvailableDate;
    saveDB(db);
  }
}

// Saved Jobs
export function getSavedJobs(contractorId: string): string[] {
  return loadDB().savedJobs[contractorId] || [];
}
export function toggleSaveJob(contractorId: string, jobId: string) {
  const db = loadDB();
  if (!db.savedJobs[contractorId]) db.savedJobs[contractorId] = [];
  const idx = db.savedJobs[contractorId].indexOf(jobId);
  if (idx !== -1) db.savedJobs[contractorId].splice(idx, 1);
  else db.savedJobs[contractorId].push(jobId);
  saveDB(db);
}
