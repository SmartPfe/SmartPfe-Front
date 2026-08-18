import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

export type ActorType = "primary" | "external";

export type Actor = {
  _id?: string;
  localId?: string;
  name: string;
  description: string;
  type: ActorType;
  icon: string;
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

export const normalizeActors = (actors: Actor[] = []): Actor[] =>
  actors.map((actor) => ({
    ...actor,
    name: actor.name || "",
    description: actor.description || "",
    type: actor.type === "external" ? "external" : "primary",
    icon: actor.icon || (actor.type === "external" ? "api" : "person"),
  }));

const TASK_ID = "actors:main";
const SCOPE = "actors";
const PAGE_ROUTE = "/workspace/actors";

export function useActors() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [actors, setActors] = useState<Actor[]>([]);
  const [suggestion, setSuggestion] = useState<Actor[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const actorsRef = useRef<Actor[]>([]);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    actorsRef.current = actors;
  }, [actors]);

  const fetchActorsData = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);

      const actorsData = await fetchApi(`/projects/${projectData._id}/actors`);
      const normalized = normalizeActors(actorsData.actors || []);
      setActors(normalized);
      actorsRef.current = normalized;
      return { projectData, actors: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load actors. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActorsData();
  }, [fetchActorsData]);

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
        if (task.result.type === "suggestion" && Array.isArray(task.result.actors)) {
          setSuggestion(task.result.actors);
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "saved" && Array.isArray(task.result.actors)) {
          setActors(task.result.actors);
          actorsRef.current = task.result.actors;
          setLocalAiState("idle");
          fetchActorsData();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchActorsData, localAiState, tasks]);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveActors = useCallback(
    async (nextActors = actors, showValidation = false, language?: string) => {
      if (!project?._id) {
        setError("Project is not ready yet. Please refresh the page.");
        return;
      }

      const hasIncompleteActor = nextActors.some(
        (actor) => !actor.name.trim() || !actor.description.trim()
      );
      if (hasIncompleteActor) {
        if (showValidation) {
          setError("Please fill each actor name and description before saving.");
        }
        setSaveStatus("unsaved");
        return;
      }

      setSaveStatus("saving");
      setError(null);

      try {
        const payload = language
          ? { actors: nextActors, language }
          : { actors: nextActors };
        const res = await fetchApi(`/projects/${project._id}/actors`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (JSON.stringify(actorsRef.current) === JSON.stringify(nextActors)) {
          const normalized = normalizeActors(res.actors || []);
          setActors(normalized);
          actorsRef.current = normalized;
          setProject((current: any) =>
            current
              ? {
                  ...current,
                  actorsLanguage: res.language ?? current.actorsLanguage ?? "",
                }
              : current
          );
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save actors. Please try again.");
        setSaveStatus("unsaved");
      }
    },
    [actors, project?._id]
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

    const hasIncompleteActor = actors.some(
      (actor) => !actor.name.trim() || !actor.description.trim()
    );
    if (hasIncompleteActor) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveActors(actors);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [actors, isAiBusy, project?._id, saveActors, saveStatus]);

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const actorsLanguage = normalizeLanguage(project?.actorsLanguage);

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; actors: Actor[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Actors & Stakeholders",
        subTitle: "Generating actors with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/actors/generate", {
            method: "POST",
            signal,
          });
          const normalized = normalizeActors(res.actors || []);
          return { type: "suggestion", actors: normalized };
        },
      });

      if (result?.actors) {
        setSuggestion(result.actors);
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
    if (actors.length === 0) {
      setError("Add or generate actors before asking AI to refine them.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { actors: actorsRef.current, instructions: trimmedInstructions }
        : { actors: actorsRef.current };

      const result = await startTask<{ type: string; actors: Actor[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Actors & Stakeholders",
        subTitle: "Refining actors with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/actors/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const normalized = normalizeActors(res.actors || []);
          return { type: "suggestion", actors: normalized };
        },
      });

      if (result?.actors) {
        setSuggestion(result.actors);
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
    if (actors.length === 0) {
      setError("Add or generate actors before asking AI to translate them.");
      return;
    }

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; actors: Actor[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Actors & Stakeholders",
        subTitle: `Translating actors to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/actors/translate", {
            method: "POST",
            body: JSON.stringify({ actors: actorsRef.current }),
            signal,
          });
          const translatedActors = normalizeActors(res.actors || []);

          if (project?._id) {
            const savePayload = projectLanguage
              ? { actors: translatedActors, language: projectLanguage }
              : { actors: translatedActors };
            await fetchApi(`/projects/${project._id}/actors`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
              signal,
            });
          }

          return { type: "saved", actors: translatedActors };
        },
      });

      if (result?.actors) {
        actorsRef.current = result.actors;
        setActors(result.actors);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI actor translation failed. Please try again.");
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
      actorsRef.current = suggestion;
      setActors(suggestion);
      await saveActors(suggestion, false, projectLanguage || undefined);
    }
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask, projectLanguage, saveActors, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    actors,
    setActors,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveActors,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    actorsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
