import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobById, updateBidStatus, getUserById, addNotification, updateJob } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function AgentJobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);
  const job = getJobById(jobId!);

  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  const contractor = job.contractorId ? getUserById(job.contractorId) : null;

  const handleBid = (bidId: string, status: "accepted" | "rejected") => {
    updateBidStatus(job.id, bidId, status);
    if (status === "accepted") {
      const bid = job.bids.find(b => b.id === bidId);
      if (bid) {
        addNotification({ id: `n-${Date.now()}`, userId: bid.contractorId, message: `Your bid was accepted for ${job.title}`, read: false, createdAt: new Date().toISOString() });
      }
    }
    setRefresh(r => r + 1);
  };

  const handleComplete = () => {
    updateJob(job.id, { status: "completed" });
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
            <CardTitle className="text-xl">{refreshedJob.title}</CardTitle>
            <Badge variant={refreshedJob.status === "completed" ? "default" : "secondary"}>{refreshedJob.status.replace("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{refreshedJob.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Category</span><p className="font-medium">{refreshedJob.category}</p></div>
            <div><span className="text-muted-foreground">Priority</span><p className="font-medium">{refreshedJob.priority}</p></div>
            <div><span className="text-muted-foreground">Amount</span><p className="font-medium">£{refreshedJob.jobAmount}</p></div>
            <div><span className="text-muted-foreground">Negotiable</span><p className="font-medium">{refreshedJob.negotiable ? "Yes" : "No"}</p></div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Issues</span>
            <div className="flex flex-wrap gap-2 mt-1">{refreshedJob.issues.map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div>
          </div>
          {contractor && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm text-muted-foreground">Assigned Contractor</span>
              <p className="font-medium">{contractor.name}</p>
            </div>
          )}
          {refreshedJob.status === "in_progress" && (
            <Button onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="mr-2 h-4 w-4" />Mark Complete</Button>
          )}
        </CardContent>
      </Card>

      {!refreshedJob.contractorId && refreshedJob.bids.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Bids ({refreshedJob.bids.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {refreshedJob.bids.map(bid => {
              const bidder = getUserById(bid.contractorId);
              return (
                <div key={bid.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{bidder?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{bid.message}</p>
                    <p className="text-sm font-bold mt-1">£{bid.bidAmount}</p>
                  </div>
                  {bid.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleBid(bid.id, "accepted")}><CheckCircle className="mr-1 h-3 w-3" />Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleBid(bid.id, "rejected")}><XCircle className="mr-1 h-3 w-3" />Reject</Button>
                    </div>
                  )}
                  {bid.status !== "pending" && <Badge variant={bid.status === "accepted" ? "default" : "destructive"}>{bid.status}</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
