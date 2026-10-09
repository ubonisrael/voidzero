import { useAuth } from "@/lib/auth-context";
import { getJobsByAgent, getPropertiesByAgent, getPropertyById } from "@/lib/mock-db";
import { diffDays } from "@/lib/readiness";
import { getSchedule } from "@/lib/readiness-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyReadinessTable } from "@/components/readiness/PropertyReadinessTable";
import { Briefcase, Clock, CheckCircle, DollarSign, Home, AlertTriangle, AlertOctagon, Timer } from "lucide-react";

export default function AgentOverview() {
  const { user } = useAuth();
  const jobs = getJobsByAgent(user!.id);
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === "in_progress" || j.status === "published").length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const commission = jobs.filter(j => j.status === "completed").reduce((sum, j) => sum + j.jobAmount * 0.12, 0);

  const inTurnover = getPropertiesByAgent(user!.id).filter(p => p.status === "in_turnover");
  const schedules = inTurnover.map(p => ({ property: p, schedule: getSchedule(p.id)! }));
  const countStatus = (status: string) => schedules.filter(s => s.schedule.status === status).length;
  const avgTurnover = schedules.length
    ? schedules.reduce((sum, s) => sum + diffDays(s.schedule.readyDate, s.property.checkoutDate), 0) / schedules.length
    : 0;

  const readinessStats = [
    { label: "Properties in Turnover", value: inTurnover.length, icon: Home, color: "text-primary" },
    { label: "On Track", value: countStatus("on_track"), icon: CheckCircle, color: "text-emerald-500" },
    { label: "At Risk", value: countStatus("at_risk"), icon: AlertTriangle, color: "text-amber-500" },
    { label: "Delayed", value: countStatus("delayed"), icon: AlertOctagon, color: "text-red-500" },
    { label: "Avg Predicted Turnover", value: `${avgTurnover.toFixed(1)} days`, icon: Timer, color: "text-primary" },
  ];

  const stats = [
    { label: "Total Jobs", value: totalJobs, icon: Briefcase, color: "text-primary" },
    { label: "Active Jobs", value: activeJobs, icon: Clock, color: "text-amber-500" },
    { label: "Completed", value: completedJobs, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Commission", value: `£${commission.toFixed(0)}`, icon: DollarSign, color: "text-primary" },
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
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {readinessStats.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Property Readiness</CardTitle></CardHeader>
        <CardContent>
          <PropertyReadinessTable properties={inTurnover} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Jobs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.propertyId && `${getPropertyById(job.propertyId)?.address} · `}{job.category} · {job.priority} priority</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  job.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                  job.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                  job.status === "published" ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>{job.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
