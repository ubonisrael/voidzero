import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getNotifications, markNotificationRead } from "@/lib/mock-db";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentNotifications() {
  const { user } = useAuth();
  const [, setRefresh] = useState(0);
  const notifications = getNotifications(user!.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRead = (id: string) => {
    markNotificationRead(id);
    setRefresh(r => r + 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold">Notifications</h2>
      {notifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />No notifications</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                  <div>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {!n.read && <Button size="sm" variant="ghost" onClick={() => handleRead(n.id)}><Check className="h-4 w-4" /></Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
