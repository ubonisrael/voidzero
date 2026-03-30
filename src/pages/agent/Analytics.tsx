import { useAuth } from "@/lib/auth-context";
import { getJobsByAgent } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    { name: "Pending", value: jobs.filter(j => j.status === "pending").length },
    { name: "In Progress", value: jobs.filter(j => j.status === "in_progress").length },
    { name: "Completed", value: completed.length },
  ].filter(d => d.value > 0);

  const categoryData = Object.entries(jobs.reduce((acc, j) => { acc[j.category] = (acc[j.category] || 0) + 1; return acc; }, {} as Record<string, number>))
    .map(([name, value]) => ({ name, value }));

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
    </div>
  );
}
