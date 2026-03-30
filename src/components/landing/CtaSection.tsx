import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, HardHat } from "lucide-react";

const CtaSection = () => (
  <section className="section-padding">
    <div className="container mx-auto">
      <div className="rounded-2xl bg-foreground text-background p-10 md:p-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(168_80%_36%/0.15),transparent_60%)]" />
        <div className="relative">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Start Managing Property Turnovers Smarter
          </h2>
          <p className="text-background/70 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of agents and contractors already using VoidZero to streamline their workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link to="/signup"><Building2 size={18} /> Sign Up as Agent</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 border-background/20 text-foreground hover:bg-background/10" asChild>
              <Link to="/signup"><HardHat size={18} /> Join as Contractor</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CtaSection;
