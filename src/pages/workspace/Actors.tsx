import InfoTooltip from "@/components/ui/InfoTooltip";

export default function Actors() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 flex items-center">
            System Actors
            <InfoTooltip 
              label="Actors" 
              tooltip="Identify all users and systems interacting with your application." 
            />
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">Define the users, external systems, or roles that interact with your proposed solution. These actors will form the basis of your user stories and use case diagrams.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-DEFAULT font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Generate AI Suggestions
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-DEFAULT font-label-sm text-label-sm hover:opacity-90 transition-opacity shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Actor
          </button>
        </div>
      </div>

      <div className="bg-surface-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          <div>Actor Name</div>
          <div>Description</div>
          <div className="w-24 text-right">Actions</div>
        </div>
        
        <div className="divide-y divide-outline-variant">
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-6 py-4 items-start hover:bg-surface-container-low transition-colors group">
            <div className="font-body-md text-body-md font-medium text-on-surface flex items-center gap-3 pt-1">
              <span className="material-symbols-outlined text-outline text-[20px]">person</span>
              Customer
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              End-users who browse products, manage their cart, and complete purchases. They can also track order status and manage their personal profile.
            </div>
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-DEFAULT transition-colors" title="Edit">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors" title="Delete">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-6 py-4 items-start hover:bg-surface-container-low transition-colors group">
            <div className="font-body-md text-body-md font-medium text-on-surface flex items-center gap-3 pt-1">
              <span className="material-symbols-outlined text-outline text-[20px]">shield_person</span>
              Administrator
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              System personnel responsible for managing product catalogs, viewing overall sales reports, and handling customer support escalations. Has full access to system configuration.
            </div>
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-DEFAULT transition-colors" title="Edit">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors" title="Delete">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-6 py-4 items-start hover:bg-surface-container-low transition-colors group">
            <div className="font-body-md text-body-md font-medium text-on-surface flex items-center gap-3 pt-1">
              <span className="material-symbols-outlined text-outline text-[20px]">local_shipping</span>
              Delivery Partner
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              External logistic service interface that receives dispatch requests, updates tracking information, and confirms successful deliveries.
            </div>
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-DEFAULT transition-colors" title="Edit">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors" title="Delete">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
