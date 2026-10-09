import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getPublishedJobs,
  claimJob,
  addNotification,
  toggleSaveJob,
  getSavedJobs,
  getUserById,
  getPropertyById,
  getContractorProfile,
} from "@/lib/mock-db";
import { projectedSchedule, withRecalculation } from "@/lib/readiness-actions";
import { formatTaskDates } from "@/lib/readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, Hand, Send } from "lucide-react";

export default function Marketplace() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);

  const jobs = getPublishedJobs();
  const savedJobIds = getSavedJobs(user!.id);
  const skills = getContractorProfile(user!.id)?.skills ?? [];

  const handleClaim = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    // Claiming records this contractor's availability against the task and re-forecasts the property.
    const success = withRecalculation([job?.propertyId], `${user!.name} claimed ${job?.title}`, () => claimJob(jobId, user!.id));
    if (success) {
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
            const property = job.propertyId ? getPropertyById(job.propertyId) : undefined;
            const matchesSkills = skills.includes(job.trade ?? job.category);
            const projected = matchesSkills ? projectedSchedule(job.id, user!.id) : null;
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      {property && <p className="text-sm text-muted-foreground">{property.address}</p>}
                    </div>
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
                    {!!job.durationDays && (
                      <Badge variant="outline">{job.durationDays} day{job.durationDays === 1 ? "" : "s"}</Badge>
                    )}
                    {matchesSkills && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Matches your skills</Badge>
                    )}
                  </div>
                  {projected && (
                    <p className="text-xs text-muted-foreground">
                      If you claim: {formatTaskDates(projected.start, projected.end)}, based on your availability and the job's dependencies
                    </p>
                  )}
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
