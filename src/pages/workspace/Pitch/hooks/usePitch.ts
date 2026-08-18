import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";
import { PresentationDuration } from "../../Presentation/hooks/usePresentation";

export type SaveStatus = "unsaved" | "saving" | "saved";
export type AiState = "idle" | "generating" | "refining" | "translating";

export type PitchSlide = {
  slideId: string;
  title: string;
  estimatedSeconds: number;
  speech: string;
  tips: string[];
  language?: string;
};

export type PitchDeck = {
  durationMinutes: PresentationDuration;
  slides: PitchSlide[];
  sourceFingerprint?: string;
  version?: number;
  updatedAt?: string;
};

const durations: PresentationDuration[] = [5, 10, 15, 20];
const WORDS_PER_MINUTE = 130;

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

export const estimateSpeechSeconds = (speech = "", fallbackSeconds = 60) => {
  const words = speech.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return Math.max(15, Math.round(fallbackSeconds));
  return Math.max(15, Math.round((words / WORDS_PER_MINUTE) * 60));
};

export const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (minutes === 0) return `${remainingSeconds} sec`;
  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} sec`;
};

const normalizeTips = (tips: unknown): string[] => {
  if (Array.isArray(tips)) {
    return tips.map((tip) => String(tip || "").trim()).filter(Boolean);
  }

  return String(tips || "")
    .split(/\r?\n/)
    .map((tip) => tip.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
};

export const normalizePitch = (pitch: Partial<PitchDeck> = {}): PitchDeck => ({
  durationMinutes: normalizeDuration(pitch.durationMinutes),
  slides: Array.isArray(pitch.slides)
    ? pitch.slides.map((slide, index) => {
      const speech = String(slide.speech || "").trim();
      const fallbackSeconds = Number(slide.estimatedSeconds) || 60;
      return {
        slideId: String(slide.slideId || `slide-${index + 1}`).trim(),
        title: String(slide.title || `Slide ${index + 1}`).trim(),
        estimatedSeconds: estimateSpeechSeconds(speech, fallbackSeconds),
        speech,
        tips: normalizeTips(slide.tips),
        language: normalizeLanguage(slide.language),
      };
    }).filter((slide) => slide.slideId && slide.title)
    : [],
  sourceFingerprint: pitch.sourceFingerprint,
  version: Number(pitch.version) || (Array.isArray(pitch.slides) && pitch.slides.length ? 1 : 0),
  updatedAt: pitch.updatedAt,
});

const hasPitchSpeech = (pitch: Partial<PitchDeck> = {}) =>
  Array.isArray(pitch.slides) && pitch.slides.some((slide) => String(slide?.speech || "").trim());

const TASK_ID = "pitch:main";
const SCOPE = "pitch";
const PAGE_ROUTE = "/workspace/pitch";

export function usePitch() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const location = useLocation();
  const [project, setProject] = useState<any>(null);
  const [currentProjectLanguage, setCurrentProjectLanguage] = useState("");
  const [pitch, setPitch] = useState<PitchDeck>(normalizePitch());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const pitchRef = useRef<PitchDeck>(pitch);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  const fetchPitch = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);
      setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));

      const data = await fetchApi(`/projects/${projectData._id}/pitch`);
      const normalized = normalizePitch(data.pitch || {});
      setPitch(normalized);
      pitchRef.current = normalized;
      return { projectData, pitch: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load pitch. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPitch();
  }, [fetchPitch]);

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
        if (task.result.type === "saved" && task.result.pitch) {
          setPitch(task.result.pitch);
          pitchRef.current = task.result.pitch;
          setLocalAiState("idle");
          fetchPitch();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchPitch, localAiState, tasks]);

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

  const savePitch = useCallback(async (nextPitch = pitch, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = normalizePitch(nextPitch);
    if (!hasPitchSpeech(normalized) && hasPitchSpeech(pitchRef.current)) {
      setSaveStatus("saved");
      return;
    }

    if (showValidation && normalized.slides.length === 0) {
      setError("Generate your presentation before saving a pitch.");
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/pitch`, {
        method: "PUT",
        body: JSON.stringify({ pitch: normalized }),
      });

      if (JSON.stringify(normalizePitch(pitchRef.current)) === JSON.stringify(normalized)) {
        setPitch(normalizePitch(res.pitch || {}));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save pitch. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [pitch, project?._id]);

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || isAiBusy) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => savePitch(pitch), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, isAiBusy, pitch, project?._id, savePitch, saveStatus]);

  const updatePitch = useCallback((updater: (current: PitchDeck) => PitchDeck) => {
    setPitch((current) => normalizePitch(updater(current)));
    markUnsaved();
  }, [markUnsaved]);

  const replaceWithAiPitch = useCallback(async (
    endpoint: string,
    body?: Record<string, unknown>,
    nextAiState: Exclude<AiState, "idle"> = "generating",
    taskSubTitle = "Generating defense pitch with AI...",
    errorMessage = "AI pitch generation failed. Please try again."
  ) => {
    setLocalAiState(nextAiState);
    setError(null);

    try {
      const result = await startTask<{ type: string; pitch: PitchDeck }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Pitch & Defense Speech",
        subTitle: taskSubTitle,
        pageRoute: PAGE_ROUTE,
        status: nextAiState,
        runner: async (signal) => {
          const res = await fetchApi(endpoint, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
            signal,
          });
          const nextPitch = normalizePitch(res.pitch || {});

          if (project?._id) {
            await fetchApi(`/projects/${project._id}/pitch`, {
              method: "PUT",
              body: JSON.stringify({ pitch: nextPitch }),
              signal,
            });
          }

          return { type: "saved", pitch: nextPitch };
        },
      });

      if (result?.pitch) {
        pitchRef.current = result.pitch;
        setPitch(result.pitch);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || errorMessage);
      }
      setLocalAiState("idle");
    }
  }, [project?._id, startTask]);

  const generateWithAi = async () => {
    await replaceWithAiPitch(
      "/ai/pitch/generate",
      undefined,
      "generating",
      "Generating complete defense speech with AI..."
    );
  };

  const refineWithAi = async (instructions = "") => {
    if (pitch.slides.every((slide) => !slide.speech.trim())) {
      setError("Generate the pitch before asking AI to refine it.");
      return;
    }

    const trimmedInstructions = instructions.trim();
    await replaceWithAiPitch(
      "/ai/pitch/refine",
      { pitch: pitchRef.current, ...(trimmedInstructions ? { instructions: trimmedInstructions } : {}) },
      "refining",
      "Refining complete defense pitch with AI...",
      "AI pitch refinement failed. Please try again."
    );
  };

  const generateSlideWithAi = async (slideId: string) => {
    await replaceWithAiPitch(
      "/ai/pitch/slide/generate",
      { pitch: pitchRef.current, slideId },
      "generating",
      "Generating speech for selected slide..."
    );
  };

  const refineSlideWithAi = async (slideId: string, instructions = "") => {
    const slide = pitch.slides.find((item) => item.slideId === slideId);
    if (!slide?.speech.trim()) {
      setError("Generate speech for this slide before asking AI to refine it.");
      return;
    }

    const trimmedInstructions = instructions.trim();
    await replaceWithAiPitch(
      "/ai/pitch/slide/refine",
      { pitch: pitchRef.current, slideId, ...(trimmedInstructions ? { instructions: trimmedInstructions } : {}) },
      "refining",
      "Refining selected slide speech with AI...",
      "AI slide speech refinement failed. Please try again."
    );
  };

  const translateSlideWithAi = async (slideId: string) => {
    await replaceWithAiPitch(
      "/ai/pitch/slide/translate",
      { pitch: pitchRef.current, slideId },
      "translating",
      `Translating slide speech to ${getLanguageLabel(projectLanguage)}...`,
      "AI slide speech translation failed. Please try again."
    );
  };

  const cancelAi = useCallback(() => {
    cancelTask(TASK_ID);
    setLocalAiState("idle");
  }, [cancelTask]);

  const dismissError = useCallback(() => setError(null), []);
  const projectLanguage = currentProjectLanguage || normalizeLanguage(project?.basics?.language || project?.language);

  return {
    project,
    projectLanguage,
    pitch,
    setPitch,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    error,
    markUnsaved,
    updatePitch,
    savePitch,
    generateWithAi,
    refineWithAi,
    generateSlideWithAi,
    refineSlideWithAi,
    translateSlideWithAi,
    cancelAi,
    dismissError,
  };
}
