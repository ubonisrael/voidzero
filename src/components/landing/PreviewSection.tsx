import { LayoutDashboard, Store, FileText } from "lucide-react";

const previews = [
  {
    icon: LayoutDashboard,
    title: "Job Dashboard",
    desc: "Track all repair jobs across your property portfolio with real-time status updates.",
    items: ["12 Active Jobs", "4 Pending Bids", "8 Completed"],
  },
  {
    icon: Store,
    title: "Contractor Marketplace",
    desc: "Browse verified contractors, compare bids, and select the best fit for each job.",
    items: ["48 Contractors", "4.8★ Avg Rating", "2hr Response"],
  },
  {
    icon: FileText,
    title: "Job Reports",
    desc: "Detailed reports for every completed job, including costs, timelines, and photos.",
    items: ["Auto-Generated", "PDF Export", "Photo Evidence"],
  },
];

const PreviewSection = () => (
  <section className="section-padding">
    <div className="container mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Platform Preview</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          See the platform in action
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {previews.map((p) => (
          <div key={p.title} className="rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-secondary p-6 flex items-center justify-center">
              <p.icon className="text-primary" size={48} strokeWidth={1.5} />
            </div>
            <div className="p-6">
              <h3 className="font-display font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
              <div className="flex flex-wrap gap-2">
                {p.items.map((item) => (
                  <span key={item} className="text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PreviewSection;
