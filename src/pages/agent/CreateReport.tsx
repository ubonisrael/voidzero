import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { createJob } from "@/lib/mock-db";
import { AVAILABLE_ISSUES, ISSUE_CATEGORY_MAP, CATEGORY_PRIORITY_MAP, Job } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [jobAmount, setJobAmount] = useState("");
  const [negotiable, setNegotiable] = useState(false);

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  const categories = [...new Set(selectedIssues.map(i => ISSUE_CATEGORY_MAP[i]))];
  const mainCategory = categories[0] || "";
  const priority = mainCategory ? CATEGORY_PRIORITY_MAP[mainCategory] : "";

  const handleSave = (status: Job["status"]) => {
    if (!title || selectedIssues.length === 0 || !jobAmount) return;
    const job: Job = {
      id: `job-${Date.now()}`,
      title, description, issues: selectedIssues,
      category: mainCategory, priority,
      jobAmount: parseFloat(jobAmount), negotiable,
      status, agentId: user!.id, bids: [],
      createdAt: new Date().toISOString(),
    };
    createJob(job);
    navigate("/dashboard/jobs");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold">Create Checkout Report</h2>
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
        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Full Property Repaint – 42 Oak Lane" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work required..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Job Amount (£)</Label>
              <Input id="amount" type="number" value={jobAmount} onChange={e => setJobAmount(e.target.value)} placeholder="500" />
            </div>
            <div className="space-y-2">
              <Label>Negotiable</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={negotiable} onCheckedChange={setNegotiable} />
                <span className="text-sm text-muted-foreground">{negotiable ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleSave("draft")} disabled={!title || selectedIssues.length === 0 || !jobAmount}>Save as Draft</Button>
        <Button onClick={() => handleSave("published")} disabled={!title || selectedIssues.length === 0 || !jobAmount}>Publish Job</Button>
      </div>
    </div>
  );
}
