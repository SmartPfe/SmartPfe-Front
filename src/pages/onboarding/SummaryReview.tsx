import { Link } from "react-router-dom";

export default function SummaryReview() {
  return (
    <div className="w-full max-w-[800px] flex flex-col gap-lg mx-auto">
      <header className="flex flex-col items-center text-center gap-xs mb-md">
        <h1 className="font-headline-lg text-headline-lg text-primary">Summary Review</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Review your project details before final creation.</p>
        
        <div className="flex items-center gap-sm mt-md w-full max-w-[400px]">
          <div className="h-1 flex-1 bg-primary rounded-full"></div>
          <div className="h-1 flex-1 bg-primary rounded-full"></div>
          <div className="h-1 flex-1 bg-primary rounded-full"></div>
          <div className="h-1 flex-1 bg-primary rounded-full relative">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-label-sm text-label-sm text-primary whitespace-nowrap">Step 4 of 4</span>
          </div>
        </div>
      </header>

      <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg sm:p-xl flex flex-col gap-xl">
        <section className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
            <span className="material-symbols-outlined text-secondary">info</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Basics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Project Title</label>
              <p className="font-body-lg text-body-lg text-on-surface font-medium">Automated Deployment Pipeline Orchestrator</p>
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Academic Year</label>
              <p className="font-body-lg text-body-lg text-on-surface font-medium">2023-24</p>
            </div>
            <div className="sm:col-span-2">
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Project Type</label>
              <div className="flex gap-sm">
                <span className="inline-flex items-center px-sm py-base rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface">Engineering</span>
                <span className="inline-flex items-center px-sm py-base rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface">Research</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
            <span className="material-symbols-outlined text-secondary">description</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Description</h2>
          </div>
          <div className="mt-sm">
            <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Executive Summary</label>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              This project aims to develop a robust orchestration tool that automates the deployment pipeline across multiple cloud environments. It focuses on reducing manual intervention, increasing deployment velocity, and ensuring compliance with security standards through automated checks at every stage.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs border-b border-outline-variant pb-xs">
            <span className="material-symbols-outlined text-secondary">settings_suggest</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Technical Context</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Primary Stack</label>
              <p className="font-body-lg text-body-lg text-on-surface font-medium">Kubernetes, Go, React</p>
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Target Environment</label>
              <p className="font-body-lg text-body-lg text-on-surface font-medium">AWS &amp; GCP Multi-cloud</p>
            </div>
            <div className="sm:col-span-2">
              <label className="font-label-md text-label-md text-on-surface-variant block mb-base">Key Dependencies</label>
              <p className="font-body-md text-body-md text-on-surface">Docker, Terraform, GitHub Actions</p>
            </div>
          </div>
        </section>
      </article>

      <footer className="flex items-center justify-between mt-md pt-md border-t border-outline-variant">
        <Link to="/onboarding/3" className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
          Back
        </Link>
        <Link to="/workspace/overview" className="px-lg py-sm rounded-lg bg-primary font-label-md text-label-md text-on-primary hover:bg-on-surface-variant transition-colors flex items-center gap-xs">
          <span>Create Project</span>
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
        </Link>
      </footer>
    </div>
  );
}
