import InfoTooltip from "@/components/ui/InfoTooltip";

export default function ProductBacklog() {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-xl gap-md">
        <div>
          <h2 className="font-display text-display text-on-surface mb-base flex items-center">
            Product Backlog
            <InfoTooltip 
              label="Backlog" 
              tooltip="Organize and prioritize all pending tasks and features." 
            />
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">Manage and prioritize features, requirements, and technical tasks for your project.</p>
        </div>
        <div className="flex items-center gap-sm">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort by Priority
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Story
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg h-[calc(100vh-200px)] pb-xl">
        {/* To Do Column */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant h-full overflow-hidden hover:bg-surface-container-low transition-colors">
          <div className="p-sm border-b border-outline-variant bg-surface flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">To Do</h3>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">3</span>
          </div>
          
          <div className="flex-1 p-sm flex flex-col gap-sm overflow-y-auto">
            {/* Card 1 */}
            <div className="bg-surface rounded-lg border border-outline-variant p-md hover:shadow-sm transition-shadow cursor-grab group">
              <div className="flex justify-between items-start mb-sm">
                <span className="px-2 py-1 bg-error-container text-on-error-container font-label-sm text-label-sm rounded uppercase tracking-wider">High</span>
                <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs leading-snug">Implement User Authentication Flow</h4>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">Design and implement OAuth2 integration for Google and standard email/password login with JWT token management.</p>
              <div className="flex items-center justify-between mt-auto pt-sm border-t border-surface-variant">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span className="font-label-md text-label-md">0/5 tasks</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface rounded-lg border border-outline-variant p-md hover:shadow-sm transition-shadow cursor-grab group">
              <div className="flex justify-between items-start mb-sm">
                <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-wider border border-outline-variant">Medium</span>
                <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs leading-snug">Design Database Schema for Products</h4>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">Create the initial ERD for product catalogs, including variants, categories, and inventory tracking tables.</p>
              <div className="flex items-center justify-between mt-auto pt-sm border-t border-surface-variant">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">subject</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface rounded-lg border border-outline-variant p-md hover:shadow-sm transition-shadow cursor-grab group">
              <div className="flex justify-between items-start mb-sm">
                <span className="px-2 py-1 bg-surface-dim text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-wider">Low</span>
                <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs leading-snug">Setup CI/CD Pipeline Base</h4>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">Configure GitHub Actions for basic linting and unit test execution on pull requests.</p>
              <div className="flex items-center justify-between mt-auto pt-sm border-t border-surface-variant">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">subject</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-sm border-t border-outline-variant bg-surface">
            <button className="w-full flex items-center gap-2 p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors font-body-md text-body-md">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add a card...
            </button>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant h-full overflow-hidden hover:bg-surface-container-low transition-colors">
          <div className="p-sm border-b border-outline-variant bg-surface flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">In Progress</h3>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">1</span>
          </div>
          
          <div className="flex-1 p-sm flex flex-col gap-sm overflow-y-auto">
            <div className="bg-surface rounded-lg border-2 border-secondary-fixed-dim p-md shadow-sm cursor-grab group relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
              <div className="flex justify-between items-start mb-sm pl-1">
                <span className="px-2 py-1 bg-error-container text-on-error-container font-label-sm text-label-sm rounded uppercase tracking-wider">High</span>
                <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs leading-snug pl-1">API Endpoint Design Document</h4>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md pl-1">Drafting the Swagger/OpenAPI specifications for the core user and product endpoints.</p>
              <div className="flex items-center justify-between mt-auto pt-sm border-t border-surface-variant pl-1">
                <div className="flex items-center gap-1 text-secondary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Done Column */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant h-full overflow-hidden hover:bg-surface-container-low transition-colors opacity-80">
          <div className="p-sm border-b border-outline-variant bg-surface flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Done</h3>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">2</span>
          </div>
          
          <div className="flex-1 p-sm flex flex-col gap-sm overflow-y-auto">
            <div className="bg-surface rounded-lg border border-outline-variant p-md cursor-pointer group bg-surface-container-low">
              <div className="flex justify-between items-start mb-sm">
                <span className="px-2 py-1 bg-surface-dim text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-wider line-through">Medium</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface-variant mb-xs leading-snug line-through decoration-outline-variant">Project Kickoff &amp; Repository Setup</h4>
              <div className="flex items-center justify-between mt-md pt-sm border-t border-surface-variant">
                <div className="flex items-center gap-1 text-[#10B981] font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Completed Oct 12</span>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-outline-variant p-md cursor-pointer group bg-surface-container-low">
              <div className="flex justify-between items-start mb-sm">
                <span className="px-2 py-1 bg-surface-dim text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-wider line-through">Low</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface-variant mb-xs leading-snug line-through decoration-outline-variant">Initial Technology Stack Selection</h4>
              <div className="flex items-center justify-between mt-md pt-sm border-t border-surface-variant">
                <div className="flex items-center gap-1 text-[#10B981] font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Completed Oct 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
