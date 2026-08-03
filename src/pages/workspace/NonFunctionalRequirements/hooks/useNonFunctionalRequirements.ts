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

export type AiState = "idle" | "generating" | "refining" | "translating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const LANGUAGE_CODES: Record<string, string> = {
  english: "en",
  french: "fr",
  arabic: "ar",
  en: "en",
  fr: "fr",
  ar: "ar",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
};

export function normalizeLanguage(language?: string | null) {
  const value = String(language || "").trim();
  if (!value) return "";
  return LANGUAGE_CODES[value.toLowerCase()] || value.toLowerCase();
}

export function getLanguageLabel(language?: string | null) {
  const normalized = normalizeLanguage(language);
  return LANGUAGE_LABELS[normalized] || language || "current language";
}

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

  const saveRequirements = useCallback(async (nextRequirements = requirements, showValidation = false, language?: string) => {
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
      const payload = language
        ? { nonFunctionalRequirements: normalized, language }
        : { nonFunctionalRequirements: normalized };
      const res = await fetchApi(`/projects/${project._id}/non-functional-requirements`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(renumberRequirements(requirementsRef.current)) === JSON.stringify(normalized)) {
        setRequirements(normalizeRequirements(res.nonFunctionalRequirements || []));
        setProject((current: any) => current ? {
          ...current,
          nonFunctionalRequirementsLanguage: res.language ?? current.nonFunctionalRequirementsLanguage ?? "",
        } : current);
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
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") return;

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

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const nonFunctionalRequirementsLanguage = normalizeLanguage(project?.nonFunctionalRequirementsLanguage);

  const refineWithAi = async (instructions = "") => {
    if (requirements.length === 0) {
      setError("Add or generate non-functional requirements before asking AI to refine them.");
      return;
    }

    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { nonFunctionalRequirements: requirements, instructions: trimmedInstructions }
        : { nonFunctionalRequirements: requirements };
      const res = await fetchApi("/ai/non-functional-requirements/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(normalizeRequirements(res.nonFunctionalRequirements || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (requirements.length === 0) {
      setError("Add or generate non-functional requirements before asking AI to translate them.");
      return;
    }

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/non-functional-requirements/translate", {
        method: "POST",
        body: JSON.stringify({ nonFunctionalRequirements: requirements }),
      });
      const translatedRequirements = renumberRequirements(normalizeRequirements(res.nonFunctionalRequirements || []));
      requirementsRef.current = translatedRequirements;
      setRequirements(translatedRequirements);
      await saveRequirements(translatedRequirements, false, projectLanguage || undefined);
      setAiState("idle");
    } catch (err: any) {
      setError(err.message || "AI non-functional requirement translation failed. Please try again.");
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
      await saveRequirements(nextRequirements, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [projectLanguage, saveRequirements, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
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
    translateWithAi,
    projectLanguage,
    nonFunctionalRequirementsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
