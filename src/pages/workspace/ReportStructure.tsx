import InfoTooltip from "@/components/ui/InfoTooltip";

export default function ReportStructure() {
  return (
    <>
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-xs flex items-center">
            Report Structure
            <InfoTooltip 
              label="Structure" 
              tooltip="Outline the chapters and sections of your final PFE report." 
            />
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage the table of contents and hierarchy for your final report.</p>
        </div>
        <div className="flex gap-sm">
          <button className="flex items-center gap-xs bg-surface text-on-surface border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Section
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        
        {/* Root Node 1 */}
        <div className="group relative flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant mb-xs">
          <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing">drag_indicator</span>
          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary font-label-md text-label-md">1</div>
          <div className="flex-1">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Introduction</h3>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs transition-opacity">
            <button className="text-on-surface-variant hover:text-primary p-1" title="Add Subsection">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary p-1" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="text-on-surface-variant hover:text-error p-1" title="Delete">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>

        {/* Root Node 2 */}
        <div className="mb-xs">
          <div className="group relative flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant">
            <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing">drag_indicator</span>
            <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary font-label-md text-label-md">2</div>
            <div className="flex-1">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">State of the Art</h3>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs transition-opacity">
              <button className="text-on-surface-variant hover:text-primary p-1" title="Add Subsection">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              </button>
              <button className="text-on-surface-variant hover:text-primary p-1" title="Edit">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button className="text-on-surface-variant hover:text-error p-1" title="Delete">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>

          <div className="ml-[68px] relative mt-xs border-l-2 border-outline-variant pl-4 py-2">
            
            <div className="group relative flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant mb-xs relative">
              
              <div className="absolute left-[-16px] top-1/2 w-4 h-[2px] bg-outline-variant"></div>

              <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing text-[18px]">drag_indicator</span>
              <div className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-label-sm text-label-sm">2.1</div>
              <div className="flex-1">
                <h4 className="font-body-md text-body-md text-on-surface">Existing Solutions Analysis</h4>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs transition-opacity">
                <button className="text-on-surface-variant hover:text-primary p-1" title="Add Subsection">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary p-1" title="Edit">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button className="text-on-surface-variant hover:text-error p-1" title="Delete">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>

            <div className="group relative flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant relative">
              <div className="absolute left-[-16px] top-1/2 w-4 h-[2px] bg-outline-variant"></div>

              <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing text-[18px]">drag_indicator</span>
              <div className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-label-sm text-label-sm">2.2</div>
              <div className="flex-1">
                <h4 className="font-body-md text-body-md text-on-surface">Technological Stack Comparison</h4>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs transition-opacity">
                <button className="text-on-surface-variant hover:text-primary p-1" title="Add Subsection">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary p-1" title="Edit">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button className="text-on-surface-variant hover:text-error p-1" title="Delete">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Root Node 3 */}
        <div className="group relative flex items-center gap-md p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant mt-xs">
          <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing">drag_indicator</span>
          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary font-label-md text-label-md">3</div>
          <div className="flex-1 flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Methodology</h3>
            <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-label-sm uppercase tracking-wider">Draft</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs transition-opacity">
            <button className="text-on-surface-variant hover:text-primary p-1" title="Add Subsection">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary p-1" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="text-on-surface-variant hover:text-error p-1" title="Delete">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
