import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { MultiSelectChips, SelectField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";

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

const METHODOLOGIES = ["Scrum", "Kanban", "Waterfall", "Hybrid"];
const COMPLEXITIES = ["Low", "Medium", "High"];
const TECHNOLOGY_OPTIONS = [
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Express.js",
  "Spring Boot",
  ".NET",
  "Laravel",
  "Python",
  "Django",
  "FastAPI",
  "Java",
  "TypeScript",
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

export default function TechnicalContext() {
  const { data, updateSection } = useOnboarding();
  const technicalContext = data.technicalContext;

  return (
    <OnboardingStep
      step={3}
      title="Technical Context"
      description="Describe how the project will be built so generated artifacts match the real implementation scope."
      backTo="/onboarding/2"
      nextTo="/onboarding/4"
      nextLabel="Review Summary"
    >
      <MultiSelectChips
        label="Development Type"
        values={technicalContext.developmentTypes}
        onChange={(developmentTypes) => updateSection("technicalContext", { developmentTypes })}
        options={DEVELOPMENT_TYPES}
        helperText="Select every platform or technical category that applies to your project."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <SelectField
          id="methodology"
          label="Methodology"
          value={technicalContext.methodology}
          onChange={(methodology) => updateSection("technicalContext", { methodology })}
          options={METHODOLOGIES}
        />
        <SelectField
          id="complexity"
          label="Project Complexity"
          value={technicalContext.complexity}
          onChange={(complexity) => updateSection("technicalContext", { complexity })}
          options={COMPLEXITIES}
        />
      </div>

      <MultiSelectChips
        label="Technology Stack"
        values={technicalContext.technologies}
        onChange={(technologies) => updateSection("technicalContext", { technologies })}
        options={TECHNOLOGY_OPTIONS}
        helperText="Select the frameworks, languages, databases, cloud tools, and AI libraries used in your project."
      />

      {technicalContext.technologies.includes("Other") && (
        <TextField
          id="other-technologies"
          label="Other Technologies"
          value={technicalContext.otherTechnologies}
          onChange={(otherTechnologies) => updateSection("technicalContext", { otherTechnologies })}
          placeholder="e.g. Odoo, Figma, MATLAB, Apache Kafka"
          helperText="Use this only for real tools or technologies that are not available in the list."
        />
      )}

      <TextField
        id="target-users"
        label="Target Users"
        value={technicalContext.targetUsers}
        onChange={(targetUsers) => updateSection("technicalContext", { targetUsers })}
        placeholder="e.g. Students, academic supervisors, company supervisors, administrators"
        helperText="This helps AI generate relevant actors, user stories, and backlog items."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextField
          id="team-size"
          label="Team Size"
          type="number"
          value={technicalContext.teamSize}
          onChange={(teamSize) => updateSection("technicalContext", { teamSize: Number(teamSize) })}
          placeholder="1"
        />
        <TextField
          id="duration"
          label="Duration (months)"
          type="number"
          value={technicalContext.duration}
          onChange={(duration) => updateSection("technicalContext", { duration: Number(duration) })}
          placeholder="4"
        />
      </div>
    </OnboardingStep>
  );
}
