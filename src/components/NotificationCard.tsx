import { Link } from "react-router-dom";
import { AlertTriangle, Check, Home, RefreshCw, UserCheck } from "lucide-react";
import { Notification, NotificationType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TYPE_STYLE: Partial<Record<NotificationType, { icon: typeof Home; className: string }>> = {
  delay_risk: { icon: AlertTriangle, className: "text-red-600 bg-red-50" },
  forecast_updated: { icon: RefreshCw, className: "text-blue-600 bg-blue-50" },
  alternative_available: { icon: UserCheck, className: "text-amber-600 bg-amber-50" },
  property_ready: { icon: Home, className: "text-emerald-600 bg-emerald-50" },
};

export function NotificationCard({ notification: n, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const style = n.type ? TYPE_STYLE[n.type] : undefined;
  return (
    <Card className={n.read ? "opacity-60" : ""}>
      <CardContent className="flex items-center justify-between py-4 gap-3">
        <div className="flex items-center gap-3">
          {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          {style && (
            <div className={`rounded-full p-2 shrink-0 ${style.className}`}>
              <style.icon className="h-4 w-4" />
            </div>
          )}
          <div>
            {n.title && <p className="text-sm font-semibold">{n.title}</p>}
            <p className="text-sm">{n.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(n.createdAt).toLocaleDateString()}
              {n.link && (
                <Link to={n.link} className="ml-3 text-primary hover:underline">View plan</Link>
              )}
            </p>
          </div>
        </div>
        {!n.read && <Button size="sm" variant="ghost" onClick={() => onRead(n.id)}><Check className="h-4 w-4" /></Button>}
      </CardContent>
    </Card>
  );
}
