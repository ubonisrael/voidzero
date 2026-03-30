import { Upload, Cog, Handshake } from "lucide-react";

const steps = [
  { icon: Upload, num: "01", title: "Upload Inspection", desc: "Agent uploads or generates a checkout inspection report for the property." },
  { icon: Cog, num: "02", title: "Auto-Generate Jobs", desc: "The system converts issues into repair jobs and publishes them to the marketplace." },
  { icon: Handshake, num: "03", title: "Contractors Bid", desc: "Contractors bid for the job and the agent selects the best offer." },
];

const SolutionSection = () => (
  <section id="how-it-works" className="section-padding">
    <div className="container mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          Three simple steps to a completed turnover
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={s.num} className="relative text-center group">
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
            )}
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
              <s.icon className="text-primary" size={32} />
            </div>
            <span className="text-xs font-bold text-primary tracking-widest">{s.num}</span>
            <h3 className="font-display text-xl font-semibold text-foreground mt-2 mb-3">{s.title}</h3>
            <p className="text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;
