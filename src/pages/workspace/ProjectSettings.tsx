import { apiMessage, displayApiMessage, type ApiMessage } from "@/lib/apiMessage";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MultiSelectChips, SelectField, TextAreaField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { displayOptions } from "@/lib/onboardingOptions";

const PROJECT_TYPES = ["Academic Project", "Internship / Industrial Project", "Startup Project", "Research Project"];
const DOMAINS = [
  "Software Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "IoT",
  "Business Intelligence",
  "Other",
];
const LANGUAGES = ["English", "French", "Arabic"];
const METHODOLOGIES = ["Scrum", "Kanban", "Waterfall", "Hybrid", "Agile", "CRISP-DM", "DevOps", "Lean", "RUP", "V-Model", "Design Thinking"];
const COMPLEXITIES = ["Low", "Medium", "High"];

const DEVELOPMENT_TYPES = [
  "Web Application",
  "Mobile Application",
  "Desktop Application",
  "AI / Machine Learning",
  "Data Engineering",
  "Data Analytics",
  "Cloud Platform",
  "IoT System",
  "Other",
];

const TECHNOLOGY_OPTIONS = [
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Tailwind CSS",
  "TypeScript",
  "Node.js",
  "Express.js",
  "Spring Boot",
  ".NET",
  "Laravel",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "Firebase",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Power BI",
  "Other",
];

export default function ProjectSettings() {
  const { t } = useTranslation(["onboarding", "settings"]);
  const { data, updateSection, resetOnboarding } = useOnboarding();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiMessage>("");
  const [errorIsFallback, setErrorIsFallback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [problemStatementTouched, setProblemStatementTouched] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const markSaved = () => {
    setSaved(true);
    setHasChanges(false);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setErrorIsFallback(false);
    setSaved(false);

    try {
      let payload = data;
      if (!problemStatementTouched) {
        const currentProject = await fetchApi("/projects/my-project");
        payload = {
          ...data,
          description: {
            ...data.description,
            problemStatement: currentProject.description?.problemStatement || data.description.problemStatement,
            problemStatementLanguage:
              currentProject.description?.problemStatementLanguage || data.description.problemStatementLanguage,
          },
        };
      }

      await fetchApi("/projects/my-project", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setProblemStatementTouched(false);
      markSaved();
    } catch (err) {
      setError(err instanceof Error ? apiMessage(err) : "");
      setErrorIsFallback(!(err instanceof Error));
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S saves changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!isSaving) void handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, data, problemStatementTouched]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col font-sans pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link
            to="/workspace/settings"
            className="hover:text-primary transition-colors flex items-center gap-1 group"
          >
            <HugeiconsIcon icon="arrow-left" size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{t("projectSettings.backToSettings")}</span>
          </Link>
          <span className="text-outline-variant/60">/</span>
          <span className="text-on-surface">{t("projectSettings.title")}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                {t("projectSettings.title")}
              </h1>
              {hasChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Modifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("workspace.synced", { ns: "settings" })}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {t("projectSettings.description")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                resetOnboarding();
                markSaved();
              }}
              className="h-9 px-3.5 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              {t("projectSettings.resetDefaults")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <HugeiconsIcon icon={isSaving ? "cloud-sync" : "cloud-check"} size={16} className={isSaving ? "animate-spin" : ""} strokeWidth={1.8} />
              <span>{isSaving ? t("projectSettings.saving") : t("projectSettings.saveChanges")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saved && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="shrink-0" />
          <span>{t("projectSettings.savedNotice")}</span>
        </div>
      )}

      {(error || errorIsFallback) && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="cancel-circle" size={18} strokeWidth={2} className="shrink-0" />
          <span>{errorIsFallback ? t("projectSettings.saveError") : displayApiMessage(error)}</span>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {/* Section 1: Academic Basics */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <HugeiconsIcon icon="document" size={19} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("projectSettings.academicBasicsTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t("projectSettings.academicBasicsDescription")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <TextField
              id="settings-project-title"
              label={t("basics.projectTitle")}
              required
              value={data.basics.title}
              onChange={(title) => {
                setHasChanges(true);
                updateSection("basics", { title });
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                id="settings-type"
                label={t("basics.projectType")}
                value={data.basics.type}
                onChange={(type) => {
                  setHasChanges(true);
                  updateSection("basics", { type });
                }}
                options={displayOptions(PROJECT_TYPES, "projectType", t)}
              />
              <SelectField
                id="settings-domain"
                label={t("basics.domain")}
                required
                value={data.basics.domain}
                onChange={(domain) => {
                  setHasChanges(true);
                  updateSection("basics", { domain });
                }}
                options={displayOptions(DOMAINS, "domain", t)}
              />
              <SelectField
                id="settings-language"
                label={t("basics.reportLanguage")}
                value={data.basics.language}
                onChange={(language) => {
                  setHasChanges(true);
                  updateSection("basics", { language });
                }}
                options={displayOptions(LANGUAGES, "generationLanguage", t)}
              />
              <TextField
                id="settings-year"
                label={t("basics.academicYear")}
                value={data.basics.academicYear}
                onChange={(academicYear) => {
                  setHasChanges(true);
                  updateSection("basics", { academicYear });
                }}
              />
              <div className="md:col-span-2">
                <TextField
                  id="settings-university"
                  label={t("basics.university")}
                  value={data.basics.university}
                  onChange={(university) => {
                    setHasChanges(true);
                    updateSection("basics", { university });
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Problem Formulation & Objectives */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
              <HugeiconsIcon icon="group" size={19} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("projectSettings.projectContextTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t("projectSettings.projectContextDescription")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <TextAreaField
              id="settings-problem"
              label={t("description.problemStatement")}
              required
              rows={4}
              value={data.description.problemStatement}
              onChange={(problemStatement) => {
                setProblemStatementTouched(true);
                setHasChanges(true);
                updateSection("description", { problemStatement });
              }}
            />
            <TextAreaField
              id="settings-objective"
              label={t("description.projectObjective")}
              required
              rows={3}
              value={data.description.objective}
              onChange={(objective) => {
                setHasChanges(true);
                updateSection("description", { objective });
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextAreaField
                id="settings-deliverables"
                label={t("description.expectedDeliverables")}
                rows={3}
                value={data.description.deliverables}
                onChange={(deliverables) => {
                  setHasChanges(true);
                  updateSection("description", { deliverables });
                }}
              />
              <TextAreaField
                id="settings-stakeholders"
                label={t("description.stakeholders")}
                rows={3}
                value={data.description.stakeholders}
                onChange={(stakeholders) => {
                  setHasChanges(true);
                  updateSection("description", { stakeholders });
                }}
              />
              <TextField
                id="settings-company"
                label={t("description.internshipCompany")}
                value={data.description.company}
                onChange={(company) => {
                  setHasChanges(true);
                  updateSection("description", { company });
                }}
              />
              <TextField
                id="settings-industry"
                label={t("description.industrySector")}
                value={data.description.industry}
                onChange={(industry) => {
                  setHasChanges(true);
                  updateSection("description", { industry });
                }}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Technical Context & Stack */}
        <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <HugeiconsIcon icon="layers" size={19} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("projectSettings.technicalTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {t("projectSettings.technicalDescription")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <MultiSelectChips
              label={t("projectSettings.developmentScopeType")}
              values={data.technicalContext.developmentTypes}
              onChange={(developmentTypes) => {
                setHasChanges(true);
                updateSection("technicalContext", { developmentTypes });
              }}
              options={displayOptions(DEVELOPMENT_TYPES, "developmentType", t)}
            />
            {data.technicalContext.developmentTypes.includes("Other") && (
              <TextField
                id="settings-other-development-type"
                label={t("technical.otherDevelopmentType")}
                value={data.technicalContext.otherDevelopmentType}
                onChange={(otherDevelopmentType) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { otherDevelopmentType });
                }}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                id="settings-methodology"
                label={t("technical.methodology")}
                value={data.technicalContext.methodology}
                onChange={(methodology) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { methodology });
                }}
                options={displayOptions(METHODOLOGIES, "methodology", t)}
              />
              <SelectField
                id="settings-complexity"
                label={t("technical.projectComplexity")}
                value={data.technicalContext.complexity}
                onChange={(complexity) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { complexity });
                }}
                options={displayOptions(COMPLEXITIES, "complexity", t)}
              />
            </div>

            <MultiSelectChips
              label={t("technical.technologyStack")}
              values={data.technicalContext.technologies}
              onChange={(technologies) => {
                setHasChanges(true);
                updateSection("technicalContext", { technologies });
              }}
              options={displayOptions(TECHNOLOGY_OPTIONS, "technology", t)}
            />
            {data.technicalContext.technologies.includes("Other") && (
              <TextField
                id="settings-other-technologies"
                label={t("technical.otherTechnologies")}
                value={data.technicalContext.otherTechnologies}
                onChange={(otherTechnologies) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { otherTechnologies });
                }}
              />
            )}

            <TextField
              id="settings-target-users"
              label={t("technical.targetUsers")}
              value={data.technicalContext.targetUsers}
              onChange={(targetUsers) => {
                setHasChanges(true);
                updateSection("technicalContext", { targetUsers });
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="settings-team-size"
                label={t("technical.teamSize")}
                type="number"
                value={data.technicalContext.teamSize}
                onChange={(teamSize) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { teamSize: Number(teamSize) });
                }}
              />
              <TextField
                id="settings-duration"
                label={t("technical.duration")}
                type="number"
                value={data.technicalContext.duration}
                onChange={(duration) => {
                  setHasChanges(true);
                  updateSection("technicalContext", { duration: Number(duration) });
                }}
              />
            </div>
          </div>
        </section>

        {/* Bottom Inline Action Footer (In-flow, never floating) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/60">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <HugeiconsIcon icon="information-circle" size={16} strokeWidth={1.8} className="text-primary shrink-0" />
            <span>Raccourci clavier : <kbd className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant font-mono text-[11px] text-on-surface">⌘S</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant font-mono text-[11px] text-on-surface">Ctrl+S</kbd> pour sauvegarder instantanément.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                resetOnboarding();
                markSaved();
              }}
              className="h-9 px-3.5 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              {t("projectSettings.resetDefaults")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <HugeiconsIcon icon={isSaving ? "cloud-sync" : "cloud-check"} size={16} className={isSaving ? "animate-spin" : ""} strokeWidth={1.8} />
              <span>{isSaving ? t("projectSettings.saving") : t("projectSettings.saveChanges")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
