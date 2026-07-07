import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

export type RequirementPriority = "Must Have" | "Should Have" | "Could Have" | "Won't Have";
export type RequirementStatus = "Draft" | "In Review" | "Approved";

export type FunctionalRequirement = {
  _id?: string;
  localId?: string;
  code: string;
  module: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  status: RequirementStatus;
};

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const normalizePriority = (priority: string): RequirementPriority => {
  if (priority === "Must Have" || priority === "Could Have" || priority === "Won't Have") {
    return priority;
  }
  return "Should Have";
};

const normalizeStatus = (status: string): RequirementStatus => {
  if (status === "Approved" || status === "In Review") {
    return status;
  }
  return "Draft";
};

export const normalizeRequirements = (requirements: FunctionalRequirement[] = []): FunctionalRequirement[] =>
  requirements.map((requirement, index) => ({
    ...requirement,
    code: requirement.code || `FR-${String(index + 1).padStart(2, "0")}`,
    module: requirement.module || "Core",
    title: requirement.title || "",
    description: requirement.description || "",
    priority: normalizePriority(requirement.priority),
    status: normalizeStatus(requirement.status),
  }));

export const renumberRequirements = (requirements: FunctionalRequirement[]) =>
  requirements.map((requirement, index) => ({
    ...requirement,
    code: `FR-${String(index + 1).padStart(2, "0")}`,
  }));

export function useFunctionalRequirements() {
  const [project, setProject] = useState<any>(null);
  const [requirements, setRequirements] = useState<FunctionalRequirement[]>([]);
  const [suggestion, setSuggestion] = useState<FunctionalRequirement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const requirementsRef = useRef<FunctionalRequirement[]>([]);

  useEffect(() => {
    requirementsRef.current = requirements;
  }, [requirements]);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const data = await fetchApi(`/projects/${projectData._id}/functional-requirements`);
        setRequirements(normalizeRequirements(data.functionalRequirements || []));
      } catch (err: any) {
        setError(err.message || "Failed to load functional requirements. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, []);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveRequirements = useCallback(async (nextRequirements = requirements, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const hasIncompleteRequirement = nextRequirements.some(
      (requirement) =>
        !requirement.module.trim() ||
        !requirement.title.trim() ||
        !requirement.description.trim()
    );
    if (hasIncompleteRequirement) {
      if (showValidation) {
        setError("Please fill each requirement module, title, and description before saving.");
      }
      setSaveStatus("unsaved");
      return;
    }

    const normalized = renumberRequirements(normalizeRequirements(nextRequirements));
    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/functional-requirements`, {
        method: "PUT",
        body: JSON.stringify({ functionalRequirements: normalized }),
      });
      if (JSON.stringify(renumberRequirements(requirementsRef.current)) === JSON.stringify(normalized)) {
        setRequirements(normalizeRequirements(res.functionalRequirements || []));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save functional requirements. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, requirements]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") {
      return;
    }

    const hasIncompleteRequirement = requirements.some(
      (requirement) =>
        !requirement.module.trim() ||
        !requirement.title.trim() ||
        !requirement.description.trim()
    );
    if (hasIncompleteRequirement) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveRequirements(requirements);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [aiState, project?._id, requirements, saveRequirements, saveStatus]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/functional-requirements/generate", { method: "POST" });
      setSuggestion(normalizeRequirements(res.functionalRequirements || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (requirements.length === 0) {
      setError("Add or generate functional requirements before asking AI to refine them.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/functional-requirements/refine", {
        method: "POST",
        body: JSON.stringify({ functionalRequirements: requirements }),
      });
      setSuggestion(normalizeRequirements(res.functionalRequirements || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(() => {
    if (suggestion) {
      setRequirements(renumberRequirements(suggestion));
      setSaveStatus("unsaved");
    }
    setSuggestion(null);
    setAiState("idle");
  }, [suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    requirements,
    setRequirements,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    markUnsaved,
    saveRequirements,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
