import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { TextAreaField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTranslation } from "react-i18next";

export default function ProjectDescription() {
  const { t } = useTranslation("onboarding");
  const { data, updateSection, isStepValid } = useOnboarding();
  const description = data.description;

  return (
    <OnboardingStep
      step={2}
      title={t("description.title")}
      description={t("description.description")}
      backTo="/onboarding/1"
      nextTo="/onboarding/3"
      nextLabel={t("steps.nextStep")}
      isNextDisabled={!isStepValid(2)}
    >
      <TextAreaField
        id="problem-statement"
        label={t("description.problemStatement")}
        required
        rows={4}
        value={description.problemStatement}
        onChange={(problemStatement) => updateSection("description", { problemStatement })}
        placeholder={t("description.problemStatementPlaceholder")}
        helperText={t("description.problemStatementHelper")}
      />

      <TextAreaField
        id="project-objective"
        label={t("description.projectObjective")}
        required
        rows={3}
        value={description.objective}
        onChange={(objective) => updateSection("description", { objective })}
        placeholder={t("description.projectObjectivePlaceholder")}
        helperText={t("description.projectObjectiveHelper")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextAreaField
          id="expected-deliverables"
          label={t("description.expectedDeliverables")}
          rows={3}
          value={description.deliverables}
          onChange={(deliverables) => updateSection("description", { deliverables })}
          placeholder={t("description.expectedDeliverablesPlaceholder")}
          helperText={t("description.expectedDeliverablesHelper")}
        />
        <TextAreaField
          id="stakeholders"
          label={t("description.stakeholders")}
          rows={3}
          value={description.stakeholders}
          onChange={(stakeholders) => updateSection("description", { stakeholders })}
          placeholder={t("description.stakeholdersPlaceholder")}
          helperText={t("description.stakeholdersHelper")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextField
          id="internship-company"
          label={t("description.internshipCompany")}
          value={description.company}
          onChange={(company) => updateSection("description", { company })}
          placeholder={t("description.internshipCompanyPlaceholder")}
          helperText={t("description.internshipCompanyHelper")}
        />
        <TextField
          id="industry-sector"
          label={t("description.industrySector")}
          value={description.industry}
          onChange={(industry) => updateSection("description", { industry })}
          placeholder={t("description.industrySectorPlaceholder")}
          helperText={t("description.industrySectorHelper")}
        />
      </div>
    </OnboardingStep>
  );
}
