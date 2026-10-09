import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle, FlaskConical, History, RotateCcw, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getContractorProfile, getPropertiesByAgent, getPropertyById, getUserById, resetDB } from "@/lib/mock-db";
import { diffDays, formatDate } from "@/lib/readiness";
import { applyRecommendation, getRecommendation, getSchedule, simulateContractorDelay } from "@/lib/readiness-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyReadinessTable, StatusBadge } from "@/components/readiness/PropertyReadinessTable";
import { RepairSequence } from "@/components/readiness/RepairSequence";
import { ScheduleTimeline } from "@/components/readiness/ScheduleTimeline";

const contractorName = (id: string) => getUserById(id)?.name ?? "Contractor";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

export default function ReadinessPlan() {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh((r) => r + 1);
  const [delayDays, setDelayDays] = useState<Record<string, string>>({});

  if (!propertyId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold">Property Readiness</h2>
        <Card>
          <CardHeader><CardTitle className="text-lg">Properties</CardTitle></CardHeader>
          <CardContent>
            <PropertyReadinessTable properties={getPropertiesByAgent(user!.id)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const property = getPropertyById(propertyId);
  if (!property || property.agentId !== user!.id) {
    return <div className="text-center py-12 text-muted-foreground">Property not found</div>;
  }

  const schedule = getSchedule(propertyId)!;
  const rec = getRecommendation(propertyId);
  const history = property.forecastHistory;
  const last = history.at(-1);
  const prev = history.at(-2);
  const lastChange = last && prev ? diffDays(last.forecast, prev.forecast) : 0;
  const lastIntervention = property.interventions.at(-1);

  const handleApply = () => {
    if (!rec) return;
    applyRecommendation(propertyId, rec);
    toast.success(`${rec.taskTitle} reassigned to ${contractorName(rec.alternativeContractorId)}`);
    refresh();
  };

  const handleSimulate = (contractorId: string, jobId: string) => {
    const days = parseInt(delayDays[jobId] ?? "3");
    simulateContractorDelay(contractorId, days);
    toast(`${contractorName(contractorId)} now unavailable for ${days} more day${days === 1 ? "" : "s"}`);
    refresh();
  };

  const handleReset = () => {
    resetDB();
    toast("Demo data reset");
    refresh();
  };

  const delayable = schedule.tasks.filter((t) => t.state === "scheduled" && t.contractorId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="mb-2">
        <Link to="/dashboard/readiness"><ArrowLeft className="mr-2 h-4 w-4" />All properties</Link>
      </Button>
      <h2 className="text-2xl font-display font-bold">Property Readiness Plan</h2>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Field label="Property">{property.address}</Field>
            <Field label="Checkout Date">{formatDate(property.checkoutDate, "long")}</Field>
            <Field label="Target Ready Date">{formatDate(property.targetReadyDate, "long")}</Field>
            <Field label="Predicted Ready-to-Let Date">{formatDate(schedule.readyDate, "long")}</Field>
            <Field label="Readiness Status"><StatusBadge status={schedule.status} /></Field>
          </div>
          {lastChange > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Delay Detected: +{lastChange} Day{lastChange === 1 ? "" : "s"}</p>
                <p><span className="font-medium">Reason:</span> {last!.reason}.</p>
              </div>
            </div>
          )}
          {lastChange < 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{-lastChange} Day{lastChange === -1 ? "" : "s"} Recovered</p>
                <p>
                  {last!.reason}.
                  {lastIntervention &&
                    ` ${contractorName(lastIntervention.toContractorId)} now assigned in place of ${contractorName(lastIntervention.fromContractorId ?? "")}.`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {rec && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-amber-500" />Delay Risk Detected</CardTitle>
            <p className="text-sm text-muted-foreground">
              {contractorName(rec.currentContractorId)} ({rec.trade.toLowerCase()}) is unavailable until {formatDate(rec.currentAvailableDate, "long")}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <Field label="Current Ready-to-Let Forecast">{formatDate(rec.currentForecast, "long")}</Field>
              <Field label="Alternative Contractor Available">
                {formatDate(rec.alternativeAvailableDate, "long")}
                <p className="text-xs font-normal text-muted-foreground">
                  {contractorName(rec.alternativeContractorId)} · {getContractorProfile(rec.alternativeContractorId)?.onTimePct ?? "–"}% on time
                </p>
              </Field>
              <Field label="Revised Ready-to-Let Forecast">{formatDate(rec.revisedForecast, "long")}</Field>
              <Field label="Potential Time Recovered">
                <span className="text-emerald-600">{rec.daysRecovered} day{rec.daysRecovered === 1 ? "" : "s"}</span>
              </Field>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium">Recommended Intervention: </span>
              Reassign {rec.taskTitle.toLowerCase()} to an available qualified contractor.
            </div>
            <Button onClick={handleApply}><Zap className="mr-2 h-4 w-4" />Apply Recommendation</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Repair Sequence</CardTitle></CardHeader>
        <CardContent>
          <RepairSequence schedule={schedule} highlightJobId={rec?.jobId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Schedule</CardTitle></CardHeader>
        <CardContent>
          <ScheduleTimeline property={property} schedule={schedule} />
          <p className="text-xs text-muted-foreground mt-3">
            Each task starts at the latest of: its planned start, the end of the tasks it must happen after, and its contractor's next available date.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FlaskConical className="h-5 w-5 text-muted-foreground" />Demo Controls</CardTitle>
            <p className="text-sm text-muted-foreground">Simulate a change in circumstances. The forecast is recalculated from the task data.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {delayable.length === 0 && <p className="text-sm text-muted-foreground">No scheduled tasks with an assigned contractor.</p>}
            {delayable.map((t) => (
              <div key={t.jobId} className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex-1 min-w-[10rem]">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {contractorName(t.contractorId!)} · available {formatDate(getContractorProfile(t.contractorId!)?.nextAvailableDate ?? t.start)}
                  </p>
                </div>
                <Select value={delayDays[t.jobId] ?? "3"} onValueChange={(v) => setDelayDays((d) => ({ ...d, [t.jobId]: v }))}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>+{n} day{n === 1 ? "" : "s"}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => handleSimulate(t.contractorId!, t.jobId)}>Simulate delay</Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" />Reset demo data</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-muted-foreground" />Forecast History</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[...history].reverse().map((h, i, arr) => {
                const older = arr[i + 1];
                const delta = older ? diffDays(h.forecast, older.forecast) : 0;
                return (
                  <li key={h.at + i} className="text-sm border-l-2 pl-3">
                    <p className="font-medium">
                      {formatDate(h.forecast, "long")}
                      {delta !== 0 && (
                        <span className={`ml-2 text-xs ${delta > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {delta > 0 ? `+${delta}` : delta} day{Math.abs(delta) === 1 ? "" : "s"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{h.reason}</p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
