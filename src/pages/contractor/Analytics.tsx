import { useAuth } from "@/lib/auth-context";
import { getJobs } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ContractorAnalytics() {
  const { user } = useAuth();
  const jobs = getJobs();
  const myJobs = jobs.filter(j => j.contractorId === user!.id);
  const completed = myJobs.filter(j => j.status === "completed");
  const totalBids = jobs.reduce((s, j) => s + j.bids.filter(b => b.contractorId === user!.id).length, 0);
  const acceptedBids = jobs.reduce((s, j) => s + j.bids.filter(b => b.contractorId === user!.id && b.status === "accepted").length, 0);
  const bidRate = totalBids ? Math.round((acceptedBids / totalBids) * 100) : 0;
  const earnings = completed.reduce((s, j) => s + (j.bids.find(b => b.contractorId === user!.id && b.status === "accepted")?.bidAmount || j.jobAmount), 0);

  const chartData = [
    { name: "In Progress", value: myJobs.filter(j => j.status === "in_progress").length },
    { name: "Completed", value: completed.length },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Earnings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">£{earnings}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Jobs Completed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{completed.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bid Success Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{bidRate}%</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Jobs Overview</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(168,80%,36%)" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
