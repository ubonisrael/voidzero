import { useAuth } from "@/lib/auth-context";
import { getJobsByAgent, getPropertiesByAgent, getTurnoverHistory } from "@/lib/mock-db";
import { diffDays } from "@/lib/readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(168,80%,36%)", "hsl(220,30%,18%)", "hsl(38,92%,50%)", "hsl(220,20%,60%)"];

export default function AgentAnalytics() {
  const { user } = useAuth();
  const jobs = getJobsByAgent(user!.id);
  const completed = jobs.filter(j => j.status === "completed");
  const totalRevenue = completed.reduce((s, j) => s + j.jobAmount * 0.12, 0);
  const avgValue = jobs.length ? jobs.reduce((s, j) => s + j.jobAmount, 0) / jobs.length : 0;

  const statusData = [
    { name: "Draft", value: jobs.filter(j => j.status === "draft").length },
    { name: "Published", value: jobs.filter(j => j.status === "published").length },
    { name: "In Progress", value: jobs.filter(j => j.status === "in_progress").length },
    { name: "Completed", value: completed.length },
  ].filter(d => d.value > 0);

  const categoryData = Object.entries(jobs.reduce((acc, j) => { acc[j.category] = (acc[j.category] || 0) + 1; return acc; }, {} as Record<string, number>))
    .map(([name, value]) => ({ name, value }));

  // Readiness metrics: seeded historical turnovers plus interventions applied in this session.
  const history = getTurnoverHistory();
  const liveInterventions = getPropertiesByAgent(user!.id).flatMap(p => p.interventions);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const delayed = history.filter(h => h.actualReadyDate > h.targetReadyDate);
  const delayCauses = Object.entries(
    delayed.reduce((acc, h) => { const c = h.delayCause ?? "Other"; acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const readinessStats = [
    { label: "Avg Property Turnover", value: `${avg(history.map(h => diffDays(h.actualReadyDate, h.checkoutDate))).toFixed(1)} days` },
    { label: "Avg Forecast vs Actual", value: `${avg(history.map(h => Math.abs(diffDays(h.actualReadyDate, h.forecastReadyDate)))).toFixed(1)} days` },
    { label: "Completed On Time", value: history.length - delayed.length },
    { label: "Properties Delayed", value: delayed.length },
    { label: "Avg Days Delayed", value: `${avg(delayed.map(h => diffDays(h.actualReadyDate, h.targetReadyDate))).toFixed(1)} days` },
    { label: "Interventions Applied", value: history.reduce((s, h) => s + h.interventions, 0) + liveInterventions.length },
    { label: "Days Recovered via Interventions", value: history.reduce((s, h) => s + h.daysRecovered, 0) + liveInterventions.reduce((s, i) => s + i.daysRecovered, 0) },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{jobs.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Commission Earned</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">£{totalRevenue.toFixed(0)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Job Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">£{avgValue.toFixed(0)}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Jobs by Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="hsl(168,80%,36%)" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Jobs by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <h3 className="text-xl font-display font-bold">Property Readiness</h3>
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Demo data, not actual customer performance</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {readinessStats.map(s => (
          <Card key={s.label}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Most Common Causes of Delay</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={delayCauses} layout="vertical" margin={{ left: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={150} fontSize={12} /><Tooltip /><Bar dataKey="value" name="Properties" fill="hsl(38,92%,50%)" radius={[0,4,4,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
