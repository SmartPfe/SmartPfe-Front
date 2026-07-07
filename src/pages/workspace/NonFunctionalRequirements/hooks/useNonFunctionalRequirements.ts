import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

export type RequirementPriority = "Must Have" | "Should Have" | "Could Have" | "Won't Have";
export type RequirementStatus = "Draft" | "In Review" | "Approved";

export type NonFunctionalRequirement = {
  _id?: string;
  localId?: string;
  code: string;
  category: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  status: RequirementStatus;
};

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const normalizePriority = (priority: string): RequirementPriority => {
  if (priority === "Must Have" || priority === "Could Have" || priority === "Won't Have") return priority;
  return "Should Have";
};

const normalizeStatus = (status: string): RequirementStatus => {
  if (status === "Approved" || status === "In Review") return status;
  return "Draft";
};

export const normalizeRequirements = (requirements: NonFunctionalRequirement[] = []): NonFunctionalRequirement[] =>
  requirements.map((requirement, index) => ({
    ...requirement,
    code: requirement.code || `NFR-${String(index + 1).padStart(2, "0")}`,
    category: requirement.category || "Quality",
    title: requirement.title || "",
    description: requirement.description || "",
    priority: normalizePriority(requirement.priority),
    status: normalizeStatus(requirement.status),
  }));

export const renumberRequirements = (requirements: NonFunctionalRequirement[]) =>
  requirements.map((requirement, index) => ({
    ...requirement,
    code: `NFR-${String(index + 1).padStart(2, "0")}`,
  }));

export function useNonFunctionalRequirements() {
  const [project, setProject] = useState<any>(null);
  const [requirements, setRequirements] = useState<NonFunctionalRequirement[]>([]);
  const [suggestion, setSuggestion] = useState<NonFunctionalRequirement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const requirementsRef = useRef<NonFunctionalRequirement[]>([]);

  useEffect(() => {
    requirementsRef.current = requirements;
  }, [requirements]);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const data = await fetchApi(`/projects/${projectData._id}/non-functional-requirements`);
        setRequirements(normalizeRequirements(data.nonFunctionalRequirements || []));
      } catch (err: any) {
        setError(err.message || "Failed to load non-functional requirements. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, []);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveRequirements = useCallback(async (nextRequirements = requirements, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const hasIncompleteRequirement = nextRequirements.some(
      (requirement) =>
        !requirement.category.trim() ||
        !requirement.title.trim() ||
        !requirement.description.trim()
    );
    if (hasIncompleteRequirement) {
      if (showValidation) {
        setError("Please fill each requirement category, title, and description before saving.");
      }
      setSaveStatus("unsaved");
      return;
    }

    const normalized = renumberRequirements(normalizeRequirements(nextRequirements));
    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/non-functional-requirements`, {
        method: "PUT",
        body: JSON.stringify({ nonFunctionalRequirements: normalized }),
      });
      if (JSON.stringify(renumberRequirements(requirementsRef.current)) === JSON.stringify(normalized)) {
        setRequirements(normalizeRequirements(res.nonFunctionalRequirements || []));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save non-functional requirements. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, requirements]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") return;

    const hasIncompleteRequirement = requirements.some(
      (requirement) =>
        !requirement.category.trim() ||
        !requirement.title.trim() ||
        !requirement.description.trim()
    );
    if (hasIncompleteRequirement) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = window.setTimeout(() => {
      saveRequirements(requirements);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, project?._id, requirements, saveRequirements, saveStatus]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/non-functional-requirements/generate", { method: "POST" });
      setSuggestion(normalizeRequirements(res.nonFunctionalRequirements || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (requirements.length === 0) {
      setError("Add or generate non-functional requirements before asking AI to refine them.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/non-functional-requirements/refine", {
        method: "POST",
        body: JSON.stringify({ nonFunctionalRequirements: requirements }),
      });
      setSuggestion(normalizeRequirements(res.nonFunctionalRequirements || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      const nextRequirements = renumberRequirements(suggestion);
      requirementsRef.current = nextRequirements;
      setRequirements(nextRequirements);
      setSuggestion(null);
      setAiState("idle");
      await saveRequirements(nextRequirements);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [saveRequirements, suggestion]);

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
