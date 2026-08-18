import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

export type ExistingSolution = {
  _id?: string;
  localId?: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  solvedProblem: string;
  strengths: string[];
  weaknesses: string[];
  differentiation: string;
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

const normalizeList = (items: string[] = []) =>
  items.map((item) => item || "").filter((item) => item.trim().length > 0);

export const normalizeSolutions = (solutions: ExistingSolution[] = []): ExistingSolution[] =>
  solutions.map((solution) => ({
    ...solution,
    name: solution.name || "",
    category: solution.category || "Existing Solution",
    icon: solution.icon || "search",
    description: solution.description || "",
    solvedProblem: solution.solvedProblem || "",
    strengths: normalizeList(solution.strengths || []),
    weaknesses: normalizeList(solution.weaknesses || []),
    differentiation: solution.differentiation || "",
  }));

const TASK_ID = "existing-solutions:main";
const SCOPE = "existing-solutions";
const PAGE_ROUTE = "/workspace/solutions";

export function useExistingSolutions() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [solutions, setSolutions] = useState<ExistingSolution[]>([]);
  const [suggestion, setSuggestion] = useState<ExistingSolution[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const solutionsRef = useRef<ExistingSolution[]>([]);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    solutionsRef.current = solutions;
  }, [solutions]);

  const fetchSolutionsData = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);

      const data = await fetchApi(`/projects/${projectData._id}/existing-solutions`);
      const normalized = normalizeSolutions(data.existingSolutions || []);
      setSolutions(normalized);
      solutionsRef.current = normalized;
      return { projectData, solutions: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load existing solutions. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolutionsData();
  }, [fetchSolutionsData]);

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
        if (task.result.type === "suggestion" && Array.isArray(task.result.solutions)) {
          setSuggestion(task.result.solutions);
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "saved" && Array.isArray(task.result.solutions)) {
          setSolutions(task.result.solutions);
          solutionsRef.current = task.result.solutions;
          setLocalAiState("idle");
          fetchSolutionsData();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchSolutionsData, localAiState, tasks]);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveSolutions = useCallback(
    async (nextSolutions = solutions, showValidation = false, language?: string) => {
      if (!project?._id) {
        setError("Project is not ready yet. Please refresh the page.");
        return;
      }

      const hasIncompleteSolution = nextSolutions.some(
        (solution) =>
          !solution.name.trim() ||
          !solution.description.trim() ||
          !solution.solvedProblem.trim() ||
          !solution.differentiation.trim()
      );
      if (hasIncompleteSolution) {
        if (showValidation) {
          setError("Please fill the name, description, solved problem, and differentiation before saving.");
        }
        setSaveStatus("unsaved");
        return;
      }

      setSaveStatus("saving");
      setError(null);

      try {
        const payload = language
          ? { existingSolutions: nextSolutions, language }
          : { existingSolutions: nextSolutions };
        const res = await fetchApi(`/projects/${project._id}/existing-solutions`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (JSON.stringify(solutionsRef.current) === JSON.stringify(nextSolutions)) {
          const normalized = normalizeSolutions(res.existingSolutions || []);
          setSolutions(normalized);
          solutionsRef.current = normalized;
          setProject((current: any) =>
            current
              ? {
                  ...current,
                  existingSolutionsLanguage: res.language ?? current.existingSolutionsLanguage ?? "",
                }
              : current
          );
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save existing solutions. Please try again.");
        setSaveStatus("unsaved");
      }
    },
    [project?._id, solutions]
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

    const hasIncompleteSolution = solutions.some(
      (solution) =>
        !solution.name.trim() ||
        !solution.description.trim() ||
        !solution.solvedProblem.trim() ||
        !solution.differentiation.trim()
    );
    if (hasIncompleteSolution) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveSolutions(solutions);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isAiBusy, project?._id, saveSolutions, saveStatus, solutions]);

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const existingSolutionsLanguage = normalizeLanguage(project?.existingSolutionsLanguage);

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; solutions: ExistingSolution[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Existing Solutions",
        subTitle: "Generating existing solutions with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/existing-solutions/generate", {
            method: "POST",
            signal,
          });
          const normalized = normalizeSolutions(res.existingSolutions || []);
          return { type: "suggestion", solutions: normalized };
        },
      });

      if (result?.solutions) {
        setSuggestion(result.solutions);
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
    if (solutions.length === 0) {
      setError("Add or generate existing solutions before asking AI to refine them.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { existingSolutions: solutionsRef.current, instructions: trimmedInstructions }
        : { existingSolutions: solutionsRef.current };

      const result = await startTask<{ type: string; solutions: ExistingSolution[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Existing Solutions",
        subTitle: "Refining existing solutions with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/existing-solutions/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const normalized = normalizeSolutions(res.existingSolutions || []);
          return { type: "suggestion", solutions: normalized };
        },
      });

      if (result?.solutions) {
        setSuggestion(result.solutions);
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
    if (solutions.length === 0) {
      setError("Add or generate existing solutions before asking AI to translate them.");
      return;
    }

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; solutions: ExistingSolution[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Existing Solutions",
        subTitle: `Translating existing solutions to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/existing-solutions/translate", {
            method: "POST",
            body: JSON.stringify({ existingSolutions: solutionsRef.current }),
            signal,
          });
          const translatedSolutions = normalizeSolutions(res.existingSolutions || []);

          if (project?._id) {
            const savePayload = projectLanguage
              ? { existingSolutions: translatedSolutions, language: projectLanguage }
              : { existingSolutions: translatedSolutions };
            await fetchApi(`/projects/${project._id}/existing-solutions`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
              signal,
            });
          }

          return { type: "saved", solutions: translatedSolutions };
        },
      });

      if (result?.solutions) {
        solutionsRef.current = result.solutions;
        setSolutions(result.solutions);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI existing solution translation failed. Please try again.");
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
      solutionsRef.current = suggestion;
      setSolutions(suggestion);
      setSuggestion(null);
      setLocalAiState("idle");
      dismissTask(TASK_ID);
      await saveSolutions(suggestion, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask, projectLanguage, saveSolutions, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    solutions,
    setSolutions,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveSolutions,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    existingSolutionsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
