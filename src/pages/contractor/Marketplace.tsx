import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getPublishedJobs,
  claimJob,
  addNotification,
  toggleSaveJob,
  getSavedJobs,
  getUserById,
} from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, Hand, Send } from "lucide-react";

export default function Marketplace() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);

  const jobs = getPublishedJobs();
  const savedJobIds = getSavedJobs(user!.id);

  const handleClaim = (jobId: string) => {
    const success = claimJob(jobId, user!.id);
    if (success) {
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        addNotification({
          id: `n-${Date.now()}`,
          userId: job.agentId,
          message: `${user!.name} claimed the job '${job.title}'`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        addNotification({
          id: `n-${Date.now() + 1}`,
          userId: user!.id,
          message: `You claimed '${job.title}'`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      setRefresh((r) => r + 1);
    }
  };

  const handleSave = (jobId: string) => {
    toggleSaveJob(user!.id, jobId);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Job Marketplace</h2>
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No available jobs right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => {
            const agent = getUserById(job.agentId);
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSave(job.id)}
                    >
                      {savedJobIds.includes(job.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{job.category}</Badge>
                    <Badge
                      variant={
                        job.priority === "High" ? "destructive" : "secondary"
                      }
                    >
                      {job.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">£{job.jobAmount}</p>
                      <p className="text-xs text-muted-foreground">
                        Posted by {agent?.name}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleClaim(job.id)}>
                      <Hand className="mr-2 h-3 w-3" />
                      Claim Job
                    </Button>
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
