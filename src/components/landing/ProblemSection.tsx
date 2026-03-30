import { FileWarning, Search, BarChart3, Users } from "lucide-react";

const problems = [
  { icon: FileWarning, title: "Manual Inspections", desc: "Managing inspection reports with spreadsheets and emails wastes hours every week." },
  { icon: Search, title: "Finding Contractors", desc: "Sourcing reliable contractors quickly is a constant challenge for agents." },
  { icon: BarChart3, title: "Tracking Repairs", desc: "No centralised way to monitor job progress across multiple properties." },
  { icon: Users, title: "Vendor Coordination", desc: "Coordinating multiple vendors for a single property turnover is chaotic." },
];

const ProblemSection = () => (
  <section className="section-padding surface-warm">
    <div className="container mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">The Problem</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          Property turnovers are broken
        </h2>
        <p className="text-muted-foreground text-lg">
          Letting agents and contractors waste time on fragmented, manual processes.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {problems.map((p) => (
          <div key={p.title} className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <p.icon className="text-primary" size={24} />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
