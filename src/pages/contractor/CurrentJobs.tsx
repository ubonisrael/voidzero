import { useAuth } from "@/lib/auth-context";
import { getJobs, updateJob, addNotification } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
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
      updateJob(jobId, { status: "completed" });
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
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Badge
                    variant={
                      job.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{job.category}</span>
                    <span>{job.priority} priority</span>
                    <span>£{job.jobAmount}</span>
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
