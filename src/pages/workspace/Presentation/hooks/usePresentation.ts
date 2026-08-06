import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchApi } from "@/lib/api";

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
  updatedAt: presentation.updatedAt,
});

export const createEmptySlide = (index: number): PresentationSlide => ({
  id: createSlideId(),
  title: `New Slide ${index + 1}`,
  bullets: ["New key point"],
  notes: "",
});

export function usePresentation() {
  const location = useLocation();
  const { data: onboardingData } = useOnboarding();
  const [project, setProject] = useState<any>(null);
  const [currentProjectLanguage, setCurrentProjectLanguage] = useState("");
  const [presentation, setPresentation] = useState<PresentationDeck>(normalizePresentation());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const presentationRef = useRef<PresentationDeck>(presentation);

  useEffect(() => {
    presentationRef.current = presentation;
  }, [presentation]);

  const hasOnboardingProjectData = Boolean(onboardingData.basics.title.trim() || onboardingData.basics.domain.trim());
  const onboardingLanguage = hasOnboardingProjectData ? normalizeLanguage(onboardingData.basics.language) : "";
  const projectLanguage = onboardingLanguage || currentProjectLanguage || normalizeLanguage(project?.basics?.language || project?.language);

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));

        const data = await fetchApi(`/projects/${projectData._id}/presentation`);
        setPresentation(normalizePresentation(data.presentation || {}));
      } catch (err: any) {
        setError(err.message || "Failed to load presentation. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresentation();
  }, []);

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

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => savePresentation(presentation), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, presentation, project?._id, savePresentation, saveStatus]);

  const updatePresentation = useCallback((updater: (current: PresentationDeck) => PresentationDeck) => {
    setPresentation((current) => normalizePresentation(updater(current)));
    markUnsaved();
  }, [markUnsaved]);

  const generateWithAi = async (durationMinutes: PresentationDuration) => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/presentation/generate", {
        method: "POST",
        body: JSON.stringify({ durationMinutes }),
      });
      const nextPresentation = normalizePresentation(res.presentation || {});
      presentationRef.current = nextPresentation;
      setPresentation(nextPresentation);
      setSaveStatus("unsaved");
      await savePresentation(nextPresentation);
    } catch (err: any) {
      setError(err.message || "AI presentation generation failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const refineWithAi = async (slideId = "", instructions = "") => {
    if (presentation.slides.length === 0) {
      setError("Generate or add slides before asking AI to refine them.");
      return;
    }

    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const res = await fetchApi("/ai/presentation/refine", {
        method: "POST",
        body: JSON.stringify({
          presentation,
          ...(slideId ? { slideId } : {}),
          ...(trimmedInstructions ? { instructions: trimmedInstructions } : {}),
        }),
      });
      const targetLanguage = projectLanguage;
      const nextPresentation = normalizePresentation(res.presentation || {});
      const refinedPresentation = slideId && targetLanguage
        ? normalizePresentation({
          ...nextPresentation,
          slides: nextPresentation.slides.map((slide) => slide.id === slideId ? { ...slide, language: targetLanguage } : slide),
        })
        : nextPresentation;
      presentationRef.current = refinedPresentation;
      setPresentation(refinedPresentation);
      setSaveStatus("unsaved");
      await savePresentation(refinedPresentation);
    } catch (err: any) {
      setError(err.message || "AI presentation refinement failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const translateWithAi = async (slideId: string) => {
    if (!slideId) return;

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/presentation/translate", {
        method: "POST",
        body: JSON.stringify({ presentation, slideId }),
      });
      const targetLanguage = projectLanguage;
      const nextPresentation = normalizePresentation(res.presentation || {});
      const translatedPresentation = targetLanguage
        ? normalizePresentation({
          ...nextPresentation,
          slides: nextPresentation.slides.map((slide) => slide.id === slideId ? { ...slide, language: targetLanguage } : slide),
        })
        : nextPresentation;
      presentationRef.current = translatedPresentation;
      setPresentation(translatedPresentation);
      setSaveStatus("unsaved");
      await savePresentation(translatedPresentation);
    } catch (err: any) {
      setError(err.message || "AI presentation translation failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    projectLanguage,
    presentation,
    setPresentation,
    loading,
    saveStatus,
    aiState,
    error,
    markUnsaved,
    updatePresentation,
    savePresentation,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    dismissError,
  };
}
