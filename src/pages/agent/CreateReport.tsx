import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { createJob, createProperty, getContractorProfiles, newId } from "@/lib/mock-db";
import { AVAILABLE_ISSUES, ISSUE_CATEGORY_MAP, CATEGORY_PRIORITY_MAP, Job, PRIORITIES, Property, TRADES } from "@/lib/types";
import { formatDate, formatTaskDates, scheduleProperty } from "@/lib/readiness";
import { initialiseForecast } from "@/lib/readiness-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/readiness/PropertyReadinessTable";
import { Plus, Trash2 } from "lucide-react";

interface DraftTask {
  key: string;
  /** Generated from the selected issues (one per trade) rather than added by hand. */
  auto: boolean;
  name: string;
  trade: string;
  durationDays: string;
  dependsOn: string; // task key, or "none"
  canRunParallel: boolean;
  priority: string;
  estimatedStartDate: string;
  amount: string;
}

// Typical order of trades in a turnover, used to suggest a default sequence.
const TRADE_ORDER = ["Electrical", "Plumbing", "Plastering", "Carpentry", "Repairs", "Painting", "Cleaning"];
const TRADE_TASK_NAME: Record<string, string> = {
  Electrical: "Electrical Repair",
  Plumbing: "Plumbing Repair",
  Plastering: "Plaster Repair",
  Carpentry: "Carpentry",
  Repairs: "General Repairs",
  Painting: "Painting",
  Cleaning: "Deep Cleaning",
};
// Small fix-ups that don't block other trades run in parallel by default.
const PARALLEL_TRADES = ["Repairs", "Carpentry"];

let keyCounter = 0;
const newKey = () => `t${keyCounter++}`;

function draftTask(trade: string, auto: boolean): DraftTask {
  return {
    key: newKey(),
    auto,
    name: TRADE_TASK_NAME[trade] ?? trade,
    trade,
    durationDays: "1",
    dependsOn: "none",
    canRunParallel: PARALLEL_TRADES.includes(trade),
    priority: CATEGORY_PRIORITY_MAP[trade] ?? "Medium",
    estimatedStartDate: "",
    amount: "",
  };
}

/** Keeps one auto task per selected trade (preserving edits) and chains them in trade order. */
function syncAutoTasks(tasks: DraftTask[], selectedIssues: string[]): DraftTask[] {
  const trades = [...new Set(selectedIssues.map((i) => ISSUE_CATEGORY_MAP[i]))].sort(
    (a, b) => TRADE_ORDER.indexOf(a) - TRADE_ORDER.indexOf(b),
  );
  const existing = new Map(tasks.filter((t) => t.auto).map((t) => [t.trade, t]));
  const auto = trades.map((trade) => existing.get(trade) ?? draftTask(trade, true));
  const manual = tasks.filter((t) => !t.auto);
  const kept = new Set([...auto, ...manual].map((t) => t.key));
  // Newly added auto tasks follow the previous sequential task by default.
  let prev: DraftTask | undefined;
  for (const t of auto) {
    if (!existing.has(t.trade) && prev && !t.canRunParallel) t.dependsOn = prev.key;
    if (!t.canRunParallel) prev = t;
  }
  return [...auto, ...manual].map((t) => (t.dependsOn !== "none" && !kept.has(t.dependsOn) ? { ...t, dependsOn: "none" } : t));
}

export default function CreateReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [targetReadyDate, setTargetReadyDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [tasks, setTasks] = useState<DraftTask[]>([]);

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  useEffect(() => {
    setTasks(prev => syncAutoTasks(prev, selectedIssues));
  }, [selectedIssues]);

  const updateTask = (key: string, updates: Partial<DraftTask>) =>
    setTasks(prev => prev.map(t => (t.key === key ? { ...t, ...updates } : t)));
  const removeTask = (key: string) =>
    setTasks(prev => prev.filter(t => t.key !== key).map(t => (t.dependsOn === key ? { ...t, dependsOn: "none" } : t)));

  const categories = [...new Set(selectedIssues.map(i => ISSUE_CATEGORY_MAP[i]))];
  const mainCategory = categories[0] || "";
  const priority = mainCategory ? CATEGORY_PRIORITY_MAP[mainCategory] : "";

  const tasksValid = tasks.length > 0 && tasks.every(t => t.name && parseInt(t.durationDays) >= 1 && parseFloat(t.amount) > 0);
  const valid = !!address && !!checkoutDate && !!targetReadyDate && tasksValid;

  // Build the property and its jobs; also used for the live forecast preview.
  const build = (status: Job["status"]) => {
    const propertyId = newId("prop");
    const ids = new Map(tasks.map(t => [t.key, newId("job")]));
    const property: Property = {
      id: propertyId, agentId: user!.id, address, checkoutDate, targetReadyDate,
      status: "in_turnover", forecastHistory: [], interventions: [],
    };
    const jobs: Job[] = tasks.map((t, i) => {
      const earlierKeys = tasks.slice(0, i).map(e => e.key);
      return {
        id: ids.get(t.key)!,
        title: t.name,
        issues: selectedIssues.filter(issue => ISSUE_CATEGORY_MAP[issue] === t.trade),
        category: t.trade,
        trade: t.trade,
        priority: t.priority,
        description,
        jobAmount: parseFloat(t.amount) || 0,
        status,
        agentId: user!.id,
        createdAt: new Date().toISOString(),
        propertyId,
        durationDays: Math.max(1, parseInt(t.durationDays) || 1),
        dependsOn: earlierKeys.includes(t.dependsOn) ? [ids.get(t.dependsOn)!] : [],
        canRunParallel: t.canRunParallel,
        estimatedStartDate: t.estimatedStartDate || undefined,
      };
    });
    return { property, jobs };
  };

  const preview = checkoutDate && targetReadyDate && tasks.length > 0
    ? (() => { const { property, jobs } = build("draft"); return { jobs, schedule: scheduleProperty(property, jobs, getContractorProfiles()) }; })()
    : null;

  const handleSave = (status: Job["status"]) => {
    if (!valid) return;
    const { property, jobs } = build(status);
    createProperty(property);
    jobs.forEach(createJob);
    initialiseForecast(property.id);
    navigate(`/dashboard/readiness/${property.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold">Create Checkout Report</h2>
      <Card>
        <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address / Reference</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 42 Oak Lane" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkout">Checkout Date</Label>
              <Input id="checkout" type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Ready-to-Let Date</Label>
              <Input id="target" type="date" value={targetReadyDate} min={checkoutDate} onChange={e => setTargetReadyDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Inspection Issues</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {AVAILABLE_ISSUES.map(issue => (
            <label key={issue} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={selectedIssues.includes(issue)} onCheckedChange={() => toggleIssue(issue)} />
              <div className="flex-1">
                <span className="text-sm font-medium">{issue}</span>
                <span className="ml-2 text-xs text-muted-foreground">→ {ISSUE_CATEGORY_MAP[issue]}</span>
              </div>
            </label>
          ))}
          {mainCategory && (
            <div className="flex gap-4 pt-2 text-sm">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">Category: {mainCategory}</span>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-700">Priority: {priority}</span>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Repair Tasks</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setTasks(prev => [...prev, draftTask("Repairs", false)])}>
            <Plus className="mr-2 h-4 w-4" />Add task
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Select inspection issues to generate repair tasks, or add one manually.</p>
          )}
          {tasks.map((t, i) => {
            const earlier = tasks.slice(0, i);
            return (
              <div key={t.key} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-5">{i + 1}.</span>
                  <Input value={t.name} onChange={e => updateTask(t.key, { name: e.target.value })} placeholder="Task name" className="font-medium" />
                  <Button size="icon" variant="ghost" onClick={() => removeTask(t.key)} aria-label="Remove task"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Required Trade</Label>
                    <Select value={t.trade} onValueChange={v => updateTask(t.key, { trade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TRADES.map(tr => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (days)</Label>
                    <Input type="number" min={1} value={t.durationDays} onChange={e => updateTask(t.key, { durationDays: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <Select value={t.priority} onValueChange={v => updateTask(t.key, { priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (£)</Label>
                    <Input type="number" value={t.amount} onChange={e => updateTask(t.key, { amount: e.target.value })} placeholder="250" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Must happen after</Label>
                    <Select value={earlier.some(e => e.key === t.dependsOn) ? t.dependsOn : "none"} onValueChange={v => updateTask(t.key, { dependsOn: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {earlier.map(e => <SelectItem key={e.key} value={e.key}>{e.name || "Untitled task"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estimated start</Label>
                    <Input type="date" value={t.estimatedStartDate} min={checkoutDate} onChange={e => updateTask(t.key, { estimatedStartDate: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm self-end pb-2 cursor-pointer">
                    <Checkbox checked={t.canRunParallel} onCheckedChange={c => updateTask(t.key, { canRunParallel: c === true })} />
                    Can run in parallel
                  </label>
                </div>
              </div>
            );
          })}
          {preview && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">Forecast preview: ready to let {formatDate(preview.schedule.readyDate, "long")}</span>
                <StatusBadge status={preview.schedule.status} />
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {preview.schedule.tasks.map(st => (
                  <li key={st.jobId}>{st.title}: {formatTaskDates(st.start, st.end)}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Based on durations, dependencies and the earliest available qualified contractors.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work required..." rows={4} />
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={!valid}>Save as Draft</Button>
        <Button onClick={() => handleSave("published")} disabled={!valid}>Publish Jobs</Button>
      </div>
    </div>
  );
}
