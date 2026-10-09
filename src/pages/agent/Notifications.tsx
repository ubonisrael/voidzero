import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getNotifications, markNotificationRead } from "@/lib/mock-db";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { NotificationCard } from "@/components/NotificationCard";

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
          {notifications.map(n => <NotificationCard key={n.id} notification={n} onRead={handleRead} />)}
        </div>
      )}
    </div>
  );
}
