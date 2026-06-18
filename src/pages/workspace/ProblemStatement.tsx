import InfoTooltip from "@/components/ui/InfoTooltip";

export default function ProblemStatement() {
  return (
    <div className="max-w-[800px]">
      <div className="mb-xl">
        <h1 className="font-display text-display text-on-surface mb-2 flex items-center">
          Problem Statement
          <InfoTooltip 
            label="Problem Statement" 
            tooltip="Clearly articulate the issue your project aims to solve." 
          />
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">Clearly define the issue your project aims to resolve.</p>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden p-xl">
        <form className="flex flex-col gap-lg">
          <div className="flex flex-col gap-base">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider" htmlFor="core-problem">Core Problem</label>
            <textarea id="core-problem" rows={4} className="w-full bg-surface-bright border border-outline-variant rounded-md px-4 py-3 font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="What is the main problem?"></textarea>
          </div>
          
          <div className="flex flex-col gap-base">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider" htmlFor="context">Context &amp; Background</label>
            <textarea id="context" rows={6} className="w-full bg-surface-bright border border-outline-variant rounded-md px-4 py-3 font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Why does this problem matter now?"></textarea>
          </div>
        </form>

        <div className="mt-xl pt-lg border-t border-outline-variant flex justify-end gap-sm">
          <button className="flex items-center gap-xs px-4 py-2 rounded-md border border-outline-variant text-on-surface bg-surface hover:bg-surface-container transition-colors font-label-md text-label-md">
            Discard Changes
          </button>
          <button className="flex items-center gap-xs px-4 py-2 rounded-md bg-primary text-on-primary shadow-sm hover:opacity-90 transition-colors font-label-md text-label-md">
            Save Statement
          </button>
        </div>
      </div>
    </div>
  );
}
