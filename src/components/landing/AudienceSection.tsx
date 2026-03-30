import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, HardHat, CheckCircle2, ArrowRight } from "lucide-react";

const agentBenefits = [
  "Post property repair jobs easily",
  "Review contractor bids side-by-side",
  "Track job progress in real time",
  "Earn commission on completed work",
];

const contractorBenefits = [
  "Discover available repair jobs nearby",
  "Submit competitive bids",
  "Manage your current jobs efficiently",
  "Track earnings and payment history",
];

const AudienceSection = () => (
  <>
    <section id="for-agents" className="section-padding">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Building2 size={16} /> For Letting Agents
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Turn inspections into completed repairs
            </h2>
            <ul className="space-y-4 mb-8">
              {agentBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={20} />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <Button className="gap-2" asChild><Link to="/signup">Post Your First Job <ArrowRight size={18} /></Link></Button>
          </div>
          <div className="bg-secondary rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display font-semibold text-sm text-foreground">42 Elm Street</span>
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">3 bids</span>
                </div>
                <p className="text-xs text-muted-foreground">Kitchen repair · Bathroom retile · Paint touch-up</p>
              </div>
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display font-semibold text-sm text-foreground">17 Oak Avenue</span>
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">5 bids</span>
                </div>
                <p className="text-xs text-muted-foreground">Full repaint · Carpet replacement · Deep clean</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="for-contractors" className="section-padding surface-warm">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-secondary rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display font-semibold text-sm text-foreground">Bathroom Retile</span>
                  <span className="font-display font-bold text-primary text-sm">£450</span>
                </div>
                <p className="text-xs text-muted-foreground">42 Elm Street · Due in 5 days</p>
              </div>
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display font-semibold text-sm text-foreground">Full Repaint</span>
                  <span className="font-display font-bold text-primary text-sm">£800</span>
                </div>
                <p className="text-xs text-muted-foreground">17 Oak Avenue · Due in 7 days</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <HardHat size={16} /> For Contractors
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Find jobs and grow your business
            </h2>
            <ul className="space-y-4 mb-8">
              {contractorBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={20} />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <Button className="gap-2" asChild><Link to="/signup">Start Bidding on Jobs <ArrowRight size={18} /></Link></Button>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default AudienceSection;
