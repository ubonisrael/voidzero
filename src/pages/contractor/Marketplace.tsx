import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getPublishedJobs, addBidToJob, addNotification, toggleSaveJob, getSavedJobs, getUserById } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bookmark, BookmarkCheck, Send } from "lucide-react";
import { Bid } from "@/lib/types";

export default function Marketplace() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);
  const [bidJobId, setBidJobId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const jobs = getPublishedJobs().filter(j => j.status !== "completed" && j.status !== "draft" && !j.contractorId);
  const savedJobIds = getSavedJobs(user!.id);

  const handleBid = () => {
    if (!bidJobId || !bidAmount) return;
    const bid: Bid = {
      id: `bid-${Date.now()}`, contractorId: user!.id, jobId: bidJobId,
      bidAmount: parseFloat(bidAmount), message: bidMessage, status: "pending",
      createdAt: new Date().toISOString(),
    };
    addBidToJob(bidJobId, bid);
    const job = jobs.find(j => j.id === bidJobId);
    if (job) {
      addNotification({ id: `n-${Date.now()}`, userId: job.agentId, message: `${user!.name} placed a bid on ${job.title}`, read: false, createdAt: new Date().toISOString() });
    }
    setBidJobId(null); setBidAmount(""); setBidMessage("");
    setRefresh(r => r + 1);
  };

  const handleSave = (jobId: string) => {
    toggleSaveJob(user!.id, jobId);
    setRefresh(r => r + 1);
  };

  const alreadyBid = (jobId: string) => {
    const job = getPublishedJobs().find(j => j.id === jobId);
    return job?.bids.some(b => b.contractorId === user!.id) || false;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Job Marketplace</h2>
      {jobs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No available jobs right now.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map(job => {
            const agent = getUserById(job.agentId);
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(job.id)}>
                      {savedJobIds.includes(job.id) ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{job.category}</Badge>
                    <Badge variant={job.priority === "High" ? "destructive" : "secondary"}>{job.priority}</Badge>
                    {job.negotiable && <Badge variant="outline" className="border-primary text-primary">Negotiable</Badge>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">£{job.jobAmount}</p>
                      <p className="text-xs text-muted-foreground">Posted by {agent?.name}</p>
                    </div>
                    {alreadyBid(job.id) ? (
                      <Badge>Bid Placed</Badge>
                    ) : (
                      <Dialog open={bidJobId === job.id} onOpenChange={open => { if (!open) setBidJobId(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setBidJobId(job.id)}><Send className="mr-2 h-3 w-3" />Place Bid</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Place Bid – {job.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Bid Amount (£)</label>
                              <Input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={`Budget: £${job.jobAmount}`} />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Message</label>
                              <Textarea value={bidMessage} onChange={e => setBidMessage(e.target.value)} placeholder="Why are you the best fit..." rows={3} />
                            </div>
                            <Button onClick={handleBid} disabled={!bidAmount} className="w-full">Submit Bid</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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
