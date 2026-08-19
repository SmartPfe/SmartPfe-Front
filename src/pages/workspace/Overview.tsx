import InfoTooltip from "@/components/ui/InfoTooltip";
import { Link } from "react-router-dom";
import { useWorkflow, type StepStatus } from "@/context/WorkflowContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { cn } from "@/lib/utils";

const workflowItems = [
  { path: "/workspace/overview", label: "Project Overview", category: "Foundation", icon: "dashboard" },
  { path: "/workspace/problem-statement", label: "Problem Statement", category: "Specification", icon: "document-validation" },
  { path: "/workspace/actors", label: "Actors & Stakeholders", category: "Specification", icon: "group" },
  { path: "/workspace/solutions", label: "Existing Solutions", category: "Specification", icon: "search" },
  { path: "/workspace/functional-requirements", label: "Functional Requirements", category: "Engineering", icon: "list-ordered" },
  { path: "/workspace/non-functional-requirements", label: "Non-Functional Requirements", category: "Engineering", icon: "shield" },
  { path: "/workspace/backlog", label: "Product Backlog", category: "Engineering", icon: "layers" },
  { path: "/workspace/uml-preparation", label: "UML Preparation", category: "Engineering", icon: "schema" },
  { path: "/workspace/report-structure", label: "Report Structure", category: "Academic Delivery", icon: "book-open" },
  { path: "/workspace/report-builder", label: "Report Builder", category: "Academic Delivery", icon: "edit" },
  { path: "/workspace/presentation", label: "Presentation Deck", category: "Defense Preparation", icon: "presentation" },
  { path: "/workspace/pitch", label: "Pitch Speech", category: "Defense Preparation", icon: "mic" },
  { path: "/workspace/jury-simulation", label: "Jury Simulation", category: "Defense Preparation", icon: "play-circle" },
];

function cleanText(value: unknown) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value || "").trim();
}

function displayValue(value: unknown, fallback = "Not provided") {
  return cleanText(value) || fallback;
}

function splitCustomValues(value: unknown) {
  return cleanText(value)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  const result: string[] = [];
  values.forEach((value) => {
    const clean = value.trim();
    if (clean && clean !== "Other" && !result.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      result.push(clean);
    }
  });
  return result;
}

function projectList(values: unknown, customValues?: unknown) {
  return uniqueValues([
    ...(Array.isArray(values) ? values.map(cleanText) : splitCustomValues(values)),
    ...splitCustomValues(customValues),
  ]);
}

export default function Overview() {
  const { project, loading, steps } = useWorkflow();
  const technologies = projectList(project?.technicalContext?.technologies, project?.technicalContext?.otherTechnologies);
  const developmentTypes = projectList(
    project?.technicalContext?.developmentTypes,
    project?.technicalContext?.otherDevelopmentType
  );

  const completedCount = workflowItems.filter((item) => steps[item.path]?.status === "Completed").length;
  const totalTracked = workflowItems.length;
  const progressPercent = Math.round((completedCount / totalTracked) * 100);

  const nextStep = workflowItems.find((item) => steps[item.path]?.status === "Available" && item.path !== "/workspace/overview")
    || workflowItems.find((item) => steps[item.path]?.status !== "Completed" && item.path !== "/workspace/overview");

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading project overview...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center p-8 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant">
          <HugeiconsIcon icon="document-validation" size={32} strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-on-surface mb-1">No Active Project Found</h2>
        <p className="text-xs text-on-surface-variant max-w-sm">Complete onboarding or select a project to view your workspace overview.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Project Overview
            <InfoTooltip 
              label="Overview" 
              tooltip="Live summary of your project parameters, academic context, and real-time methodology roadmap progression." 
            />
          </h1>
        </div>
      </div>

      {/* Top Project Executive Ribbon */}
      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Active Graduation Thesis
              </span>
              {project.basics?.academicYear && (
                <span className="text-[11px] font-mono font-semibold text-on-surface px-2 py-0.5 rounded-md bg-surface border border-outline-variant/70">
                  {project.basics.academicYear}
                </span>
              )}
              {/* Relocated Specs Action Button */}
              <Link
                to="/workspace/settings/onboarding"
                className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md border border-outline-variant bg-surface text-[11px] font-bold text-on-surface hover:bg-surface-container transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
              >
                <HugeiconsIcon icon="edit" size={13} strokeWidth={1.8} className="text-primary" />
                <span>Edit Specs</span>
              </Link>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-tight">
              {project.basics?.title || "Untitled Project"}
            </h2>
            <p className="text-xs text-on-surface-variant/90 mt-1.5 line-clamp-2 max-w-3xl leading-relaxed">
              {project.description?.summary || "No project description summary provided yet."}
            </p>
          </div>

          {/* Progress Tracker Card */}
          <div className="flex items-center gap-5 p-3 sm:p-4 rounded-xl bg-surface border border-outline-variant/80 shadow-2xs shrink-0">
            <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
              <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary transition-all duration-500 ease-out"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-on-surface">
                {progressPercent}%
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block">Thesis Completion</span>
              <span className="text-sm font-bold font-mono text-on-surface">{completedCount} of {totalTracked} Steps Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Parameters & Roadmap */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Key Project Parameters Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-4">Core Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">Domain</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.basics?.domain)}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">Company Partner</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.description?.company)}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">Methodology</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.technicalContext?.methodology)}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">University</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.basics?.university)}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">Project Type</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.basics?.type)}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">Language</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.basics?.language)}</span>
              </div>
            </div>
          </section>

          {/* Interactive Methodology Roadmap */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80">Methodology Workflow Pipeline</h3>
              <span className="text-xs font-mono font-semibold text-primary">{completedCount}/{totalTracked} Completed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {workflowItems.map((item, index) => {
                const status = steps[item.path]?.status;
                const isCompleted = status === "Completed";
                const isAvailable = status === "Available";

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 group shadow-2xs",
                      isCompleted && "border-outline-variant/60 bg-surface hover:bg-surface-container",
                      isAvailable && "border-primary bg-primary/10 hover:bg-primary/15",
                      !isCompleted && !isAvailable && "border-outline-variant/40 bg-surface/50 opacity-60 hover:opacity-80"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold",
                      isCompleted && "bg-secondary/10 border-secondary/20 text-secondary",
                      isAvailable && "bg-primary text-on-primary border-primary",
                      !isCompleted && !isAvailable && "bg-surface-container border-outline-variant/60 text-on-surface-variant"
                    )}>
                      {isCompleted ? (
                        <HugeiconsIcon icon="check-circle" size={16} strokeWidth={2} />
                      ) : (
                        <span className="font-mono">{index + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/60 block leading-tight">
                        {item.category}
                      </span>
                      <p className={cn(
                        "text-xs font-bold truncate mt-0.5",
                        isAvailable ? "text-primary" : "text-on-surface"
                      )}>
                        {item.label}
                      </p>
                    </div>

                    {isAvailable && (
                      <span className="px-2 py-0.5 rounded-md bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-2xs">
                        Next
                      </span>
                    )}
                    {isCompleted && (
                      <HugeiconsIcon icon="checkmark-circle-02" size={16} strokeWidth={2} className="text-secondary shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Next Step & Technical Stack */}
        <div className="flex flex-col gap-6">
          
          {/* Next Recommended Step Card */}
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <HugeiconsIcon icon="lightbulb" size={16} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Recommended Action</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1">
                {nextStep ? nextStep.label : "Pipeline Fully Complete"}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
                {nextStep
                  ? `Jump directly into ${nextStep.label} to generate and refine your project content.`
                  : "All chapters, backlog stories, and defense materials have been completed."}
              </p>
            </div>

            <Link
              to={nextStep?.path || "/workspace/presentation"}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <span>{nextStep ? `Go to ${nextStep.label}` : "Review Presentation"}</span>
              <HugeiconsIcon icon="arrow-right" size={15} strokeWidth={2} />
            </Link>
          </section>

          {/* Development Types Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-3 flex items-center gap-2">
              <HugeiconsIcon icon="devices" size={16} strokeWidth={1.8} className="text-primary" />
              <span>Development Scope</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {developmentTypes.length > 0 ? (
                developmentTypes.map((type) => (
                  <span key={type} className="px-2.5 py-1 bg-surface border border-outline-variant/80 rounded-lg text-xs font-semibold text-on-surface shadow-2xs">
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-xs text-on-surface-variant">No development scope specified.</span>
              )}
            </div>
          </section>

          {/* Technologies Stack Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-3 flex items-center gap-2">
              <HugeiconsIcon icon="code" size={16} strokeWidth={1.8} className="text-primary" />
              <span>Technology Stack</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {technologies.length > 0 ? (
                technologies.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-surface border border-outline-variant/80 rounded-lg text-xs font-semibold text-on-surface shadow-2xs">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-xs text-on-surface-variant">No technologies selected.</span>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

