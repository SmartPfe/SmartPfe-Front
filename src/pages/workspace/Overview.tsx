import { useEffect, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";

export default function Overview() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await fetchApi("/projects/my-project");
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center h-64">
        <span className="material-symbols-outlined text-[48px] text-outline mb-4">folder_off</span>
        <p className="text-on-surface-variant font-medium text-lg">No active project found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Overview
            <InfoTooltip 
              label="Overview" 
              tooltip="Your workspace dashboard." 
            />
          </h1>
          <p className="text-body-lg text-on-surface-variant">Manage your project parameters and track progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-surface border border-outline-variant rounded-2xl p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Active Project
                </span>
                <h2 className="text-headline-md text-on-surface font-medium leading-tight">
                  {project.basics?.title || "Untitled Project"}
                </h2>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-outline-variant/60">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Domain</p>
                <p className="text-body-lg text-on-surface font-medium">{project.basics?.domain || "N/A"}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Company Partner</p>
                <p className="text-body-lg text-on-surface font-medium">{project.description?.company || "University / Self-directed"}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Methodology</p>
                <p className="text-body-lg text-on-surface font-medium">{project.technicalContext?.methodology || "Agile"}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">Academic Year</p>
                <p className="text-body-lg text-on-surface font-medium">{project.basics?.academicYear || "2023-24"}</p>
              </div>
            </div>
          </section>

          {/* Clean Roadmap */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-8 shadow-sm">
            <h3 className="text-title-lg text-on-surface mb-6 font-medium">Methodology Roadmap</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/50 opacity-70">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-on-primary">check</span>
                </div>
                <p className="text-body-md font-medium text-on-surface line-through truncate">Project Onboarding</p>
              </div>
              <Link to="/workspace/problem-statement" className="flex items-center gap-4 p-4 rounded-xl border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 transition-colors group">
                <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-primary truncate">Problem Statement</p>
                </div>
                <span className="px-2.5 py-1 bg-surface rounded-md border border-secondary/20 text-secondary text-xs font-medium shadow-sm shrink-0">Current</span>
              </Link>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:bg-surface-container-lowest transition-colors group cursor-pointer">
                <div className="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0 group-hover:border-outline"></div>
                <p className="text-body-md text-on-surface-variant group-hover:text-on-surface font-medium transition-colors truncate">Actors & Stakeholders</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:bg-surface-container-lowest transition-colors group cursor-pointer">
                <div className="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0 group-hover:border-outline"></div>
                <p className="text-body-md text-on-surface-variant group-hover:text-on-surface font-medium transition-colors truncate">Existing Solutions Analysis</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Cards */}
        <div className="flex flex-col gap-6">
          {/* Action Card Minimal */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px] text-primary">tips_and_updates</span>
              <span className="text-label-sm text-primary uppercase tracking-wider font-semibold">Next Step</span>
            </div>
            <h3 className="text-title-lg text-on-surface font-medium mb-2">Draft Problem Statement</h3>
            <p className="text-body-sm text-on-surface-variant mb-6 leading-relaxed">
              Define the core issue your project addresses to align with your academic goals.
            </p>
            <Link to="/workspace/problem-statement" className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl text-label-md font-medium hover:bg-on-primary-fixed-variant transition-colors flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface">
              Start Drafting <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </section>

          {/* Tech Stack Clean Card */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h3 className="text-title-md text-on-surface mb-4 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">code</span> Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technicalContext?.technologies?.length > 0 ? (
                project.technicalContext.technologies.map((tech: string) => (
                  <span key={tech} className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-label-md text-on-surface font-medium">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-body-sm text-on-surface-variant">No technologies specified.</span>
              )}
            </div>
          </section>
          
          {/* Info Card */}
          <section className="bg-surface-container-lowest border border-outline-variant border-dashed rounded-2xl p-6 text-center">
             <span className="material-symbols-outlined text-[24px] text-outline mb-2">school</span>
             <h4 className="text-label-md text-on-surface font-medium mb-1">Academic Year</h4>
             <p className="text-body-sm text-on-surface-variant">{project.basics?.university || "University"}</p>
          </section>
        </div>

      </div>
    </div>
  );
}
