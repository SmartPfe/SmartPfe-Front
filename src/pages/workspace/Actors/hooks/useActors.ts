import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

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

const normalizeActors = (actors: Actor[] = []): Actor[] =>
  actors.map((actor) => ({
    ...actor,
    name: actor.name || "",
    description: actor.description || "",
    type: actor.type === "external" ? "external" : "primary",
    icon: actor.icon || (actor.type === "external" ? "api" : "person"),
  }));

export function useActors() {
  const [project, setProject] = useState<any>(null);
  const [actors, setActors] = useState<Actor[]>([]);
  const [suggestion, setSuggestion] = useState<Actor[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestionSource, setSuggestionSource] = useState<"generate" | "refine" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const actorsRef = useRef<Actor[]>([]);

  useEffect(() => {
    actorsRef.current = actors;
  }, [actors]);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const actorsData = await fetchApi(`/projects/${projectData._id}/actors`);
        setActors(normalizeActors(actorsData.actors || []));
      } catch (err: any) {
        setError(err.message || "Failed to load actors. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchActors();
  }, []);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveActors = useCallback(async (nextActors = actors, showValidation = false, language?: string, generationFeature?: string) => {
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
      const payload = {
        actors: nextActors,
        ...(language ? { language } : {}),
        ...(generationFeature ? { generationFeature } : {}),
      };
      const res = await fetchApi(`/projects/${project._id}/actors`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(actorsRef.current) === JSON.stringify(nextActors)) {
        setActors(normalizeActors(res.actors || []));
        setProject((current: any) => current ? {
          ...current,
          actorsLanguage: res.language ?? current.actorsLanguage ?? "",
        } : current);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save actors. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [actors, project?._id]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") {
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
  }, [actors, aiState, project?._id, saveActors, saveStatus]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/actors/generate", { method: "POST" });
      setSuggestion(normalizeActors(res.actors || []));
      setSuggestionSource("generate");
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const actorsLanguage = normalizeLanguage(project?.actorsLanguage);

  const refineWithAi = async (instructions = "") => {
    if (actors.length === 0) {
      setError("Add or generate actors before asking AI to refine them.");
      return;
    }

    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { actors, instructions: trimmedInstructions }
        : { actors };
      const res = await fetchApi("/ai/actors/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(normalizeActors(res.actors || []));
      setSuggestionSource("refine");
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (actors.length === 0) {
      setError("Add or generate actors before asking AI to translate them.");
      return;
    }

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/actors/translate", {
        method: "POST",
        body: JSON.stringify({ actors }),
      });
      const translatedActors = normalizeActors(res.actors || []);
      actorsRef.current = translatedActors;
      setActors(translatedActors);
      await saveActors(translatedActors, false, projectLanguage || undefined);
      setAiState("idle");
    } catch (err: any) {
      setError(err.message || "AI actor translation failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      actorsRef.current = suggestion;
      setActors(suggestion);
      await saveActors(
        suggestion,
        false,
        projectLanguage || undefined,
        suggestionSource === "generate" ? "actors" : undefined
      );
      setSuggestionSource(null);
    }
    setSuggestion(null);
    setSuggestionSource(null);
    setAiState("idle");
  }, [projectLanguage, saveActors, suggestion, suggestionSource]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setSuggestionSource(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    actors,
    setActors,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    markUnsaved,
    saveActors,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    projectLanguage,
    actorsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
