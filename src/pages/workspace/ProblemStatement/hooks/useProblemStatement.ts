import { useState, useEffect, useCallback, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

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

const TASK_ID = "problem-statement:main";
const SCOPE = "problem-statement";
const PAGE_ROUTE = "/workspace/problem-statement";

export function useProblemStatement() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [snapshotHtml, setSnapshotHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const handledTaskIdRef = useRef<string | null>(null);

  // Load project on mount
  const fetchProject = useCallback(async () => {
    try {
      const data = await fetchApi("/projects/my-project");
      setProject(data);
      return data;
    } catch (err: any) {
      setError("Failed to load your project. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Sync background task state & hydrate completed refinement results
  useEffect(() => {
    const task = tasks[TASK_ID];
    if (!task) {
      // If task is not active in tasks (e.g. stopped/cancelled), reset local state to idle immediately
      if (localAiState === "generating" || localAiState === "refining" || localAiState === "translating") {
        setLocalAiState("idle");
      }
      return;
    }

    if (task.status === "completed" && task.result) {
      const taskNonce = `${task.id}-${task.completedAt}`;
      if (handledTaskIdRef.current !== taskNonce) {
        handledTaskIdRef.current = taskNonce;
        if (task.result.type === "refine" && task.result.suggestion) {
          setSuggestion(task.result.suggestion);
          if (task.result.snapshotHtml) {
            setSnapshotHtml(task.result.snapshotHtml);
          }
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "generate" || task.result.type === "translate") {
          // Re-fetch project to load latest auto-saved content
          fetchProject();
          setLocalAiState("idle");
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchProject, localAiState, tasks]);

  // Save — auth token identifies user
  const saveContent = useCallback(async (content: string, language?: string) => {
    setSaveStatus("saving");
    setError(null);
    try {
      const payload = language
        ? { problemStatement: content, language }
        : { problemStatement: content };
      const res = await fetchApi("/projects/problem-statement", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setProject((current: any) =>
        current
          ? {
              ...current,
              description: {
                ...current.description,
                problemStatement: res.problemStatement ?? content,
                problemStatementLanguage: res.language ?? current.description?.problemStatementLanguage ?? "",
              },
            }
          : current
      );
      setSaveStatus("saved");
      return res;
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
      setSaveStatus("unsaved");
      throw err;
    }
  }, []);

  const markUnsaved = useCallback(() => {
    setSaveStatus((prev) => (prev === "saving" ? prev : "unsaved"));
  }, []);

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const problemStatementLanguage = normalizeLanguage(
    project?.description?.problemStatementLanguage || project?.description?.generatedContent?.language
  );

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; text: string }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Problem Statement",
        subTitle: "Generating problem statement with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/problem-statement/generate", {
            method: "POST",
            signal,
          });

          // Auto-persist directly to backend
          const savePayload = projectLanguage
            ? { problemStatement: res.suggestion, language: projectLanguage }
            : { problemStatement: res.suggestion };

          await fetchApi("/projects/problem-statement", {
            method: "PATCH",
            body: JSON.stringify(savePayload),
            signal,
          });

          return { type: "generate", text: res.suggestion };
        },
      });

      if (result?.text) {
        setProject((current: any) =>
          current
            ? {
                ...current,
                description: {
                  ...current.description,
                  problemStatement: result.text,
                  problemStatementLanguage: projectLanguage || current.description?.problemStatementLanguage || "",
                },
              }
            : current
        );
        setSaveStatus("saved");
        setLocalAiState("idle");
        return result.text;
      }
      setLocalAiState("idle");
      return null;
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI generation failed. Please try again.");
      }
      setLocalAiState("idle");
      return null;
    }
  };

  const refineWithAi = async (plainText: string, instructions = "") => {
    if (!plainText.trim()) {
      setError("The editor is empty. Write something before asking AI to refine it.");
      return;
    }
    setLocalAiState("refining");
    setError(null);
    setSnapshotHtml(plainText);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { current: plainText, instructions: trimmedInstructions }
        : { current: plainText };

      const result = await startTask<{ type: string; suggestion: string; snapshotHtml: string }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Problem Statement",
        subTitle: "Refining problem statement with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/problem-statement/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          return { type: "refine", suggestion: res.suggestion, snapshotHtml: plainText };
        },
      });

      if (result?.suggestion) {
        setSuggestion(result.suggestion);
        setSnapshotHtml(result.snapshotHtml || plainText);
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

  const translateWithAi = async (currentContent: string) => {
    if (!currentContent.trim()) {
      setError("The editor is empty. Write something before asking AI to translate it.");
      return null;
    }
    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; text: string }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Problem Statement",
        subTitle: `Translating problem statement to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/problem-statement/translate", {
            method: "POST",
            body: JSON.stringify({ current: currentContent }),
            signal,
          });

          // Auto-persist directly to backend
          const savePayload = projectLanguage
            ? { problemStatement: res.suggestion, language: projectLanguage }
            : { problemStatement: res.suggestion };

          await fetchApi("/projects/problem-statement", {
            method: "PATCH",
            body: JSON.stringify(savePayload),
            signal,
          });

          return { type: "translate", text: res.suggestion };
        },
      });

      if (result?.text) {
        setProject((current: any) =>
          current
            ? {
                ...current,
                description: {
                  ...current.description,
                  problemStatement: result.text,
                  problemStatementLanguage: projectLanguage || current.description?.problemStatementLanguage || "",
                },
              }
            : current
        );
        setSaveStatus("saved");
        setLocalAiState("idle");
        return result.text;
      }
      setLocalAiState("idle");
      return null;
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI translation failed. Please try again.");
      }
      setLocalAiState("idle");
      return null;
    }
  };

  const cancelAi = useCallback(() => {
    cancelTask(TASK_ID);
    setLocalAiState("idle");
  }, [cancelTask]);

  const acceptSuggestion = useCallback(() => {
    setLocalAiState("idle");
    setSuggestion(null);
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const discardSuggestion = useCallback(() => {
    setLocalAiState("idle");
    setSuggestion(null);
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    snapshotHtml,
    error,
    saveContent,
    markUnsaved,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    problemStatementLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
