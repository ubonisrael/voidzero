import { useAuth } from "@/lib/auth-context";
import { getJobs, addNotification, getPropertyById } from "@/lib/mock-db";
import { completeJob, getSchedule, startJob } from "@/lib/readiness-actions";
import { formatTaskDates } from "@/lib/readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play } from "lucide-react";
import { useState } from "react";

export default function CurrentJobs() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);
  const jobs = getJobs().filter(
    (j) =>
      j.contractorId === user!.id &&
      (j.status === "in_progress" || j.status === "completed"),
  );

  const handleComplete = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      completeJob(jobId, user!.name);
      addNotification({
        id: `n-${Date.now()}`,
        userId: job.agentId,
        message: `${user!.name} completed '${job.title}'`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      addNotification({
        id: `n-${Date.now() + 1}`,
        userId: user!.id,
        message: `You completed '${job.title}'`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      setRefresh((r) => r + 1);
    }
  };
  const handleStart = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      startJob(jobId, user!.name);
      addNotification({
        id: `n-${Date.now()}`,
        userId: job.agentId,
        message: `${user!.name} started '${job.title}'`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      setRefresh((r) => r + 1);
    }
  };

  const scheduledTask = (jobId: string, propertyId?: string) =>
    propertyId ? getSchedule(propertyId)?.tasks.find((t) => t.jobId === jobId) : undefined;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Current Jobs</h2>
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active or completed jobs.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const property = job.propertyId ? getPropertyById(job.propertyId) : undefined;
            const task = scheduledTask(job.id, job.propertyId);
            return (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    {property && <p className="text-sm text-muted-foreground">{property.address}</p>}
                  </div>
                  <Badge
                    variant={
                      job.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {job.status === "in_progress" && !job.startedAt ? "scheduled" : job.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{job.category}</span>
                    <span>{job.priority} priority</span>
                    <span>£{job.jobAmount}</span>
                    {task && (
                      <span className="text-foreground">
                        {task.state === "completed" ? "Done" : "Scheduled"}: {formatTaskDates(task.start, task.end)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                  {job.status === "in_progress" && !job.startedAt && (
                    <Button size="sm" variant="outline" onClick={() => handleStart(job.id)}>
                      <Play className="mr-2 h-3 w-3" />
                      Start Job
                    </Button>
                  )}
                  {job.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(job.id)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="mr-2 h-3 w-3" />
                      Mark Complete
                    </Button>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
