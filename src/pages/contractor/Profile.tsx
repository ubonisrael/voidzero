import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getContractorProfile, upsertContractorProfile } from "@/lib/mock-db";
import { propertiesForContractor, withRecalculation } from "@/lib/readiness-actions";
import { ContractorAvailability, ContractorProfile as ProfileType, TRADES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ALL_SKILLS = TRADES;

export default function ContractorProfile() {
  const { user } = useAuth();
  const existing = getContractorProfile(user!.id);

  const [skills, setSkills] = useState<string[]>(existing?.skills || []);
  const [experience, setExperience] = useState(existing?.experience || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [hourlyRate, setHourlyRate] = useState(String(existing?.hourlyRate || ""));
  const [bio, setBio] = useState(existing?.bio || "");
  const [availability, setAvailability] = useState<ContractorAvailability>(existing?.availability || "available");
  const [nextAvailableDate, setNextAvailableDate] = useState(existing?.nextAvailableDate || "");

  const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = () => {
    const profile: ProfileType = {
      ...existing,
      userId: user!.id, skills, experience, location, hourlyRate: parseFloat(hourlyRate) || 0, bio,
      availability, nextAvailableDate: nextAvailableDate || undefined,
    };
    // Availability drives the start dates of this contractor's tasks, so recalculate affected properties.
    withRecalculation(propertiesForContractor(user!.id), `${user!.name} updated their availability`, () => upsertContractorProfile(profile));
    toast.success("Profile saved");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold">Profile</h2>
      <Card>
        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map(s => (
              <Badge key={s} variant={skills.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleSkill(s)}>{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Availability</Label>
              <Select value={availability} onValueChange={v => setAvailability(v as ContractorAvailability)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Available Date</Label>
              <Input type="date" value={nextAvailableDate} onChange={e => setNextAvailableDate(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Your next available date sets the earliest start of the jobs you claim and updates each property's ready-to-let forecast.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Experience</Label><Input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5 years" /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London" /></div>
          </div>
          <div className="space-y-2"><Label>Hourly Rate (£)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="25" /></div>
          <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell agents about yourself..." rows={4} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Performance</CardTitle>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Demo data</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Avg Completion Time</p><p className="text-xl font-bold">{existing?.avgCompletionDays !== undefined ? `${existing.avgCompletionDays} days` : "–"}</p></div>
            <div><p className="text-muted-foreground">Jobs Completed</p><p className="text-xl font-bold">{existing?.jobsCompleted ?? "–"}</p></div>
            <div><p className="text-muted-foreground">On-Time Completion</p><p className="text-xl font-bold">{existing?.onTimePct !== undefined ? `${existing.onTimePct}%` : "–"}</p></div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave}>Save Profile</Button>
    </div>
  );
}
