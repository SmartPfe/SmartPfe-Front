import OnboardingStep from "@/components/onboarding/OnboardingStep";
import { TextAreaField, TextField } from "@/components/onboarding/FormControls";
import { useOnboarding } from "@/context/OnboardingContext";

export default function ProjectDescription() {
  const { data, updateSection, isStepValid } = useOnboarding();
  const description = data.description;

  return (
    <OnboardingStep
      step={2}
      title="Project Description"
      description="Capture the problem, objective, deliverables, and stakeholders so AI modules can generate accurate project artifacts."
      backTo="/onboarding/1"
      nextTo="/onboarding/3"
      nextLabel="Next Step"
      isNextDisabled={!isStepValid(2)}
    >
      <TextAreaField
        id="problem-statement"
        label="Problem Statement"
        required
        rows={4}
        value={description.problemStatement}
        onChange={(problemStatement) => updateSection("description", { problemStatement })}
        placeholder="Describe the problem, who is affected, and why it matters."
        helperText="Explain the current pain point, limitation, or opportunity. This will be reused to generate the formal problem statement."
      />

      <TextAreaField
        id="project-objective"
        label="Project Objective"
        required
        rows={3}
        value={description.objective}
        onChange={(objective) => updateSection("description", { objective })}
        placeholder="State the main goal your project must achieve."
        helperText="Write the desired outcome in measurable terms when possible."
      />

      <TextAreaField
        id="detailed-description"
        label="Detailed Description"
        rows={5}
        value={description.detailedDescription}
        onChange={(detailedDescription) => updateSection("description", { detailedDescription })}
        placeholder="Describe the solution scope, important modules, and expected workflow."
        helperText="Include context that helps the AI understand what the platform should do and what it should avoid."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextAreaField
          id="expected-deliverables"
          label="Expected Deliverables"
          rows={3}
          value={description.deliverables}
          onChange={(deliverables) => updateSection("description", { deliverables })}
          placeholder="e.g. Web app, API, documentation, deployment guide"
          helperText="List the outputs you expect to submit or demonstrate."
        />
        <TextAreaField
          id="stakeholders"
          label="Stakeholders"
          rows={3}
          value={description.stakeholders}
          onChange={(stakeholders) => updateSection("description", { stakeholders })}
          placeholder="e.g. Students, supervisors, administrators"
          helperText="Mention people or organizations that use, review, or benefit from the project."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <TextField
          id="internship-company"
          label="Internship Company"
          value={description.company}
          onChange={(company) => updateSection("description", { company })}
          placeholder="Optional company name"
          helperText="Leave empty for a purely academic project."
        />
        <TextField
          id="industry-sector"
          label="Industry Sector"
          value={description.industry}
          onChange={(industry) => updateSection("description", { industry })}
          placeholder="e.g. Education, FinTech, Healthcare"
          helperText="This helps tailor examples, risks, and business context."
        />
      </div>
    </OnboardingStep>
  );
}
