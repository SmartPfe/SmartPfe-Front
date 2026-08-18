import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

export type BacklogPriority = "High" | "Medium" | "Low";

export type ProductBacklogItem = {
  _id?: string;
  localId?: string;
  code: string;
  epic: string;
  actors: string[];
  task: string;
  priority: BacklogPriority;
  durationDays: number;
  sprint: string;
  notes: string;
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

const normalizePriority = (priority: string): BacklogPriority => {
  if (priority === "High" || priority === "Must") return "High";
  if (priority === "Low" || priority === "Could" || priority === "Won't") return "Low";
  return "Medium";
};

const normalizeDuration = (durationDays: number | string) => {
  const value = Number(durationDays);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.round(value);
};

export const getPrimaryActorNames = (project: any): string[] =>
  (project?.actors || [])
    .filter((actor: any) => actor?.type !== "external" && String(actor?.name || "").trim())
    .map((actor: any) => String(actor.name).trim());

const normalizeItemActors = (item: any, primaryActorOptions: string[] = []): string[] => {
  const rawActors = Array.isArray(item?.actors)
    ? item.actors
    : item?.actor || item?.asA
      ? [item.actor || item.asA]
      : [];

  const selectedActors = rawActors
    .flatMap((actor: string) => String(actor || "").split(/[,;\n]/))
    .map((actor: string) => actor.trim())
    .filter(Boolean);

  if (primaryActorOptions.length === 0) {
    return selectedActors.length ? Array.from(new Set<string>(selectedActors)) : ["User"];
  }

  const matchedActors = selectedActors
    .map((actor: string) => primaryActorOptions.find((option) => option.toLowerCase() === actor.toLowerCase()))
    .filter(Boolean) as string[];

  return matchedActors.length ? Array.from(new Set<string>(matchedActors)) : [primaryActorOptions[0]];
};

export const normalizeProductBacklog = (items: ProductBacklogItem[] = [], primaryActorOptions: string[] = []): ProductBacklogItem[] =>
  items.map((item, index) => ({
    ...item,
    code: item.code || `1.${index + 1}`,
    epic: item.epic || "Project",
    actors: normalizeItemActors(item, primaryActorOptions),
    task: item.task || "",
    priority: normalizePriority(item.priority),
    durationDays: normalizeDuration(item.durationDays),
    sprint: item.sprint || `Sprint ${Math.floor(index / 4) + 1}`,
    notes: item.notes || "",
  }));

export const renumberProductBacklog = (items: ProductBacklogItem[]) => {
  const epicOrder = new Map<string, number>();
  const epicCounts = new Map<string, number>();

  return items.map((item) => {
    const epic = item.epic.trim() || "Project";
    if (!epicOrder.has(epic)) {
      epicOrder.set(epic, epicOrder.size + 1);
    }

    const nextCount = (epicCounts.get(epic) || 0) + 1;
    epicCounts.set(epic, nextCount);

    return {
      ...item,
      epic,
      code: `${epicOrder.get(epic)}.${nextCount}`,
    };
  });
};

const TASK_ID = "product-backlog:main";
const SCOPE = "product-backlog";
const PAGE_ROUTE = "/workspace/backlog";

export function useProductBacklog() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [productBacklog, setProductBacklog] = useState<ProductBacklogItem[]>([]);
  const [suggestion, setSuggestion] = useState<ProductBacklogItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const backlogRef = useRef<ProductBacklogItem[]>([]);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    backlogRef.current = productBacklog;
  }, [productBacklog]);

  const primaryActorOptions = getPrimaryActorNames(project);
  const targetDurationDays = Number(project?.basics?.targetDurationDays || project?.targetDurationDays) || 0;

  const fetchBacklogData = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);

      const data = await fetchApi(`/projects/${projectData._id}/product-backlog`);
      const options = getPrimaryActorNames(projectData);
      const normalized = normalizeProductBacklog(data.productBacklog || [], options);
      setProductBacklog(normalized);
      backlogRef.current = normalized;
      return { projectData, backlog: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load product backlog. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBacklogData();
  }, [fetchBacklogData]);

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
        if (task.result.type === "suggestion" && Array.isArray(task.result.productBacklog)) {
          setSuggestion(task.result.productBacklog);
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "saved" && Array.isArray(task.result.productBacklog)) {
          setProductBacklog(task.result.productBacklog);
          backlogRef.current = task.result.productBacklog;
          setLocalAiState("idle");
          fetchBacklogData();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchBacklogData, localAiState, tasks]);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveProductBacklog = useCallback(
    async (nextBacklog = productBacklog, showValidation = false, language?: string) => {
      if (!project?._id) {
        setError("Project is not ready yet. Please refresh the page.");
        return;
      }

      const hasIncompleteItem = nextBacklog.some(
        (item) => !item.epic.trim() || item.actors.length === 0 || !item.task.trim() || !item.sprint.trim() || normalizeDuration(item.durationDays) < 1
      );
      if (hasIncompleteItem) {
        if (showValidation) {
          setError("Please fill each task epic, actors, description, duration (>=1), and sprint before saving.");
        }
        setSaveStatus("unsaved");
        return;
      }

      const normalized = renumberProductBacklog(normalizeProductBacklog(nextBacklog, primaryActorOptions));
      setSaveStatus("saving");
      setError(null);

      try {
        const payload = language
          ? { productBacklog: normalized, language }
          : { productBacklog: normalized };
        const res = await fetchApi(`/projects/${project._id}/product-backlog`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (JSON.stringify(renumberProductBacklog(backlogRef.current)) === JSON.stringify(normalized)) {
          const resNormalized = normalizeProductBacklog(res.productBacklog || [], primaryActorOptions);
          setProductBacklog(resNormalized);
          backlogRef.current = resNormalized;
          setProject((current: any) =>
            current
              ? {
                  ...current,
                  productBacklogLanguage: res.language ?? current.productBacklogLanguage ?? "",
                }
              : current
          );
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save product backlog. Please try again.");
        setSaveStatus("unsaved");
      }
    },
    [primaryActorOptions, productBacklog, project?._id]
  );

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || isAiBusy) return;

    const hasIncompleteItem = productBacklog.some(
      (item) => !item.epic.trim() || item.actors.length === 0 || !item.task.trim() || !item.sprint.trim() || normalizeDuration(item.durationDays) < 1
    );
    if (hasIncompleteItem) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveProductBacklog(productBacklog), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [isAiBusy, productBacklog, project?._id, saveProductBacklog, saveStatus]);

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const productBacklogLanguage = normalizeLanguage(project?.productBacklogLanguage);

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; productBacklog: ProductBacklogItem[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Product Backlog",
        subTitle: "Generating product backlog tasks with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/product-backlog/generate", {
            method: "POST",
            signal,
          });
          const normalized = normalizeProductBacklog(res.productBacklog || [], primaryActorOptions);
          return { type: "suggestion", productBacklog: normalized };
        },
      });

      if (result?.productBacklog) {
        setSuggestion(result.productBacklog);
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
    if (productBacklog.length === 0) {
      setError("Add or generate product backlog tasks before asking AI to refine them.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { productBacklog: backlogRef.current, instructions: trimmedInstructions }
        : { productBacklog: backlogRef.current };

      const result = await startTask<{ type: string; productBacklog: ProductBacklogItem[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Product Backlog",
        subTitle: "Refining product backlog with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/product-backlog/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const normalized = normalizeProductBacklog(res.productBacklog || [], primaryActorOptions);
          return { type: "suggestion", productBacklog: normalized };
        },
      });

      if (result?.productBacklog) {
        setSuggestion(result.productBacklog);
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
    if (productBacklog.length === 0) {
      setError("Add or generate product backlog tasks before asking AI to translate them.");
      return;
    }

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; productBacklog: ProductBacklogItem[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Product Backlog",
        subTitle: `Translating product backlog to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/product-backlog/translate", {
            method: "POST",
            body: JSON.stringify({ productBacklog: backlogRef.current }),
            signal,
          });
          const translatedBacklog = renumberProductBacklog(
            normalizeProductBacklog(res.productBacklog || [], primaryActorOptions)
          );

          if (project?._id) {
            const savePayload = projectLanguage
              ? { productBacklog: translatedBacklog, language: projectLanguage }
              : { productBacklog: translatedBacklog };
            await fetchApi(`/projects/${project._id}/product-backlog`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
              signal,
            });
          }

          return { type: "saved", productBacklog: translatedBacklog };
        },
      });

      if (result?.productBacklog) {
        backlogRef.current = result.productBacklog;
        setProductBacklog(result.productBacklog);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI product backlog translation failed. Please try again.");
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
      const nextBacklog = renumberProductBacklog(suggestion);
      backlogRef.current = nextBacklog;
      setProductBacklog(nextBacklog);
      setSuggestion(null);
      setLocalAiState("idle");
      dismissTask(TASK_ID);
      await saveProductBacklog(nextBacklog, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask, projectLanguage, saveProductBacklog, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    productBacklog,
    setProductBacklog,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    primaryActorOptions,
    targetDurationDays,
    markUnsaved,
    saveProductBacklog,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    productBacklogLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
