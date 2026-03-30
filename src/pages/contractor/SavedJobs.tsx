import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSavedJobs, getJobById, toggleSaveJob } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookmarkX } from "lucide-react";

export default function SavedJobs() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);
  const savedIds = getSavedJobs(user!.id);
  const jobs = savedIds.map(id => getJobById(id)).filter(Boolean);

  const handleRemove = (jobId: string) => {
    toggleSaveJob(user!.id, jobId);
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Saved Jobs</h2>
      {jobs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No saved jobs.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => job && (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(job.id)}><BookmarkX className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{job.category}</Badge>
                  <span>£{job.jobAmount}</span>
                  <span>{job.priority} priority</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
