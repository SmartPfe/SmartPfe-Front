import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PresentationDuration } from "../../Presentation/hooks/usePresentation";

export type SaveStatus = "unsaved" | "saving" | "saved";
export type AiState = "idle" | "generating";

export type PitchSlide = {
  slideId: string;
  title: string;
  estimatedSeconds: number;
  speech: string;
  tips: string[];
};

export type PitchDeck = {
  durationMinutes: PresentationDuration;
  slides: PitchSlide[];
  sourceFingerprint?: string;
  updatedAt?: string;
};

const durations: PresentationDuration[] = [5, 10, 15, 20];
const WORDS_PER_MINUTE = 130;

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
    .map((tip) => tip.replace(/^\s*[-*\u2022]\s*/, "").trim())
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
      };
    }).filter((slide) => slide.slideId && slide.title)
    : [],
  sourceFingerprint: pitch.sourceFingerprint,
  updatedAt: pitch.updatedAt,
});

export function usePitch() {
  const [project, setProject] = useState<any>(null);
  const [pitch, setPitch] = useState<PitchDeck>(normalizePitch());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const pitchRef = useRef<PitchDeck>(pitch);

  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  useEffect(() => {
    const fetchPitch = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const data = await fetchApi(`/projects/${projectData._id}/pitch`);
        setPitch(normalizePitch(data.pitch || {}));
      } catch (err: any) {
        setError(err.message || "Failed to load pitch. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchPitch();
  }, []);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const savePitch = useCallback(async (nextPitch = pitch, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = normalizePitch(nextPitch);
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

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => savePitch(pitch), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, pitch, project?._id, savePitch, saveStatus]);

  const updatePitch = useCallback((updater: (current: PitchDeck) => PitchDeck) => {
    setPitch((current) => normalizePitch(updater(current)));
    markUnsaved();
  }, [markUnsaved]);

  const replaceWithAiPitch = useCallback(async (endpoint: string, body?: Record<string, unknown>) => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi(endpoint, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      const nextPitch = normalizePitch(res.pitch || {});
      pitchRef.current = nextPitch;
      setPitch(nextPitch);
      setSaveStatus("unsaved");
      await savePitch(nextPitch);
    } catch (err: any) {
      setError(err.message || "AI pitch generation failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  }, [savePitch]);

  const generateWithAi = async () => {
    await replaceWithAiPitch("/ai/pitch/generate");
  };

  const refineWithAi = async () => {
    if (pitch.slides.every((slide) => !slide.speech.trim())) {
      setError("Generate the pitch before asking AI to refine it.");
      return;
    }

    await replaceWithAiPitch("/ai/pitch/refine", { pitch });
  };

  const generateSlideWithAi = async (slideId: string) => {
    await replaceWithAiPitch("/ai/pitch/slide/generate", { pitch, slideId });
  };

  const refineSlideWithAi = async (slideId: string) => {
    const slide = pitch.slides.find((item) => item.slideId === slideId);
    if (!slide?.speech.trim()) {
      setError("Generate speech for this slide before asking AI to refine it.");
      return;
    }

    await replaceWithAiPitch("/ai/pitch/slide/refine", { pitch, slideId });
  };

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    pitch,
    setPitch,
    loading,
    saveStatus,
    aiState,
    error,
    markUnsaved,
    updatePitch,
    savePitch,
    generateWithAi,
    refineWithAi,
    generateSlideWithAi,
    refineSlideWithAi,
    dismissError,
  };
}
