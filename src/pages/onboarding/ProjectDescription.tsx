import { Link } from "react-router-dom";

export default function ProjectDescription() {
  return (
    <div className="w-full max-w-[42rem] bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden mx-auto">
      <div className="mb-xl text-center pt-xl">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">PFE Guidance Platform</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Project Setup</p>
      </div>

      <div className="px-xl pt-md pb-lg border-b border-surface-variant">
        <div className="flex justify-between items-center mb-sm">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Step 2 of 4</span>
          <span className="font-label-md text-label-md text-primary font-bold">Project Description</span>
        </div>
        <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary w-2/4 transition-all duration-500 ease-in-out"></div>
        </div>
      </div>

      <div className="p-xl space-y-lg">
        <div>
          <label htmlFor="project_description" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">Detailed Project Description</label>
          <p className="font-body-md text-body-md text-on-surface-variant mb-sm">Provide a comprehensive overview of your project, including the problem it solves and its main functionalities.</p>
          <textarea id="project_description" rows={5} placeholder="e.g., A comprehensive web platform designed to streamline..." className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-sm py-sm text-on-surface font-body-md placeholder:text-outline-variant focus:border-secondary focus:outline-none transition-colors"></textarea>
        </div>

        <div>
          <label htmlFor="main_objective" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">Main Objective</label>
          <input type="text" id="main_objective" placeholder="What is the primary goal?" className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-sm py-sm text-on-surface font-body-md placeholder:text-outline-variant focus:border-secondary focus:outline-none transition-colors" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label htmlFor="internship_company" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">Internship Company</label>
            <input type="text" id="internship_company" placeholder="Company Name" className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-sm py-sm text-on-surface font-body-md placeholder:text-outline-variant focus:border-secondary focus:outline-none transition-colors" />
          </div>
          <div>
            <label htmlFor="industry" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">Industry</label>
            <input type="text" id="industry" placeholder="e.g., FinTech, Healthcare, E-commerce" className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-sm py-sm text-on-surface font-body-md placeholder:text-outline-variant focus:border-secondary focus:outline-none transition-colors" />
          </div>
        </div>
      </div>

      <div className="px-xl py-lg bg-surface-container-lowest border-t border-surface-variant flex items-center justify-between">
        <Link to="/onboarding/1" className="flex items-center gap-xs px-md py-sm rounded-DEFAULT border border-outline-variant text-on-surface bg-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </Link>
        <Link to="/onboarding/3" className="flex items-center gap-xs px-lg py-sm rounded-DEFAULT bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md text-label-md uppercase tracking-wider">
          Next Step
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
