import { useAuth } from "@/lib/auth-context";
import { getJobs } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CurrentJobs() {
  const { user } = useAuth();
  const jobs = getJobs().filter(j => j.contractorId === user!.id && (j.status === "in_progress" || j.status === "completed"));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Current Jobs</h2>
      {jobs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No active or completed jobs.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Badge variant={job.status === "completed" ? "default" : "secondary"}>{job.status.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{job.category}</span>
                  <span>{job.priority} priority</span>
                  <span>£{job.jobAmount}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
