import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const HeroSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(168_80%_36%/0.06),transparent_60%)]" />
      <div className="container mx-auto relative">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6 animate-fade-up">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Property Turnover Marketplace
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Streamline Property Turnovers with{" "}
            <span className="text-gradient">One Smart Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            VoidZero helps letting agents turn checkout inspections into repair jobs
            and connects them with contractors who can complete the work quickly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link to="/signup">Get Started <ArrowRight size={18} /></Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
              <Link to="/login"><Play size={18} /> View Demo</Link>
            </Button>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="rounded-xl border shadow-2xl shadow-primary/10 overflow-hidden">
            <img
              src={dashboardPreview}
              alt="VoidZero dashboard showing repair jobs, contractor marketplace, and analytics"
              width={1200}
              height={800}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
