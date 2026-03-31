import { Zap, Store, LayoutDashboard, Bell, DollarSign, TrendingUp } from "lucide-react";

const features = [
  { icon: Zap, title: "Inspection-to-Job Automation", desc: "Convert inspection issues into structured repair jobs automatically." },
  { icon: Store, title: "Job Claiming Marketplace", desc: "A first-come, first-served marketplace where contractors claim available jobs." },
  { icon: LayoutDashboard, title: "Job Tracking Dashboard", desc: "Real-time overview of all property turnover jobs and statuses." },
  { icon: Bell, title: "Smart Notifications", desc: "Get notified instantly when jobs are claimed or statuses change." },
  { icon: DollarSign, title: "Financial Tracking", desc: "Track payments, agent commissions, and contractor earnings." },
  { icon: TrendingUp, title: "Analytics & Reports", desc: "Actionable insights on jobs completed, earnings, and performance." },
];

const FeaturesSection = () => (
  <section id="features" className="section-padding surface-warm">
    <div className="container mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          Everything you need to manage turnovers
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="bg-card rounded-xl border p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="text-primary" size={22} />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
