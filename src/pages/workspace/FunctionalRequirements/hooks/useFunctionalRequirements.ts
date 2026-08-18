import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

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

const TASK_ID = "functional-requirements:main";
const SCOPE = "functional-requirements";
const PAGE_ROUTE = "/workspace/functional-requirements";

export function useFunctionalRequirements() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [requirements, setRequirements] = useState<FunctionalRequirement[]>([]);
  const [suggestion, setSuggestion] = useState<FunctionalRequirement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const requirementsRef = useRef<FunctionalRequirement[]>([]);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    requirementsRef.current = requirements;
  }, [requirements]);

  const fetchRequirementsData = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);

      const data = await fetchApi(`/projects/${projectData._id}/functional-requirements`);
      const normalized = normalizeRequirements(data.functionalRequirements || []);
      setRequirements(normalized);
      requirementsRef.current = normalized;
      return { projectData, requirements: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load functional requirements. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequirementsData();
  }, [fetchRequirementsData]);

  // Sync background task state & hydrate completed refinement results
  useEffect(() => {
    const task = tasks[TASK_ID];
    if (!task) {
      if (localAiState === "generating" || localAiState === "refining" || localAiState === "translating") {
        setLocalAiState("idle");
      }
      return;
    }

    if (task.status === "completed" && task.result) {
      const taskNonce = `${task.id}-${task.completedAt}`;
      if (handledTaskIdRef.current !== taskNonce) {
        handledTaskIdRef.current = taskNonce;
        if (task.result.type === "suggestion" && Array.isArray(task.result.requirements)) {
          setSuggestion(task.result.requirements);
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "saved" && Array.isArray(task.result.requirements)) {
          setRequirements(task.result.requirements);
          requirementsRef.current = task.result.requirements;
          setLocalAiState("idle");
          fetchRequirementsData();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchRequirementsData, localAiState, tasks]);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveRequirements = useCallback(
    async (nextRequirements = requirements, showValidation = false, language?: string) => {
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
        const payload = language
          ? { functionalRequirements: normalized, language }
          : { functionalRequirements: normalized };
        const res = await fetchApi(`/projects/${project._id}/functional-requirements`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (JSON.stringify(renumberRequirements(requirementsRef.current)) === JSON.stringify(normalized)) {
          const resNormalized = normalizeRequirements(res.functionalRequirements || []);
          setRequirements(resNormalized);
          requirementsRef.current = resNormalized;
          setProject((current: any) =>
            current
              ? {
                  ...current,
                  functionalRequirementsLanguage: res.language ?? current.functionalRequirementsLanguage ?? "",
                }
              : current
          );
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save functional requirements. Please try again.");
        setSaveStatus("unsaved");
      }
    },
    [project?._id, requirements]
  );

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || isAiBusy) {
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
  }, [isAiBusy, project?._id, requirements, saveRequirements, saveStatus]);

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const functionalRequirementsLanguage = normalizeLanguage(project?.functionalRequirementsLanguage);

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; requirements: FunctionalRequirement[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Functional Requirements",
        subTitle: "Generating functional requirements with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/functional-requirements/generate", {
            method: "POST",
            signal,
          });
          const normalized = normalizeRequirements(res.functionalRequirements || []);
          return { type: "suggestion", requirements: normalized };
        },
      });

      if (result?.requirements) {
        setSuggestion(result.requirements);
        setLocalAiState("suggestion_ready");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI generation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const refineWithAi = async (instructions = "") => {
    if (requirements.length === 0) {
      setError("Add or generate functional requirements before asking AI to refine them.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { functionalRequirements: requirementsRef.current, instructions: trimmedInstructions }
        : { functionalRequirements: requirementsRef.current };

      const result = await startTask<{ type: string; requirements: FunctionalRequirement[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Functional Requirements",
        subTitle: "Refining functional requirements with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/functional-requirements/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const normalized = normalizeRequirements(res.functionalRequirements || []);
          return { type: "suggestion", requirements: normalized };
        },
      });

      if (result?.requirements) {
        setSuggestion(result.requirements);
        setLocalAiState("suggestion_ready");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI refinement failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (requirements.length === 0) {
      setError("Add or generate functional requirements before asking AI to translate them.");
      return;
    }

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; requirements: FunctionalRequirement[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Functional Requirements",
        subTitle: `Translating functional requirements to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/functional-requirements/translate", {
            method: "POST",
            body: JSON.stringify({ functionalRequirements: requirementsRef.current }),
            signal,
          });
          const translatedRequirements = renumberRequirements(
            normalizeRequirements(res.functionalRequirements || [])
          );

          if (project?._id) {
            const savePayload = projectLanguage
              ? { functionalRequirements: translatedRequirements, language: projectLanguage }
              : { functionalRequirements: translatedRequirements };
            await fetchApi(`/projects/${project._id}/functional-requirements`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
              signal,
            });
          }

          return { type: "saved", requirements: translatedRequirements };
        },
      });

      if (result?.requirements) {
        requirementsRef.current = result.requirements;
        setRequirements(result.requirements);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI functional requirement translation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const cancelAi = useCallback(() => {
    cancelTask(TASK_ID);
    setLocalAiState("idle");
  }, [cancelTask]);

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      const nextRequirements = renumberRequirements(suggestion);
      requirementsRef.current = nextRequirements;
      setRequirements(nextRequirements);
      setSuggestion(null);
      setLocalAiState("idle");
      dismissTask(TASK_ID);
      await saveRequirements(nextRequirements, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask, projectLanguage, saveRequirements, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    requirements,
    setRequirements,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveRequirements,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    functionalRequirementsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
