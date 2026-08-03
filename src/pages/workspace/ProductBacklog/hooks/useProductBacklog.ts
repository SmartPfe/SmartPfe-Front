import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

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

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

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

export function useProductBacklog() {
  const [project, setProject] = useState<any>(null);
  const [productBacklog, setProductBacklog] = useState<ProductBacklogItem[]>([]);
  const [suggestion, setSuggestion] = useState<ProductBacklogItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const backlogRef = useRef<ProductBacklogItem[]>([]);

  useEffect(() => {
    backlogRef.current = productBacklog;
  }, [productBacklog]);

  useEffect(() => {
    const fetchProductBacklog = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);
        const data = await fetchApi(`/projects/${projectData._id}/product-backlog`);
        setProductBacklog(normalizeProductBacklog(data.productBacklog || [], getPrimaryActorNames(projectData)));
      } catch (err: any) {
        setError(err.message || "Failed to load product backlog. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductBacklog();
  }, []);

  const primaryActorOptions = useMemo(() => getPrimaryActorNames(project), [project]);

  const targetDurationDays = useMemo(() => {
    const months = Number(project?.technicalContext?.duration) || 0;
    return months > 0 ? months * 22 : 0;
  }, [project?.technicalContext?.duration]);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveProductBacklog = useCallback(async (nextBacklog = productBacklog, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const hasIncompleteItem = nextBacklog.some(
      (item) => !item.epic.trim() || item.actors.length === 0 || !item.task.trim() || !item.sprint.trim() || normalizeDuration(item.durationDays) < 1
    );
    if (hasIncompleteItem) {
      if (showValidation) setError("Please fill each epic, primary actor, user story, sprint, and duration before saving.");
      setSaveStatus("unsaved");
      return;
    }

    const normalized = renumberProductBacklog(normalizeProductBacklog(nextBacklog, primaryActorOptions));
    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/product-backlog`, {
        method: "PUT",
        body: JSON.stringify({ productBacklog: normalized }),
      });
      if (JSON.stringify(renumberProductBacklog(backlogRef.current)) === JSON.stringify(normalized)) {
        setProductBacklog(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product backlog. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [primaryActorOptions, productBacklog, project?._id]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") return;

    const hasIncompleteItem = productBacklog.some(
      (item) => !item.epic.trim() || item.actors.length === 0 || !item.task.trim() || !item.sprint.trim() || normalizeDuration(item.durationDays) < 1
    );
    if (hasIncompleteItem) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveProductBacklog(productBacklog), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, productBacklog, project?._id, saveProductBacklog, saveStatus]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/product-backlog/generate", { method: "POST" });
      setSuggestion(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (productBacklog.length === 0) {
      setError("Add or generate product backlog tasks before asking AI to refine them.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/product-backlog/refine", {
        method: "POST",
        body: JSON.stringify({ productBacklog }),
      });
      setSuggestion(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      const nextBacklog = renumberProductBacklog(suggestion);
      backlogRef.current = nextBacklog;
      setProductBacklog(nextBacklog);
      setSuggestion(null);
      setAiState("idle");
      await saveProductBacklog(nextBacklog);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [saveProductBacklog, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    productBacklog,
    setProductBacklog,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    primaryActorOptions,
    targetDurationDays,
    markUnsaved,
    saveProductBacklog,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
