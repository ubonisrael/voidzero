import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getJobById, getUserById, addNotification, getPropertyById, getContractorProfile } from "@/lib/mock-db";
import { completeJob, getSchedule } from "@/lib/readiness-actions";
import { formatDate, formatTaskDates } from "@/lib/readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarClock, CheckCircle } from "lucide-react";

export default function AgentJobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);
  const job = getJobById(jobId!);

  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  const contractor = job.contractorId ? getUserById(job.contractorId) : null;
  const contractorProfile = job.contractorId ? getContractorProfile(job.contractorId) : null;
  const property = job.propertyId ? getPropertyById(job.propertyId) : null;
  const task = property ? getSchedule(property.id)?.tasks.find(t => t.jobId === job.id) : null;
  const dependencies = (job.dependsOn ?? []).map(id => getJobById(id)?.title).filter(Boolean);

  const handleComplete = () => {
    completeJob(job.id, "Agent");
    if (job.contractorId) {
      addNotification({ id: `n-${Date.now()}`, userId: job.contractorId, message: `Job completed: ${job.title}`, read: false, createdAt: new Date().toISOString() });
    }
    setRefresh(r => r + 1);
  };

  const refreshedJob = getJobById(jobId!)!;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{refreshedJob.title}</CardTitle>
              {property && <p className="text-sm text-muted-foreground">{property.address}</p>}
            </div>
            <Badge variant={refreshedJob.status === "completed" ? "default" : "secondary"}>{refreshedJob.status.replace("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{refreshedJob.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Category</span><p className="font-medium">{refreshedJob.category}</p></div>
            <div><span className="text-muted-foreground">Priority</span><p className="font-medium">{refreshedJob.priority}</p></div>
            <div><span className="text-muted-foreground">Amount</span><p className="font-medium">£{refreshedJob.jobAmount}</p></div>
            {!!refreshedJob.durationDays && <div><span className="text-muted-foreground">Duration</span><p className="font-medium">{refreshedJob.durationDays} day{refreshedJob.durationDays === 1 ? "" : "s"}</p></div>}
            </div>
          {property && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Must happen after</span><p className="font-medium">{dependencies.length ? dependencies.join(", ") : "None"}</p></div>
              <div><span className="text-muted-foreground">Can run in parallel</span><p className="font-medium">{refreshedJob.canRunParallel ? "Yes" : "No"}</p></div>
              {task && <div><span className="text-muted-foreground">Scheduled</span><p className="font-medium">{formatTaskDates(task.start, task.end)}</p></div>}
            </div>
          )}
          {refreshedJob.issues.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Issues</span>
              <div className="flex flex-wrap gap-2 mt-1">{refreshedJob.issues.map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div>
            </div>
          )}
          {contractor ? (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm text-muted-foreground">Assigned Contractor</span>
              <p className="font-medium">{contractor.name}</p>
              {contractorProfile?.nextAvailableDate && (
                <p className="text-xs text-muted-foreground">
                  Next available {formatDate(contractorProfile.nextAvailableDate, "long")}
                  {contractorProfile.onTimePct !== undefined && ` · ${contractorProfile.onTimePct}% on time`}
                </p>
              )}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {refreshedJob.status === "in_progress" && (
              <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="mr-2 h-4 w-4" />Mark Complete</Button>
            )}
            {property && (
              <Button variant="outline" asChild>
                <Link to={`/dashboard/readiness/${property.id}`}><CalendarClock className="mr-2 h-4 w-4" />View Property Readiness Plan</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
