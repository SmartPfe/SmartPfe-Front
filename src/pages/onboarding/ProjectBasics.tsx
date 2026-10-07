import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { OptionCards, SelectField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";
import { displayOptions } from "@/lib/onboardingOptions";

const PROJECT_TYPES = [
  {
    value: "Academic Project",
    labelKey: "options.projectType.academic",
    descriptionKey: "options.projectTypeDescriptions.academic",
    icon: "school",
  },
  {
    value: "Internship / Industrial Project",
    labelKey: "options.projectType.internship",
    descriptionKey: "options.projectTypeDescriptions.internship",
    icon: "domain",
  },
  {
    value: "Startup Project",
    labelKey: "options.projectType.startup",
    descriptionKey: "options.projectTypeDescriptions.startup",
    icon: "rocket_launch",
  },
  {
    value: "Research Project",
    labelKey: "options.projectType.research",
    descriptionKey: "options.projectTypeDescriptions.research",
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
  const { t } = useTranslation("onboarding");
  const { data, updateSection, isStepValid } = useOnboarding();
  const basics = data.basics;
  const projectTypeOptions = PROJECT_TYPES.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    description: t(option.descriptionKey),
    icon: option.icon,
  }));

  return (
    <OnboardingStep
      step={1}
      title={t("basics.title")}
      description={t("basics.description")}
      nextTo="/onboarding/2"
      nextLabel={t("steps.nextStep")}
      isNextDisabled={!isStepValid(1)}
    >
      <TextField
        id="project-title"
        label={t("basics.projectTitle")}
        required
        value={basics.title}
        onChange={(title) => updateSection("basics", { title })}
        placeholder={t("basics.projectTitlePlaceholder")}
        helperText={t("basics.projectTitleHelper")}
      />

      <OptionCards
        label={t("basics.projectType")}
        value={basics.type}
        onChange={(type) => updateSection("basics", { type })}
        options={projectTypeOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <SelectField
          id="project-domain"
          label={t("basics.domain")}
          required
          value={basics.domain}
          onChange={(domain) => updateSection("basics", { domain })}
          options={displayOptions(DOMAINS, "domain", t)}
        />
        <SelectField
          id="report-language"
          label={t("basics.reportLanguage")}
          value={basics.language}
          onChange={(language) => updateSection("basics", { language })}
          options={displayOptions(LANGUAGES, "generationLanguage", t)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextField
          id="academic-year"
          label={t("basics.academicYear")}
          value={basics.academicYear}
          onChange={(academicYear) => updateSection("basics", { academicYear })}
          placeholder="2025-2026"
        />
        <TextField
          id="university"
          label={t("basics.university")}
          value={basics.university}
          onChange={(university) => updateSection("basics", { university })}
          placeholder={t("basics.universityPlaceholder")}
        />
      </div>
    </OnboardingStep>
  );
}
