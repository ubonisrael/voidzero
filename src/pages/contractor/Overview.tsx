import { useAuth } from "@/lib/auth-context";
import { getJobs } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, CheckCircle, Send, DollarSign } from "lucide-react";

export default function ContractorOverview() {
  const { user } = useAuth();
  const jobs = getJobs();
  const activeJobs = jobs.filter(j => j.contractorId === user!.id && j.status === "in_progress").length;
  const completedJobs = jobs.filter(j => j.contractorId === user!.id && j.status === "completed").length;
  const activeBids = jobs.reduce((s, j) => s + j.bids.filter(b => b.contractorId === user!.id && b.status === "pending").length, 0);
  const earnings = jobs.filter(j => j.contractorId === user!.id && j.status === "completed")
    .reduce((s, j) => s + (j.bids.find(b => b.contractorId === user!.id && b.status === "accepted")?.bidAmount || j.jobAmount), 0);

  const stats = [
    { label: "Active Jobs", value: activeJobs, icon: Hammer, color: "text-primary" },
    { label: "Completed", value: completedJobs, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Active Bids", value: activeBids, icon: Send, color: "text-amber-500" },
    { label: "Earnings", value: `£${earnings}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Welcome back, {user?.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
