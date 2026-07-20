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

const METHODOLOGIES = [
  "Scrum",
  "Kanban",
  "Waterfall",
  "Hybrid",
  "Agile",
  "CRISP-DM",
  "DevOps",
  "Lean",
  "RUP",
  "V-Model",
  "Design Thinking",
];
const COMPLEXITIES = ["Low", "Medium", "High"];

const TECHNOLOGIES_BY_DEVELOPMENT_TYPE: Record<string, string[]> = {
  "Web Application": [
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
  ],
  "Mobile Application": [
    "React Native",
    "Flutter",
    "Kotlin",
    "Swift",
    "Firebase",
    "Node.js",
    "Spring Boot",
    ".NET",
    "PostgreSQL",
    "MongoDB",
  ],
  "Desktop Application": [
    "Java",
    ".NET",
    "Python",
    "Electron",
    "Qt",
    "PostgreSQL",
    "MySQL",
    "SQLite",
  ],
  "AI / Machine Learning": [
    "Python",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Jupyter Notebook",
    "FastAPI",
    "PostgreSQL",
    "Docker",
  ],
  "Data Engineering": [
    "Python",
    "Apache Spark",
    "Apache Kafka",
    "Airflow",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Google Cloud",
  ],
  "Data Analytics": [
    "Python",
    "Pandas",
    "NumPy",
    "Power BI",
    "Tableau",
    "Excel",
    "PostgreSQL",
    "MySQL",
    "Jupyter Notebook",
  ],
  "Cloud Platform": [
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Google Cloud",
    "Terraform",
    "Node.js",
    "Spring Boot",
    "PostgreSQL",
    "MongoDB",
  ],
  "IoT System": [
    "Arduino",
    "Raspberry Pi",
    "ESP32",
    "MQTT",
    "Python",
    "Node.js",
    "Firebase",
    "MongoDB",
    "Docker",
  ],
};

const FALLBACK_TECHNOLOGIES = Array.from(
  new Set(Object.values(TECHNOLOGIES_BY_DEVELOPMENT_TYPE).flat())
).sort();

function getTechnologyOptions(developmentTypes: string[]) {
  const selectedKnownTypes = developmentTypes.filter((type) => TECHNOLOGIES_BY_DEVELOPMENT_TYPE[type]);
  const source =
    selectedKnownTypes.length > 0
      ? selectedKnownTypes.flatMap((type) => TECHNOLOGIES_BY_DEVELOPMENT_TYPE[type] ?? [])
      : FALLBACK_TECHNOLOGIES;

  return [...Array.from(new Set(source)), "Other"];
}

function splitCustomValues(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function replaceCustomValues(values: string[], previousCustomValue: string, nextCustomValue: string) {
  const previousCustomValues = splitCustomValues(previousCustomValue).map((value) => value.toLowerCase());
  const nextValues = values.filter(
    (value) => value !== "Other" && !previousCustomValues.includes(value.toLowerCase())
  );

  splitCustomValues(nextCustomValue).forEach((customValue) => {
    if (!nextValues.some((value) => value.toLowerCase() === customValue.toLowerCase())) {
      nextValues.push(customValue);
    }
  });

  return nextValues;
}

export default function TechnicalContext() {
  const { data, updateSection } = useOnboarding();
  const technicalContext = data.technicalContext;
  const developmentTypeOptions = [
    ...DEVELOPMENT_TYPES.filter((type) => type !== "Other"),
    ...technicalContext.developmentTypes.filter((type) => !DEVELOPMENT_TYPES.includes(type)),
    "Other",
  ];
  const baseTechnologyOptions = getTechnologyOptions(technicalContext.developmentTypes);
  const technologyOptions = [
    ...baseTechnologyOptions.filter((technology) => technology !== "Other"),
    ...technicalContext.technologies.filter((technology) => !baseTechnologyOptions.includes(technology)),
    "Other",
  ];

  const handleDevelopmentTypesChange = (developmentTypes: string[]) => {
    const nextTechnologyOptions = getTechnologyOptions(developmentTypes);
    const technologies = technicalContext.technologies.filter((technology) =>
      nextTechnologyOptions.includes(technology)
    );

    updateSection("technicalContext", {
      developmentTypes,
      technologies,
      otherDevelopmentType: developmentTypes.includes("Other") ? technicalContext.otherDevelopmentType : "",
    });
  };

  const handleTechnologiesChange = (technologies: string[]) => {
    updateSection("technicalContext", {
      technologies,
      otherTechnologies: technologies.includes("Other") ? technicalContext.otherTechnologies : "",
    });
  };

  const handleOtherDevelopmentTypeChange = (otherDevelopmentType: string) => {
    updateSection("technicalContext", {
      otherDevelopmentType,
      developmentTypes: replaceCustomValues(
        technicalContext.developmentTypes,
        technicalContext.otherDevelopmentType,
        otherDevelopmentType
      ),
    });
  };

  const handleOtherTechnologiesChange = (otherTechnologies: string) => {
    updateSection("technicalContext", {
      otherTechnologies,
      technologies: replaceCustomValues(
        technicalContext.technologies,
        technicalContext.otherTechnologies,
        otherTechnologies
      ),
    });
  };

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
        onChange={handleDevelopmentTypesChange}
        options={developmentTypeOptions}
        helperText="Select every platform or technical category that applies to your project."
      />

      {(technicalContext.developmentTypes.includes("Other") || technicalContext.otherDevelopmentType) && (
        <TextField
          id="other-development-type"
          label="Other Development Type"
          value={technicalContext.otherDevelopmentType}
          onChange={handleOtherDevelopmentTypeChange}
          placeholder="e.g. AR/VR system, embedded system, blockchain application"
          helperText="Specify the real project type if it is not listed above."
        />
      )}

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
        onChange={handleTechnologiesChange}
        options={technologyOptions}
        helperText="Select the frameworks, languages, databases, cloud tools, and AI libraries used in your project."
      />

      {(technicalContext.technologies.includes("Other") || technicalContext.otherTechnologies) && (
        <TextField
          id="other-technologies"
          label="Other Technologies"
          value={technicalContext.otherTechnologies}
          onChange={handleOtherTechnologiesChange}
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
        helperText="This helps AI generate relevant actors and backlog items."
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
