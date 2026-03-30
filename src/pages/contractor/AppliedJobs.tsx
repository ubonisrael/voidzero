import { useAuth } from "@/lib/auth-context";
import { getJobs } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AppliedJobs() {
  const { user } = useAuth();
  const jobs = getJobs().filter(j => j.bids.some(b => b.contractorId === user!.id));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Applied Jobs</h2>
      {jobs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">You haven't bid on any jobs yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => {
            const myBid = job.bids.find(b => b.contractorId === user!.id)!;
            return (
              <Card key={job.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <Badge variant={myBid.status === "accepted" ? "default" : myBid.status === "rejected" ? "destructive" : "secondary"}>{myBid.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{job.category}</span>
                    <span>Your bid: £{myBid.bidAmount}</span>
                    <span>Budget: £{job.jobAmount}</span>
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
