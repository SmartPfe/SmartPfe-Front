import InfoTooltip from "@/components/ui/InfoTooltip";
import { Link } from "react-router-dom";
import { useWorkflow, type StepStatus } from "@/context/WorkflowContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { displayOptionLabel, type OnboardingOptionGroup } from "@/lib/onboardingOptions";

const methodologySteps = [
  { stepNumber: 1, path: "/workspace/problem-statement", labelKey: "workflow.problemStatement", categoryKey: "workflow.specification", icon: "document" },
  { stepNumber: 2, path: "/workspace/actors", labelKey: "workflow.actors", categoryKey: "workflow.specification", icon: "group" },
  { stepNumber: 3, path: "/workspace/solutions", labelKey: "workflow.existingSolutions", categoryKey: "workflow.specification", icon: "search" },
  { stepNumber: 4, path: "/workspace/functional-requirements", labelKey: "workflow.functionalRequirements", categoryKey: "workflow.engineering", icon: "tune" },
  { stepNumber: 5, path: "/workspace/non-functional-requirements", labelKey: "workflow.nonFunctionalRequirements", categoryKey: "workflow.engineering", icon: "shield" },
  { stepNumber: 6, path: "/workspace/backlog", labelKey: "workflow.productBacklog", categoryKey: "workflow.engineering", icon: "list-ordered" },
  { stepNumber: 7, path: "/workspace/uml-preparation", labelKey: "workflow.umlPreparation", categoryKey: "workflow.engineering", icon: "account-tree" },
  { stepNumber: 8, path: "/workspace/report-structure", labelKey: "workflow.reportStructure", categoryKey: "workflow.academicDelivery", icon: "schema" },
  { stepNumber: 9, path: "/workspace/report-builder", labelKey: "workflow.reportBuilder", categoryKey: "workflow.academicDelivery", icon: "book-open" },
  { stepNumber: 10, path: "/workspace/presentation", labelKey: "workflow.presentationDeck", categoryKey: "workflow.defensePreparation", icon: "presentation" },
  { stepNumber: 11, path: "/workspace/pitch", labelKey: "workflow.pitchSpeech", categoryKey: "workflow.defensePreparation", icon: "mic" },
  { stepNumber: 12, path: "/workspace/jury-simulation", labelKey: "workflow.jurySimulation", categoryKey: "workflow.defensePreparation", icon: "groups" },
];

function cleanText(value: unknown) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value || "").trim();
}

function displayValue(value: unknown, fallback: string) {
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
  const { t, i18n } = useTranslation("analysis");
  const tOnboarding = i18n.getFixedT(i18n.resolvedLanguage || i18n.language, "onboarding");
  const { project, loading, steps } = useWorkflow();
  const technologies = projectList(project?.technicalContext?.technologies, project?.technicalContext?.otherTechnologies);
  const developmentTypes = projectList(
    project?.technicalContext?.developmentTypes,
    project?.technicalContext?.otherDevelopmentType
  );

  const completedCount = methodologySteps.filter((item) => steps[item.path]?.status === "Completed").length;
  const totalTracked = methodologySteps.length;
  const progressPercent = Math.round((completedCount / totalTracked) * 100);
  const displayProjectEnum = (value: unknown, group: OnboardingOptionGroup) =>
    typeof value === "string" && value.trim()
      ? displayOptionLabel(value, group, tOnboarding)
      : displayValue(value, t("overview.notProvided"));

  const nextStep = methodologySteps.find((item) => steps[item.path]?.status === "Available")
    || methodologySteps.find((item) => steps[item.path]?.status !== "Completed");

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">{t("overview.loading")}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center p-8 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant">
          <HugeiconsIcon icon="document-validation" size={32} strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-on-surface mb-1">{t("overview.noProjectTitle")}</h2>
        <p className="text-xs text-on-surface-variant max-w-sm">{t("overview.noProjectDescription")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("overview.eyebrow")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            {t("overview.title")}
            <InfoTooltip 
              label={t("overview.tooltipLabel")}
              tooltip={t("overview.tooltip")}
            />
          </h1>
        </div>
      </div>

      {/* Top Project Executive Ribbon */}
      <div data-tour="overview" className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                {t("overview.activeThesis")}
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
                <span>{t("overview.editSpecs")}</span>
              </Link>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-tight">
              {project.basics?.title || t("overview.untitledProject")}
            </h2>
            <p className="text-xs text-on-surface-variant/90 mt-1.5 line-clamp-2 max-w-3xl leading-relaxed">
              {project.description?.summary || t("overview.noProjectSummary")}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block">{t("overview.thesisCompletion")}</span>
              <span className="text-sm font-bold font-mono text-on-surface">{t("overview.stepsReady", { completed: completedCount, total: totalTracked })}</span>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-4">{t("overview.coreSpecifications")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.domain")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayProjectEnum(project.basics?.domain, "domain")}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.companyPartner")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.description?.company, t("overview.notProvided"))}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.methodology")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayProjectEnum(project.technicalContext?.methodology, "methodology")}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.university")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayValue(project.basics?.university, t("overview.notProvided"))}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.projectType")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayProjectEnum(project.basics?.type, "projectType")}</span>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70 block mb-1">{t("overview.language")}</span>
                <span className="text-xs font-bold text-on-surface truncate block">{displayProjectEnum(project.basics?.language, "generationLanguage")}</span>
              </div>
            </div>
          </section>

          {/* Interactive Methodology Roadmap */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80">{t("overview.workflowPipeline")}</h3>
              <span className="text-xs font-mono font-semibold text-primary">{t("overview.completedCount", { completed: completedCount, total: totalTracked })}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {methodologySteps.map((item) => {
                const stepState = steps[item.path] || { status: "Locked", isCompleted: false };
                const isCompleted = stepState.status === "Completed";
                const isAvailable = stepState.status === "Available";
                const isLocked = stepState.status === "Locked";

                return (
                  <Link
                    key={item.path}
                    to={isLocked ? "#" : item.path}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 group shadow-2xs select-none",
                      isCompleted && "border-outline-variant/70 bg-surface hover:bg-surface-container-low/70 cursor-pointer",
                      isAvailable && "border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary cursor-pointer shadow-xs",
                      isLocked && "border-outline-variant/40 bg-surface-container/30 opacity-45 cursor-not-allowed text-on-surface-variant/70"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold transition-colors",
                      isCompleted && "bg-secondary/10 border-secondary/20 text-secondary",
                      isAvailable && "bg-primary text-on-primary border-primary",
                      isLocked && "bg-surface-container border-outline-variant/60 text-on-surface-variant/50"
                    )}>
                      {isCompleted ? (
                        <HugeiconsIcon icon="checkmark-circle-02" size={15} strokeWidth={2.5} />
                      ) : isLocked ? (
                        <HugeiconsIcon icon="lock" size={13} strokeWidth={1.6} />
                      ) : (
                        <span className="font-mono text-xs">{item.stepNumber}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 block leading-tight font-mono">
                        {t(item.categoryKey)}
                      </span>
                      <p className={cn(
                        "text-xs font-bold truncate mt-0.5",
                        isAvailable ? "text-primary" : isLocked ? "text-on-surface-variant/80" : "text-on-surface"
                      )}>
                        {t(item.labelKey)}
                      </p>
                    </div>

                    {isAvailable && (
                      <span className="px-2 py-0.5 rounded-md bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-2xs font-mono">
                        {t("overview.active")}
                      </span>
                    )}
                    {isCompleted && (
                      <HugeiconsIcon icon="checkmark-circle-02" size={16} strokeWidth={2} className="text-secondary shrink-0" />
                    )}
                    {isLocked && (
                      <HugeiconsIcon icon="lock" size={14} strokeWidth={1.5} className="text-on-surface-variant/40 shrink-0" />
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
          <section data-tour="ai" className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <HugeiconsIcon icon="lightbulb" size={16} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("overview.recommendedAction")}</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1">
                {nextStep ? t(nextStep.labelKey) : t("overview.pipelineComplete")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
                {nextStep
                  ? t("overview.nextStepDescription", { step: t(nextStep.labelKey) })
                  : t("overview.pipelineCompleteDescription")}
              </p>
            </div>

            <Link
              to={nextStep?.path || "/workspace/presentation"}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <span>{nextStep ? t("overview.goToStep", { step: t(nextStep.labelKey) }) : t("overview.reviewPresentation")}</span>
              <HugeiconsIcon icon="arrow-right" size={15} strokeWidth={2} />
            </Link>
          </section>

          {/* Development Types Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-3 flex items-center gap-2">
              <HugeiconsIcon icon="devices" size={16} strokeWidth={1.8} className="text-primary" />
              <span>{t("overview.developmentScope")}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {developmentTypes.length > 0 ? (
                developmentTypes.map((type) => (
                  <span key={type} className="px-2.5 py-1 bg-surface border border-outline-variant/80 rounded-lg text-xs font-semibold text-on-surface shadow-2xs">
                    {displayOptionLabel(type, "developmentType", tOnboarding)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-on-surface-variant">{t("overview.noDevelopmentScope")}</span>
              )}
            </div>
          </section>

          {/* Technologies Stack Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 mb-3 flex items-center gap-2">
              <HugeiconsIcon icon="code" size={16} strokeWidth={1.8} className="text-primary" />
              <span>{t("overview.technologyStack")}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {technologies.length > 0 ? (
                technologies.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-surface border border-outline-variant/80 rounded-lg text-xs font-semibold text-on-surface shadow-2xs">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-xs text-on-surface-variant">{t("overview.noTechnologies")}</span>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

