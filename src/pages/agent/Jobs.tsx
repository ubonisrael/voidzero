import { useAuth } from "@/lib/auth-context";
import { getJobsByAgent } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function AgentJobs() {
  const { user } = useAuth();
  const jobs = getJobsByAgent(user!.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Jobs</h2>
        <Button asChild><Link to="/dashboard/create-report"><Plus className="mr-2 h-4 w-4" />Create Report</Link></Button>
      </div>
      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs yet. Create your first report.</CardContent></Card>
        ) : jobs.map(job => (
          <Link key={job.id} to={`/dashboard/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    job.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    job.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    job.status === "pending" ? "bg-amber-100 text-amber-700" :
                    job.status === "published" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{job.status.replace("_", " ")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{job.category}</span>
                  <span>{job.priority} priority</span>
                  <span>£{job.jobAmount}</span>
                  <span>{job.bids.length} bid{job.bids.length !== 1 ? "s" : ""}</span>
                  {job.negotiable && <span className="text-primary text-xs">Negotiable</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
