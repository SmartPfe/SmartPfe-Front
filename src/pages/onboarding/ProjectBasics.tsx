import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProjectBasics() {
  const [projectType, setProjectType] = useState("academic");

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-2xl mx-auto">
      <div className="flex flex-col gap-sm">
        <div className="flex justify-between items-center font-label-md text-label-md text-on-surface-variant">
          <span>Step 1 of 4</span>
          <span>Project Basics</span>
        </div>
        <div className="w-full h-[4px] bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary w-1/4 rounded-full transition-all duration-500 ease-in-out"></div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col gap-lg shadow-sm">
        <div className="flex flex-col gap-xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Project Basics</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Let's start by defining the fundamental details of your Final Year Project.</p>
        </div>

        <form className="flex flex-col gap-lg mt-md">
          <div className="flex flex-col gap-base">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="project-title">Project Title <span className="text-error">*</span></label>
            <input type="text" id="project-title" placeholder="e.g. AI-Driven Resource Optimization Platform" className="w-full bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-sm font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="project-domain">Project Domain</label>
              <div className="relative">
                <select id="project-domain" defaultValue="" className="w-full bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-sm font-body-md text-on-surface appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer pr-10">
                  <option disabled value="">Select Domain</option>
                  <option value="se">Software Engineering</option>
                  <option value="ds">Data Science</option>
                  <option value="ns">Network &amp; Security</option>
                  <option value="ai">AI / Machine Learning</option>
                  <option value="mgmt">Management / Business</option>
                  <option value="other">Other</option>
                </select>
                <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="report-language">Report Language</label>
              <div className="relative">
                <select id="report-language" defaultValue="en" className="w-full bg-surface-bright border border-outline-variant rounded-DEFAULT px-md py-sm font-body-md text-on-surface appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer pr-10">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                </select>
                <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-base mt-sm">
            <label className="font-label-md text-label-md text-on-surface">Project Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <label className="relative cursor-pointer group">
                <input type="radio" value="academic" checked={projectType === "academic"} onChange={() => setProjectType("academic")} className="peer sr-only" />
                <div className={cn("h-full bg-surface-bright border rounded-lg p-md flex flex-col gap-sm transition-colors", projectType === "academic" ? "border-primary bg-surface ring-1 ring-primary" : "border-outline-variant hover:bg-surface-container")}>
                  <div className="flex justify-between items-start">
                    <div className={cn("w-8 h-8 rounded flex items-center justify-center", projectType === "academic" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface")}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: projectType === "academic" ? "'FILL' 1" : "'FILL' 0" }}>school</span>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", projectType === "academic" ? "border-primary bg-primary" : "border-outline-variant")}>
                      <div className={cn("w-2 h-2 rounded-full bg-on-primary transition-opacity", projectType === "academic" ? "opacity-100" : "opacity-0")}></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Academic</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Research-focused or internal university project.</p>
                  </div>
                </div>
              </label>

              <label className="relative cursor-pointer group">
                <input type="radio" value="industrial" checked={projectType === "industrial"} onChange={() => setProjectType("industrial")} className="peer sr-only" />
                <div className={cn("h-full bg-surface-bright border rounded-lg p-md flex flex-col gap-sm transition-colors", projectType === "industrial" ? "border-primary bg-surface ring-1 ring-primary" : "border-outline-variant hover:bg-surface-container")}>
                  <div className="flex justify-between items-start">
                    <div className={cn("w-8 h-8 rounded flex items-center justify-center", projectType === "industrial" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface")}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: projectType === "industrial" ? "'FILL' 1" : "'FILL' 0" }}>domain</span>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", projectType === "industrial" ? "border-primary bg-primary" : "border-outline-variant")}>
                      <div className={cn("w-2 h-2 rounded-full bg-on-primary transition-opacity", projectType === "industrial" ? "opacity-100" : "opacity-0")}></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Industrial</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Hosted by an external company or organization.</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>

      <div className="flex justify-end gap-md">
        <Link to="/workspace" className="px-lg py-sm bg-surface text-on-surface border border-outline-variant rounded-DEFAULT font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center min-w-[120px]">
          Cancel
        </Link>
        <Link to="/onboarding/2" className="px-lg py-sm bg-primary text-on-primary border border-primary rounded-DEFAULT font-label-md text-label-md hover:bg-on-surface-variant transition-colors flex items-center justify-center gap-xs min-w-[120px]">
          Next Step
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
