import { useState } from "react";
import { Link } from "react-router-dom";
import { MultiSelectChips, SelectField, TextAreaField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon, { Folder01Icon } from "@/components/ui/HugeiconsIcon";

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

function SettingsSection({ 
  icon,
  title, 
  description, 
  children 
}: { 
  icon: string;
  title: string; 
  description: string; 
  children: React.ReactNode 
}) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 shadow-2xs flex flex-col gap-6">
      <div className="flex items-start gap-3.5 pb-4 border-b border-outline-variant/40">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <HugeiconsIcon icon={icon} size={19} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function ProjectSettings() {
  const { data, updateSection, resetOnboarding } = useOnboarding();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [problemStatementTouched, setProblemStatementTouched] = useState(false);

  const markSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
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
      setError(err instanceof Error ? err.message : "Failed to save project settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col h-full pb-24 font-sans">
      {/* Header & Notion Back Navigation */}
      <header className="mb-6 flex flex-col gap-2">
        <Link
          to="/workspace/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <HugeiconsIcon icon="arrow-left" size={14} strokeWidth={2} />
          <span>Back to Settings</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Project Specifications
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed mt-1">
              Update the academic parameters and technical context used to initialize and generate your PFE workspace artifacts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <HugeiconsIcon icon={isSaving ? "cloud-sync" : "cloud-check"} size={16} className={isSaving ? "animate-spin" : ""} strokeWidth={1.8} />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Notifications */}
      {saved && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-secondary text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="shrink-0" />
          <span>Project specifications have been updated and synchronized with your workspace.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-error text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <HugeiconsIcon icon="cancel-circle" size={18} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Section 1: Project Basics */}
        <SettingsSection 
          icon="document" 
          title="Academic Basics & Identity" 
          description="Core academic degree, title, institution, and language settings."
        >
          <TextField
            id="settings-project-title"
            label="Project Title"
            required
            value={data.basics.title}
            onChange={(title) => updateSection("basics", { title })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField id="settings-type" label="Project Type" value={data.basics.type} onChange={(type) => updateSection("basics", { type })} options={PROJECT_TYPES} />
            <SelectField id="settings-domain" label="Domain" required value={data.basics.domain} onChange={(domain) => updateSection("basics", { domain })} options={DOMAINS} />
            <SelectField id="settings-language" label="Report Language" value={data.basics.language} onChange={(language) => updateSection("basics", { language })} options={LANGUAGES} />
            <TextField id="settings-year" label="Academic Year" value={data.basics.academicYear} onChange={(academicYear) => updateSection("basics", { academicYear })} />
            <TextField id="settings-university" label="University" value={data.basics.university} onChange={(university) => updateSection("basics", { university })} />
          </div>
        </SettingsSection>

        {/* Section 2: Project Context */}
        <SettingsSection 
          icon="group" 
          title="Problem Statement & Industry Context" 
          description="Target problem formulation, project goals, deliverables, and host partner."
        >
          <TextAreaField
            id="settings-problem"
            label="Problem Statement"
            required
            rows={4}
            value={data.description.problemStatement}
            onChange={(problemStatement) => {
              setProblemStatementTouched(true);
              updateSection("description", { problemStatement });
            }}
          />
          <TextAreaField
            id="settings-objective"
            label="Project Objective"
            required
            rows={3}
            value={data.description.objective}
            onChange={(objective) => updateSection("description", { objective })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextAreaField id="settings-deliverables" label="Expected Deliverables" rows={3} value={data.description.deliverables} onChange={(deliverables) => updateSection("description", { deliverables })} />
            <TextAreaField id="settings-stakeholders" label="Stakeholders" rows={3} value={data.description.stakeholders} onChange={(stakeholders) => updateSection("description", { stakeholders })} />
            <TextField id="settings-company" label="Internship Company" value={data.description.company} onChange={(company) => updateSection("description", { company })} />
            <TextField id="settings-industry" label="Industry Sector" value={data.description.industry} onChange={(industry) => updateSection("description", { industry })} />
          </div>
        </SettingsSection>

        {/* Section 3: Technical Context */}
        <SettingsSection 
          icon="layers" 
          title="Technical Architecture & Methodology" 
          description="Implementation choices used by generated requirements, backlog, and technical documentation."
        >
          <MultiSelectChips
            label="Development Scope / Type"
            values={data.technicalContext.developmentTypes}
            onChange={(developmentTypes) => updateSection("technicalContext", { developmentTypes })}
            options={DEVELOPMENT_TYPES}
          />
          {data.technicalContext.developmentTypes.includes("Other") && (
            <TextField
              id="settings-other-development-type"
              label="Other Development Type"
              value={data.technicalContext.otherDevelopmentType}
              onChange={(otherDevelopmentType) => updateSection("technicalContext", { otherDevelopmentType })}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField id="settings-methodology" label="Methodology" value={data.technicalContext.methodology} onChange={(methodology) => updateSection("technicalContext", { methodology })} options={METHODOLOGIES} />
            <SelectField id="settings-complexity" label="Project Complexity" value={data.technicalContext.complexity} onChange={(complexity) => updateSection("technicalContext", { complexity })} options={COMPLEXITIES} />
          </div>
          <MultiSelectChips
            label="Technology Stack"
            values={data.technicalContext.technologies}
            onChange={(technologies) => updateSection("technicalContext", { technologies })}
            options={TECHNOLOGY_OPTIONS}
          />
          {data.technicalContext.technologies.includes("Other") && (
            <TextField
              id="settings-other-technologies"
              label="Other Technologies"
              value={data.technicalContext.otherTechnologies}
              onChange={(otherTechnologies) => updateSection("technicalContext", { otherTechnologies })}
            />
          )}
          <TextField id="settings-target-users" label="Target Users" value={data.technicalContext.targetUsers} onChange={(targetUsers) => updateSection("technicalContext", { targetUsers })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField id="settings-team-size" label="Team Size" type="number" value={data.technicalContext.teamSize} onChange={(teamSize) => updateSection("technicalContext", { teamSize: Number(teamSize) })} />
            <TextField id="settings-duration" label="Duration (months)" type="number" value={data.technicalContext.duration} onChange={(duration) => updateSection("technicalContext", { duration: Number(duration) })} />
          </div>
        </SettingsSection>
      </div>

      {/* Footer Actions */}
      <footer className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 mt-6 border-t border-outline-variant/60">
        <button
          type="button"
          onClick={() => {
            resetOnboarding();
            markSaved();
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          Reset Onboarding Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <HugeiconsIcon icon={isSaving ? "cloud-sync" : "cloud-check"} size={16} className={isSaving ? "animate-spin" : ""} strokeWidth={1.8} />
          <span>{isSaving ? "Saving..." : "Save Project Settings"}</span>
        </button>
      </footer>
    </div>
  );
}

