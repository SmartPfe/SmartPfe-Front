import { useState } from "react";
import { MultiSelectChips, SelectField, TextAreaField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";

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

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-outline-variant rounded-lg p-lg flex flex-col gap-lg">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-base">{description}</p>
      </div>
      <div className="flex flex-col gap-lg">{children}</div>
    </section>
  );
}

export default function ProjectSettings() {
  const { data, updateSection, resetOnboarding } = useOnboarding();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const markSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSaved(false);

    try {
      await fetchApi("/projects/my-project", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      markSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Settings</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Project Settings</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Update the onboarding context used to initialize and generate your PFE workspace artifacts.
        </p>
      </header>

      {saved && (
        <div className="rounded-lg border border-secondary-fixed-dim bg-secondary-container px-md py-sm text-on-secondary-container font-body-md text-body-md">
          Project settings saved.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {error}
        </div>
      )}

      <SettingsSection title="Project Basics" description="Core academic and project identity information.">
        <TextField
          id="settings-project-title"
          label="Project Title"
          required
          value={data.basics.title}
          onChange={(title) => updateSection("basics", { title })}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <SelectField id="settings-type" label="Project Type" value={data.basics.type} onChange={(type) => updateSection("basics", { type })} options={PROJECT_TYPES} />
          <SelectField id="settings-domain" label="Domain" required value={data.basics.domain} onChange={(domain) => updateSection("basics", { domain })} options={DOMAINS} />
          <SelectField id="settings-language" label="Report Language" value={data.basics.language} onChange={(language) => updateSection("basics", { language })} options={LANGUAGES} />
          <TextField id="settings-year" label="Academic Year" value={data.basics.academicYear} onChange={(academicYear) => updateSection("basics", { academicYear })} />
          <TextField id="settings-university" label="University" value={data.basics.university} onChange={(university) => updateSection("basics", { university })} />
        </div>
      </SettingsSection>

      <SettingsSection title="Project Context" description="Problem, objective, deliverables, and stakeholders.">
        <TextAreaField
          id="settings-problem"
          label="Problem Statement"
          required
          rows={4}
          value={data.description.problemStatement}
          onChange={(problemStatement) => updateSection("description", { problemStatement })}
        />
        <TextAreaField
          id="settings-objective"
          label="Project Objective"
          required
          rows={3}
          value={data.description.objective}
          onChange={(objective) => updateSection("description", { objective })}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <TextAreaField id="settings-deliverables" label="Expected Deliverables" rows={3} value={data.description.deliverables} onChange={(deliverables) => updateSection("description", { deliverables })} />
          <TextAreaField id="settings-stakeholders" label="Stakeholders" rows={3} value={data.description.stakeholders} onChange={(stakeholders) => updateSection("description", { stakeholders })} />
          <TextField id="settings-company" label="Internship Company" value={data.description.company} onChange={(company) => updateSection("description", { company })} />
          <TextField id="settings-industry" label="Industry Sector" value={data.description.industry} onChange={(industry) => updateSection("description", { industry })} />
        </div>
      </SettingsSection>

      <SettingsSection title="Technical Context" description="Implementation choices used by generated requirements, backlog, and technical documentation.">
        <MultiSelectChips
          label="Development Type"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <TextField id="settings-team-size" label="Team Size" type="number" value={data.technicalContext.teamSize} onChange={(teamSize) => updateSection("technicalContext", { teamSize: Number(teamSize) })} />
          <TextField id="settings-duration" label="Duration (months)" type="number" value={data.technicalContext.duration} onChange={(duration) => updateSection("technicalContext", { duration: Number(duration) })} />
        </div>
      </SettingsSection>

      <footer className="flex flex-col sm:flex-row justify-between gap-md pt-md border-t border-outline-variant">
        <button
          type="button"
          onClick={() => {
            resetOnboarding();
            markSaved();
          }}
          className="px-lg py-sm rounded-DEFAULT border border-outline-variant bg-surface text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
        >
          Reset Onboarding Data
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-lg py-sm rounded-DEFAULT bg-primary text-on-primary font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Project Settings"}
        </button>
      </footer>
    </div>
  );
}
