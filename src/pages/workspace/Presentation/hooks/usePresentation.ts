import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

export type PresentationDuration = 5 | 10 | 15 | 20;
export type AiState = "idle" | "generating" | "refining" | "translating";
export type SaveStatus = "unsaved" | "saving" | "saved";

export type PresentationSlide = {
  id: string;
  title: string;
  bullets: string[];
  notes: string;
  language?: string;
};

export type PresentationDeck = {
  durationMinutes: PresentationDuration;
  slides: PresentationSlide[];
  sourceFingerprint?: string;
  version?: number;
  updatedAt?: string;
};

const durations: PresentationDuration[] = [5, 10, 15, 20];

const createSlideId = () => `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

const normalizeDuration = (value: unknown): PresentationDuration => {
  const duration = Number(value) as PresentationDuration;
  return durations.includes(duration) ? duration : 10;
};

const normalizeBullets = (items: unknown): string[] => {
  if (Array.isArray(items)) {
    return items.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(items || "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
};

export const normalizePresentation = (presentation: Partial<PresentationDeck> = {}): PresentationDeck => ({
  durationMinutes: normalizeDuration(presentation.durationMinutes),
  slides: Array.isArray(presentation.slides)
    ? presentation.slides.map((slide, index) => ({
      id: String(slide.id || createSlideId()),
      title: String(slide.title || `Slide ${index + 1}`).trim(),
      bullets: normalizeBullets(slide.bullets),
      notes: String(slide.notes || "").trim(),
      language: normalizeLanguage(slide.language),
    }))
    : [],
  sourceFingerprint: presentation.sourceFingerprint,
  version: Number(presentation.version) || (Array.isArray(presentation.slides) && presentation.slides.length ? 1 : 0),
  updatedAt: presentation.updatedAt,
});

export const createEmptySlide = (index: number): PresentationSlide => ({
  id: createSlideId(),
  title: `New Slide ${index + 1}`,
  bullets: ["New key point"],
  notes: "",
});

const TASK_ID = "presentation:main";
const SCOPE = "presentation";
const PAGE_ROUTE = "/workspace/presentation";

export function usePresentation() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const location = useLocation();
  const { data: onboardingData } = useOnboarding();
  const [project, setProject] = useState<any>(null);
  const [currentProjectLanguage, setCurrentProjectLanguage] = useState("");
  const [presentation, setPresentation] = useState<PresentationDeck>(normalizePresentation());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const presentationRef = useRef<PresentationDeck>(presentation);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    presentationRef.current = presentation;
  }, [presentation]);

  const hasOnboardingProjectData = Boolean(onboardingData.basics.title.trim() || onboardingData.basics.domain.trim());
  const onboardingLanguage = hasOnboardingProjectData ? normalizeLanguage(onboardingData.basics.language) : "";
  const projectLanguage = onboardingLanguage || currentProjectLanguage || normalizeLanguage(project?.basics?.language || project?.language);

  const fetchPresentation = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);
      setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));

      const data = await fetchApi(`/projects/${projectData._id}/presentation`);
      const normalized = normalizePresentation(data.presentation || {});
      setPresentation(normalized);
      presentationRef.current = normalized;
      return { projectData, presentation: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load presentation. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresentation();
  }, [fetchPresentation]);

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
        if (task.result.type === "saved" && task.result.presentation) {
          setPresentation(task.result.presentation);
          presentationRef.current = task.result.presentation;
          setLocalAiState("idle");
          fetchPresentation();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchPresentation, localAiState, tasks]);

  useEffect(() => {
    const refreshProjectLanguage = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject((current: any) => current ? { ...current, basics: projectData.basics || current.basics } : projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));
      } catch {
        // Keep the loaded project language if the background refresh fails.
      }
    };

    window.addEventListener("focus", refreshProjectLanguage);
    return () => window.removeEventListener("focus", refreshProjectLanguage);
  }, []);

  useEffect(() => {
    const refreshProjectLanguage = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject((current: any) => current ? { ...current, basics: projectData.basics || current.basics } : projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));
      } catch {
        // Keep the loaded project language if a route refresh fails.
      }
    };

    refreshProjectLanguage();
  }, [location.key]);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const savePresentation = useCallback(async (nextPresentation = presentation, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = normalizePresentation(nextPresentation);
    if (showValidation && normalized.slides.length === 0) {
      setError("Generate or add at least one slide before saving.");
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/presentation`, {
        method: "PUT",
        body: JSON.stringify({ presentation: normalized }),
      });

      if (JSON.stringify(normalizePresentation(presentationRef.current)) === JSON.stringify(normalized)) {
        setPresentation(normalizePresentation(res.presentation || {}));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save presentation. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [presentation, project?._id]);

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || isAiBusy) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => savePresentation(presentation), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [isAiBusy, presentation, project?._id, savePresentation, saveStatus]);

  const updatePresentation = useCallback((updater: (current: PresentationDeck) => PresentationDeck) => {
    setPresentation((current) => normalizePresentation(updater(current)));
    markUnsaved();
  }, [markUnsaved]);

  const generateWithAi = async (durationMinutes: PresentationDuration) => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; presentation: PresentationDeck }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Presentation & Defense",
        subTitle: `Generating ${durationMinutes}-minute presentation slides with AI...`,
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/presentation/generate", {
            method: "POST",
            body: JSON.stringify({ durationMinutes }),
            signal,
          });
          const nextPresentation = normalizePresentation(res.presentation || {});

          if (project?._id) {
            await fetchApi(`/projects/${project._id}/presentation`, {
              method: "PUT",
              body: JSON.stringify({ presentation: nextPresentation }),
              signal,
            });
          }

          return { type: "saved", presentation: nextPresentation };
        },
      });

      if (result?.presentation) {
        presentationRef.current = result.presentation;
        setPresentation(result.presentation);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI presentation generation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const refineWithAi = async (slideId = "", instructions = "") => {
    if (presentation.slides.length === 0) {
      setError("Generate or add slides before asking AI to refine them.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = {
        presentation: presentationRef.current,
        ...(slideId ? { slideId } : {}),
        ...(trimmedInstructions ? { instructions: trimmedInstructions } : {}),
      };

      const result = await startTask<{ type: string; presentation: PresentationDeck }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Presentation & Defense",
        subTitle: slideId ? "Refining selected slide with AI..." : "Refining presentation slides with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/presentation/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const targetLanguage = projectLanguage;
          const nextPresentation = normalizePresentation(res.presentation || {});
          const refinedPresentation = slideId && targetLanguage
            ? normalizePresentation({
              ...nextPresentation,
              slides: nextPresentation.slides.map((slide) => slide.id === slideId ? { ...slide, language: targetLanguage } : slide),
            })
            : nextPresentation;

          if (project?._id) {
            await fetchApi(`/projects/${project._id}/presentation`, {
              method: "PUT",
              body: JSON.stringify({ presentation: refinedPresentation }),
              signal,
            });
          }

          return { type: "saved", presentation: refinedPresentation };
        },
      });

      if (result?.presentation) {
        presentationRef.current = result.presentation;
        setPresentation(result.presentation);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI presentation refinement failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const translateWithAi = async (slideId: string) => {
    if (!slideId) return;

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; presentation: PresentationDeck }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Presentation & Defense",
        subTitle: `Translating slide to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/presentation/translate", {
            method: "POST",
            body: JSON.stringify({ presentation: presentationRef.current, slideId }),
            signal,
          });
          const targetLanguage = projectLanguage;
          const nextPresentation = normalizePresentation(res.presentation || {});
          const translatedPresentation = targetLanguage
            ? normalizePresentation({
              ...nextPresentation,
              slides: nextPresentation.slides.map((slide) => slide.id === slideId ? { ...slide, language: targetLanguage } : slide),
            })
            : nextPresentation;

          if (project?._id) {
            await fetchApi(`/projects/${project._id}/presentation`, {
              method: "PUT",
              body: JSON.stringify({ presentation: translatedPresentation }),
              signal,
            });
          }

          return { type: "saved", presentation: translatedPresentation };
        },
      });

      if (result?.presentation) {
        presentationRef.current = result.presentation;
        setPresentation(result.presentation);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI presentation translation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const cancelAi = useCallback(() => {
    cancelTask(TASK_ID);
    setLocalAiState("idle");
  }, [cancelTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    projectLanguage,
    presentation,
    setPresentation,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    error,
    markUnsaved,
    updatePresentation,
    savePresentation,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    dismissError,
  };
}
