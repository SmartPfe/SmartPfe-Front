import InfoTooltip from "@/components/ui/InfoTooltip";

export default function Overview() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-xl shrink-0">
        <h1 className="text-display text-on-surface mb-2 flex items-center">
          Project Overview
          <InfoTooltip 
            label="Overview" 
            tooltip="Define the core premise, goals, and domain of your project." 
          />
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-[42rem]">Manage your project parameters and track methodological progress in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter shrink-0">
        {/* Project Summary Card */}
        <div className="lg:col-span-8 bg-surface border border-outline-variant rounded-xl p-lg flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex justify-between items-start mb-xl relative z-10 w-full">
            <div className="w-full">
              <div className="flex items-center gap-sm mb-3">
                <span className="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant text-label-sm uppercase tracking-wider shrink-0">Active Project</span>
                <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-label-sm uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[14px]">sync</span> In Progress
                </span>
              </div>
              <h2 className="text-headline-lg text-on-surface mb-1">AI-Powered Analytics Platform for Retail</h2>
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors shrink-0">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-auto relative z-10">
            <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant/50 w-full shrink-0">
              <p className="text-label-sm text-on-surface-variant uppercase mb-1">Domain</p>
              <p className="text-body-lg font-medium text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">memory</span> Machine Learning &amp; E-commerce
              </p>
            </div>
            <div className="p-md bg-surface-container-low rounded-lg border border-outline-variant/50 w-full shrink-0">
              <p className="text-label-sm text-on-surface-variant uppercase mb-1">Company Partner</p>
              <p className="text-body-lg font-medium text-on-surface flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-[20px] text-secondary">corporate_fare</span> TechVision Analytics Corp.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Card */}
        <div className="lg:col-span-4 bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-surface-tint/20 opacity-50"></div>
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className="material-symbols-outlined text-secondary-fixed">tips_and_updates</span>
              <span className="text-label-sm text-secondary-fixed uppercase tracking-wider">Suggested Action</span>
            </div>
            <h3 className="text-headline-md mb-2">Draft your Problem Statement</h3>
            <p className="text-body-md text-outline-variant opacity-90 mb-6 shrink-0">You've established the domain. Now, clearly define the core issue your platform will solve.</p>
          </div>
          <button className="relative z-10 mt-auto w-full py-3 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-label-md hover:bg-white transition-colors flex justify-center items-center gap-2 group-hover:-translate-y-1 duration-200 shrink-0">
            Start Drafting <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Master Progress */}
        <div className="lg:col-span-12 bg-surface border border-outline-variant rounded-xl overflow-hidden mt-md w-full shrink-0">
          <div className="flex flex-col md:flex-row border-b border-outline-variant w-full shrink-0">
            <div className="p-xl border-b md:border-b-0 md:border-r border-outline-variant md:w-1/3 flex flex-col justify-center items-center bg-surface-container-low shrink-0">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 shrink-0">Master Progress</p>
              <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90 shrink-0" viewBox="0 0 100 100">
                  <circle className="text-outline-variant/30" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="2"></circle>
                  <circle className="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="283" strokeDashoffset="240" strokeWidth="4"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-display text-primary">15%</span>
                  <span className="text-label-sm text-on-surface-variant shrink-0">Complete</span>
                </div>
              </div>
            </div>
            
            <div className="p-xl md:w-2/3 shrink-0">
              <h3 className="text-headline-sm text-on-surface mb-6 border-b border-outline-variant/50 pb-2 shrink-0">Methodology Roadmap</h3>
              <div className="flex flex-col gap-sm shrink-0">
                
                <div className="flex items-center gap-md p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <p className="text-body-md font-medium text-on-surface line-through opacity-70 truncate shrink-0">Project Overview</p>
                  </div>
                </div>

                <div className="flex items-center gap-md p-3 rounded-lg border-l-2 border-secondary bg-surface shadow-sm group hover:bg-surface-container-low transition-colors shrink-0">
                  <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0 shrink-0">
                    <p className="text-body-md font-medium text-primary shrink-0 truncate">Problem Statement</p>
                  </div>
                  <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm shrink-0">Active</span>
                </div>

                <div className="flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer shrink-0">
                  <div className="w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center shrink-0"></div>
                  <div className="flex-1 min-w-0 shrink-0">
                    <p className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors truncate shrink-0">Actors &amp; Stakeholders</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer shrink-0">
                  <div className="w-6 h-6 rounded-full border border-outline-variant flex items-center justify-center shrink-0"></div>
                  <div className="flex-1 min-w-0 shrink-0">
                    <p className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors truncate shrink-0">Existing Solutions Analysis</p>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
