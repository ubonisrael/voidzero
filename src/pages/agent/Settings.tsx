import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { resetDB } from "@/lib/mock-db";
import { useNavigate } from "react-router-dom";

export default function AgentSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold">Settings</h2>
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {user?.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
          <p><span className="text-muted-foreground">Role:</span> {user?.role}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Data</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Reset mock database to default seed data.</p>
          <Button variant="destructive" onClick={() => { resetDB(); navigate(0); }}>Reset Database</Button>
        </CardContent>
      </Card>
    </div>
  );
}
