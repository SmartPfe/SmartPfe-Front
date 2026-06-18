import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DEV_TYPES = ["Web", "Mobile", "Desktop", "AI / ML", "ERP", "Other"];

export default function TechnicalContext() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Web"]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center mx-auto">
      <div className="w-full flex gap-base mb-xl">
        <div className="h-2 flex-1 rounded-full bg-primary"></div>
        <div className="h-2 flex-1 rounded-full bg-primary"></div>
        <div className="h-2 flex-1 rounded-full bg-primary"></div>
        <div className="h-2 flex-1 rounded-full bg-surface-container-high"></div>
      </div>

      <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
        <div className="mb-lg">
          <h1 className="font-headline-md text-headline-md text-on-surface mb-xs">Technical Context</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Define the technical boundaries and methodology for your software engineering project.</p>
        </div>

        <form className="flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-label-md text-on-surface">Development Type</label>
            <div className="flex flex-wrap gap-xs">
              {DEV_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={cn(
                    "px-md py-xs rounded-full border transition-colors font-body-md text-body-md cursor-pointer",
                    selectedTypes.includes(type)
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="methodology" className="font-label-md text-label-md text-on-surface">Methodology</label>
            <div className="relative">
              <select id="methodology" defaultValue="scrum" className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary transition-all">
                <option value="scrum">Scrum (Agile)</option>
                <option value="kanban">Kanban</option>
                <option value="waterfall">Waterfall</option>
                <option value="other">Other / Hybrid</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-md text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="technologies" className="font-label-md text-label-md text-on-surface">Technologies Used</label>
            <div className="w-full min-h-[100px] bg-surface-container-lowest border border-outline-variant rounded-lg p-sm focus-within:border-secondary transition-all flex flex-col gap-sm">
              <div className="flex flex-wrap gap-xs">
                {["React", "Node.js", "PostgreSQL", "Tailwind CSS"].map((tech) => (
                  <span key={tech} className="inline-flex items-center gap-base px-sm py-base rounded-md bg-surface-container-high text-on-surface font-body-md text-body-md">
                    {tech}
                    <button type="button" className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-error transition-colors">close</button>
                  </span>
                ))}
              </div>
              <input type="text" id="technologies" placeholder="Type a technology and press enter..." className="flex-1 bg-transparent border-none p-0 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:ring-0 focus:outline-none" />
            </div>
          </div>
        </form>

        <div className="mt-xl pt-lg border-t border-outline-variant flex items-center justify-between">
          <Link to="/onboarding/2" className="flex items-center gap-xs px-lg py-sm rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </Link>
          <Link to="/onboarding/4" className="flex items-center gap-xs px-lg py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-on-surface-variant transition-colors shadow-sm">
            Next Step
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
