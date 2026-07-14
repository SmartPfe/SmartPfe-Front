import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

export type BacklogPriority = "High" | "Medium" | "Low";

export type ProductBacklogItem = {
  _id?: string;
  localId?: string;
  code: string;
  epic: string;
  task: string;
  priority: BacklogPriority;
  durationDays: number;
  sprint: string;
  notes: string;
};

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const normalizePriority = (priority: string): BacklogPriority => {
  if (priority === "High" || priority === "Low") return priority;
  return "Medium";
};

const normalizeDuration = (durationDays: number | string) => {
  const value = Number(durationDays);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.round(value);
};

export const normalizeProductBacklog = (items: ProductBacklogItem[] = []): ProductBacklogItem[] =>
  items.map((item, index) => ({
    ...item,
    code: item.code || `PB-${String(index + 1).padStart(2, "0")}`,
    epic: item.epic || "Project",
    task: item.task || "",
    priority: normalizePriority(item.priority),
    durationDays: normalizeDuration(item.durationDays),
    sprint: item.sprint || "",
    notes: item.notes || "",
  }));

export const renumberProductBacklog = (items: ProductBacklogItem[]) =>
  items.map((item, index) => ({
    ...item,
    code: `PB-${String(index + 1).padStart(2, "0")}`,
  }));

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
        setProductBacklog(normalizeProductBacklog(data.productBacklog || []));
      } catch (err: any) {
        setError(err.message || "Failed to load product backlog. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductBacklog();
  }, []);

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
      (item) => !item.epic.trim() || !item.task.trim() || normalizeDuration(item.durationDays) < 1
    );
    if (hasIncompleteItem) {
      if (showValidation) setError("Please fill each task epic, task name, and duration before saving.");
      setSaveStatus("unsaved");
      return;
    }

    const normalized = renumberProductBacklog(normalizeProductBacklog(nextBacklog));
    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/product-backlog`, {
        method: "PUT",
        body: JSON.stringify({ productBacklog: normalized }),
      });
      if (JSON.stringify(renumberProductBacklog(backlogRef.current)) === JSON.stringify(normalized)) {
        setProductBacklog(normalizeProductBacklog(res.productBacklog || []));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product backlog. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [productBacklog, project?._id]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") return;

    const hasIncompleteItem = productBacklog.some(
      (item) => !item.epic.trim() || !item.task.trim() || normalizeDuration(item.durationDays) < 1
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
      setSuggestion(normalizeProductBacklog(res.productBacklog || []));
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
      setSuggestion(normalizeProductBacklog(res.productBacklog || []));
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
