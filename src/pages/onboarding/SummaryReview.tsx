import { useState } from "react";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { Link, useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { displayOptionLabel, type OnboardingOptionGroup } from "@/lib/onboardingOptions";

function formatValue(value: string | number | string[], t: (key: string) => string, optionGroup?: OnboardingOptionGroup) {
  if (Array.isArray(value)) {
    if (!value.length) return t("steps.notProvided");
    return optionGroup ? value.map((item) => displayOptionLabel(item, optionGroup, t)).join(", ") : value.join(", ");
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : t("steps.notProvided");
  const text = value.trim();
  if (!text) return t("steps.notProvided");
  return optionGroup ? displayOptionLabel(text, optionGroup, t) : text;
}

function SummarySection({
  title,
  icon,
  editTo,
  items,
}: {
  title: string;
  icon: string;
  editTo: string;
  items: { label: string; value: string | number | string[]; optionGroup?: OnboardingOptionGroup }[];
}) {
  const { t } = useTranslation("onboarding");
  return (
    <section className="flex flex-col gap-sm">
      <div className="flex items-center justify-between gap-md border-b border-outline-variant pb-xs">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-secondary">{icon}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        </div>
        <Link
          to={editTo}
          className="inline-flex items-center gap-base px-sm py-base rounded-DEFAULT text-primary hover:bg-surface-container-high transition-colors font-label-sm text-label-sm"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          {t("steps.edit")}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <span className="font-label-md text-label-md text-on-surface-variant block mb-base">{item.label}</span>
            <p className="font-body-md text-body-md text-on-surface font-medium whitespace-pre-wrap break-words">
              {formatValue(item.value, t, item.optionGroup)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SummaryReview() {
  const { t } = useTranslation("onboarding");
  const { data, isStepValid, resetOnboarding } = useOnboarding();
  const canCreateProject = isStepValid(1) && isStepValid(2);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async () => {
    if (!canCreateProject) return;
    setIsSubmitting(true);
    try {
      await fetchApi("/projects/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Update localStorage user
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.hasCompletedOnboarding = true;
        localStorage.setItem("user", JSON.stringify(user));
      }

      resetOnboarding();
      navigate("/workspace/overview");
    } catch (error) {
      console.error("Failed to create project:", error);
      // could show a toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingStep
      step={4}
      title={t("steps.summaryReviewTitle")}
      description={t("steps.summaryReviewDescription")}
      backTo="/onboarding/3"
      nextLabel={isSubmitting ? t("steps.creating") : t("steps.createProject")}
      nextIcon="check_circle"
      isNextDisabled={!canCreateProject || isSubmitting}
      onNextAction={handleCreateProject}
    >
      {!canCreateProject && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {t("steps.completeRequiredFields")}
        </div>
      )}

      <SummarySection
        title={t("steps.basics")}
        icon="info"
        editTo="/onboarding/1"
        items={[
          { label: t("summary.projectTitle"), value: data.basics.title },
          { label: t("summary.projectType"), value: data.basics.type, optionGroup: "projectType" },
          { label: t("summary.domain"), value: data.basics.domain, optionGroup: "domain" },
          { label: t("summary.reportLanguage"), value: data.basics.language, optionGroup: "generationLanguage" },
          { label: t("summary.academicYear"), value: data.basics.academicYear },
          { label: t("summary.university"), value: data.basics.university },
        ]}
      />

      <SummarySection
        title={t("steps.description")}
        icon="description"
        editTo="/onboarding/2"
        items={[
          { label: t("summary.problemStatement"), value: data.description.problemStatement },
          { label: t("summary.projectObjective"), value: data.description.objective },
          { label: t("summary.expectedDeliverables"), value: data.description.deliverables },
          { label: t("summary.internshipCompany"), value: data.description.company },
          { label: t("summary.industrySector"), value: data.description.industry },
          { label: t("summary.stakeholders"), value: data.description.stakeholders },
        ]}
      />

      <SummarySection
        title={t("steps.technicalContext")}
        icon="settings_suggest"
        editTo="/onboarding/3"
        items={[
          { label: t("summary.developmentType"), value: data.technicalContext.developmentTypes, optionGroup: "developmentType" },
          { label: t("summary.otherDevelopmentType"), value: data.technicalContext.otherDevelopmentType },
          { label: t("summary.methodology"), value: data.technicalContext.methodology, optionGroup: "methodology" },
          { label: t("summary.technologyStack"), value: data.technicalContext.technologies, optionGroup: "technology" },
          { label: t("summary.otherTechnologies"), value: data.technicalContext.otherTechnologies },
          { label: t("summary.targetUsers"), value: data.technicalContext.targetUsers },
          { label: t("summary.projectComplexity"), value: data.technicalContext.complexity, optionGroup: "complexity" },
          { label: t("summary.teamSize"), value: data.technicalContext.teamSize },
          { label: t("summary.duration"), value: data.technicalContext.duration },
        ]}
      />

    </OnboardingStep>
  );
}
