import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getContractorProfile, upsertContractorProfile } from "@/lib/mock-db";
import { ContractorProfile as ProfileType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ALL_SKILLS = ["Painting", "Cleaning", "Repairs", "Plumbing", "Electrical", "Carpentry"];

export default function ContractorProfile() {
  const { user } = useAuth();
  const existing = getContractorProfile(user!.id);

  const [skills, setSkills] = useState<string[]>(existing?.skills || []);
  const [experience, setExperience] = useState(existing?.experience || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [hourlyRate, setHourlyRate] = useState(String(existing?.hourlyRate || ""));
  const [bio, setBio] = useState(existing?.bio || "");

  const toggleSkill = (s: string) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = () => {
    const profile: ProfileType = { userId: user!.id, skills, experience, location, hourlyRate: parseFloat(hourlyRate) || 0, bio };
    upsertContractorProfile(profile);
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
      <Button onClick={handleSave}>Save Profile</Button>
    </div>
  );
}
