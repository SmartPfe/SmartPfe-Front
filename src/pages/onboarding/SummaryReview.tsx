import { useState } from "react";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { Link, useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";

function formatValue(value: string | number | string[]) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "Not provided";
  return value.trim() || "Not provided";
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
  items: { label: string; value: string | number | string[] }[];
}) {
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
          Edit
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <span className="font-label-md text-label-md text-on-surface-variant block mb-base">{item.label}</span>
            <p className="font-body-md text-body-md text-on-surface font-medium whitespace-pre-wrap break-words">
              {formatValue(item.value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SummaryReview() {
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
      title="Summary Review"
      description="Review your project details before final creation."
      backTo="/onboarding/3"
      nextLabel={isSubmitting ? "Creating..." : "Create Project"}
      nextIcon="check_circle"
      isNextDisabled={!canCreateProject || isSubmitting}
      onNextAction={handleCreateProject}
    >
      {!canCreateProject && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          Complete the required fields in Project Basics and Project Description before creating the workspace.
        </div>
      )}

      <SummarySection
        title="Basics"
        icon="info"
        editTo="/onboarding/1"
        items={[
          { label: "Project Title", value: data.basics.title },
          { label: "Project Type", value: data.basics.type },
          { label: "Domain", value: data.basics.domain },
          { label: "Report Language", value: data.basics.language },
          { label: "Academic Year", value: data.basics.academicYear },
          { label: "University", value: data.basics.university },
        ]}
      />

      <SummarySection
        title="Description"
        icon="description"
        editTo="/onboarding/2"
        items={[
          { label: "Problem Statement", value: data.description.problemStatement },
          { label: "Project Objective", value: data.description.objective },
          { label: "Detailed Description", value: data.description.detailedDescription },
          { label: "Expected Deliverables", value: data.description.deliverables },
          { label: "Internship Company", value: data.description.company },
          { label: "Industry Sector", value: data.description.industry },
          { label: "Stakeholders", value: data.description.stakeholders },
        ]}
      />

      <SummarySection
        title="Technical Context"
        icon="settings_suggest"
        editTo="/onboarding/3"
        items={[
          { label: "Development Type", value: data.technicalContext.developmentTypes },
          { label: "Methodology", value: data.technicalContext.methodology },
          { label: "Technology Stack", value: data.technicalContext.technologies },
          { label: "Other Technologies", value: data.technicalContext.otherTechnologies },
          { label: "Target Users", value: data.technicalContext.targetUsers },
          { label: "Project Complexity", value: data.technicalContext.complexity },
          { label: "Team Size", value: data.technicalContext.teamSize },
          { label: "Duration (months)", value: data.technicalContext.duration },
        ]}
      />

    </OnboardingStep>
  );
}
