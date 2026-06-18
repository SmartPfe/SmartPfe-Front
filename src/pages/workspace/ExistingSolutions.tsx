import React from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function ExistingSolutions() {
  const solutions = [
    {
      id: 1,
      name: "Legacy Analytics Pro",
      category: "Direct Competitor",
      icon: "monitoring",
      description: "An industry-standard legacy tool used for analytics but lacks modern AI integrations and intuitive user interfaces.",
      pros: ["Enterprise-grade security", "High market penetration", "Stable architecture"],
      cons: ["Steep learning curve", "No predictive AI modeling", "Expensive licensing"],
      features: ["Data Export", "Static Dashboards", "Role Management"]
    },
    {
      id: 2,
      name: "OpenRetail AI",
      category: "Open Source",
      icon: "code_blocks",
      description: "An academic open-source project attempting to bring machine learning models to retail data analysis.",
      pros: ["Free to use", "Customizable codebase", "Modern tech stack"],
      cons: ["Lack of dedicated support", "Incomplete documentation", "No cloud hosting"],
      features: ["Forecasting ML", "Jupyter Notebooks", "API Access"]
    },
    {
      id: 3,
      name: "CloudSales Tracker",
      category: "Indirect Competitor",
      icon: "cloud_sync",
      description: "A lightweight cloud-native sales tracking app. Good for SMEs but lacks deep enterprise analytics.",
      pros: ["Very easy to use", "Affordable", "Great mobile app"],
      cons: ["Limited data limits", "No deep analytics", "Poor integration options"],
      features: ["Mobile App", "Basic Charts", "Email Reports"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="font-display text-display text-on-surface mb-2 flex items-center">
            Existing Solutions
            <InfoTooltip 
              label="Solutions" 
              tooltip="Outline the technical and functional solutions to the problem." 
            />
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">
            Analyze the state of the art to position your project and highlight your competitive advantage. Identify competitors and alternative methods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            Matrix View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Solution
          </button>
        </div>
      </div>

      {/* Suggested Analysis Action */}
      <div className="mb-8 p-6 rounded-xl bg-secondary-container border border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface/50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-secondary-container">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-medium text-on-secondary-container text-base">Generate Competitive Analysis</h3>
            <p className="text-on-secondary-container/80 text-sm mt-1">Let AI compare your proposed solution against the listed solutions to draft your "State of the Art" chapter.</p>
          </div>
        </div>
        <button className="whitespace-nowrap px-4 py-2 bg-surface text-on-surface rounded-md text-sm font-bold shadow-sm border border-outline-variant hover:bg-surface-container transition-colors">
          Draft Chapter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start min-h-0 pb-8">
        {solutions.map((solution) => (
          <div key={solution.id} className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
            <div className="p-5 border-b border-outline-variant bg-surface-container-lowest">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0 text-on-surface">
                  <span className="material-symbols-outlined">{solution.icon}</span>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button className="w-8 h-8 rounded-full text-outline hover:text-error hover:bg-error-container flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider">{solution.category}</span>
                <h3 className="font-bold text-lg text-on-surface">{solution.name}</h3>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-5">
              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {solution.description}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">add_circle</span>
                  Strengths
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {solution.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                      <span className="leading-snug">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-error">remove_circle</span>
                  Weaknesses
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {solution.cons.map((con, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
                      <span className="leading-snug">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
            
            <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low flex flex-wrap gap-2">
              {solution.features.map((feature, i) => (
                <span key={i} className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs font-medium text-on-surface-variant">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State / Add New Card */}
        <button className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
          <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <span className="font-medium">Add New Solution</span>
        </button>
      </div>
    </div>
  );
}
