import { useNavigate } from "react-router-dom";
import { Property } from "@/lib/types";
import { ReadinessStatus, STATUS_CLASS, STATUS_LABEL, formatDate } from "@/lib/readiness";
import { getSchedule } from "@/lib/readiness-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function StatusBadge({ status }: { status: ReadinessStatus }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PropertyReadinessTable({ properties }: { properties: Property[] }) {
  const navigate = useNavigate();
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No properties yet. Create a checkout report to start one.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Target Date</TableHead>
          <TableHead>Forecast</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((p) => {
          const schedule = getSchedule(p.id)!;
          return (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/readiness/${p.id}`)}>
              <TableCell className="font-medium">{p.address}</TableCell>
              <TableCell>{formatDate(p.targetReadyDate)}</TableCell>
              <TableCell>{formatDate(schedule.readyDate)}</TableCell>
              <TableCell><StatusBadge status={schedule.status} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
