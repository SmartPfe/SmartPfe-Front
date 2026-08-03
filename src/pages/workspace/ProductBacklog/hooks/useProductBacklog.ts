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

  const saveProductBacklog = useCallback(async (nextBacklog = productBacklog, showValidation = false, language?: string) => {
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
      const payload = language
        ? { productBacklog: normalized, language }
        : { productBacklog: normalized };
      const res = await fetchApi(`/projects/${project._id}/product-backlog`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(renumberProductBacklog(backlogRef.current)) === JSON.stringify(normalized)) {
        setProductBacklog(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
        setProject((current: any) => current ? {
          ...current,
          productBacklogLanguage: res.language ?? current.productBacklogLanguage ?? "",
        } : current);
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
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") return;

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

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const productBacklogLanguage = normalizeLanguage(project?.productBacklogLanguage);

  const refineWithAi = async (instructions = "") => {
    if (productBacklog.length === 0) {
      setError("Add or generate product backlog tasks before asking AI to refine them.");
      return;
    }

    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { productBacklog, instructions: trimmedInstructions }
        : { productBacklog };
      const res = await fetchApi("/ai/product-backlog/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (productBacklog.length === 0) {
      setError("Add or generate product backlog tasks before asking AI to translate them.");
      return;
    }

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/product-backlog/translate", {
        method: "POST",
        body: JSON.stringify({ productBacklog }),
      });
      const translatedBacklog = renumberProductBacklog(normalizeProductBacklog(res.productBacklog || [], primaryActorOptions));
      backlogRef.current = translatedBacklog;
      setProductBacklog(translatedBacklog);
      await saveProductBacklog(translatedBacklog, false, projectLanguage || undefined);
      setAiState("idle");
    } catch (err: any) {
      setError(err.message || "AI product backlog translation failed. Please try again.");
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
      await saveProductBacklog(nextBacklog, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [projectLanguage, saveProductBacklog, suggestion]);

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
    translateWithAi,
    projectLanguage,
    productBacklogLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
