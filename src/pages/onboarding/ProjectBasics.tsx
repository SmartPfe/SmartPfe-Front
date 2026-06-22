import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { OptionCards, SelectField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";

const PROJECT_TYPES = [
  {
    label: "Academic Project",
    description: "University-led project focused on academic validation.",
    icon: "school",
  },
  {
    label: "Internship / Industrial Project",
    description: "Company-hosted project solving a real business need.",
    icon: "domain",
  },
  {
    label: "Startup Project",
    description: "Product-oriented idea with market and growth potential.",
    icon: "rocket_launch",
  },
  {
    label: "Research Project",
    description: "Investigation-driven work with experiments or publications.",
    icon: "biotech",
  },
];

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

export default function ProjectBasics() {
  const { data, updateSection, isStepValid } = useOnboarding();
  const basics = data.basics;

  return (
    <OnboardingStep
      step={1}
      title="Project Basics"
      description="Define the identity and academic context of the PFE workspace."
      nextTo="/onboarding/2"
      nextLabel="Next Step"
      isNextDisabled={!isStepValid(1)}
    >
      <TextField
        id="project-title"
        label="Project Title"
        required
        value={basics.title}
        onChange={(title) => updateSection("basics", { title })}
        placeholder="e.g. AI-Powered PFE Management Platform"
        helperText="Use a clear title that describes the solution and its purpose."
      />

      <OptionCards
        label="Project Type"
        value={basics.type}
        onChange={(type) => updateSection("basics", { type })}
        options={PROJECT_TYPES}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <SelectField
          id="project-domain"
          label="Domain"
          required
          value={basics.domain}
          onChange={(domain) => updateSection("basics", { domain })}
          options={DOMAINS}
        />
        <SelectField
          id="report-language"
          label="Report Language"
          value={basics.language}
          onChange={(language) => updateSection("basics", { language })}
          options={LANGUAGES}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextField
          id="academic-year"
          label="Academic Year"
          value={basics.academicYear}
          onChange={(academicYear) => updateSection("basics", { academicYear })}
          placeholder="2025-2026"
        />
        <TextField
          id="university"
          label="University"
          value={basics.university}
          onChange={(university) => updateSection("basics", { university })}
          placeholder="Your university"
        />
      </div>
    </OnboardingStep>
  );
}
