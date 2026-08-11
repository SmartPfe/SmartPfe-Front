import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

export type ExistingSolution = {
  _id?: string;
  localId?: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  solvedProblem: string;
  strengths: string[];
  weaknesses: string[];
  differentiation: string;
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

const normalizeList = (items: string[] = []) =>
  items.map((item) => item || "").filter((item) => item.trim().length > 0);

const normalizeSolutions = (solutions: ExistingSolution[] = []): ExistingSolution[] =>
  solutions.map((solution) => ({
    ...solution,
    name: solution.name || "",
    category: solution.category || "Existing Solution",
    icon: solution.icon || "search",
    description: solution.description || "",
    solvedProblem: solution.solvedProblem || "",
    strengths: normalizeList(solution.strengths || []),
    weaknesses: normalizeList(solution.weaknesses || []),
    differentiation: solution.differentiation || "",
  }));

export function useExistingSolutions() {
  const [project, setProject] = useState<any>(null);
  const [solutions, setSolutions] = useState<ExistingSolution[]>([]);
  const [suggestion, setSuggestion] = useState<ExistingSolution[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestionSource, setSuggestionSource] = useState<"generate" | "refine" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const solutionsRef = useRef<ExistingSolution[]>([]);

  useEffect(() => {
    solutionsRef.current = solutions;
  }, [solutions]);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const data = await fetchApi(`/projects/${projectData._id}/existing-solutions`);
        setSolutions(normalizeSolutions(data.existingSolutions || []));
      } catch (err: any) {
        setError(err.message || "Failed to load existing solutions. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, []);

  const markUnsaved = useCallback(() => {
    setSaveStatus("unsaved");
  }, []);

  const saveSolutions = useCallback(async (nextSolutions = solutions, showValidation = false, language?: string, generationFeature?: string) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const hasIncompleteSolution = nextSolutions.some(
      (solution) =>
        !solution.name.trim() ||
        !solution.description.trim() ||
        !solution.solvedProblem.trim() ||
        !solution.differentiation.trim()
    );
    if (hasIncompleteSolution) {
      if (showValidation) {
        setError("Please fill the name, description, solved problem, and differentiation before saving.");
      }
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const payload = {
        existingSolutions: nextSolutions,
        ...(language ? { language } : {}),
        ...(generationFeature ? { generationFeature } : {}),
      };
      const res = await fetchApi(`/projects/${project._id}/existing-solutions`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(solutionsRef.current) === JSON.stringify(nextSolutions)) {
        setSolutions(normalizeSolutions(res.existingSolutions || []));
        setProject((current: any) => current ? {
          ...current,
          existingSolutionsLanguage: res.language ?? current.existingSolutionsLanguage ?? "",
        } : current);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save existing solutions. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, solutions]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") {
      return;
    }

    const hasIncompleteSolution = solutions.some(
      (solution) =>
        !solution.name.trim() ||
        !solution.description.trim() ||
        !solution.solvedProblem.trim() ||
        !solution.differentiation.trim()
    );
    if (hasIncompleteSolution) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveSolutions(solutions);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [aiState, project?._id, saveSolutions, saveStatus, solutions]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/existing-solutions/generate", { method: "POST" });
      setSuggestion(normalizeSolutions(res.existingSolutions || []));
      setSuggestionSource("generate");
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const existingSolutionsLanguage = normalizeLanguage(project?.existingSolutionsLanguage);

  const refineWithAi = async (instructions = "") => {
    if (solutions.length === 0) {
      setError("Add or generate existing solutions before asking AI to refine them.");
      return;
    }

    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { existingSolutions: solutions, instructions: trimmedInstructions }
        : { existingSolutions: solutions };
      const res = await fetchApi("/ai/existing-solutions/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(normalizeSolutions(res.existingSolutions || []));
      setSuggestionSource("refine");
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (solutions.length === 0) {
      setError("Add or generate existing solutions before asking AI to translate them.");
      return;
    }

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/existing-solutions/translate", {
        method: "POST",
        body: JSON.stringify({ existingSolutions: solutions }),
      });
      const translatedSolutions = normalizeSolutions(res.existingSolutions || []);
      solutionsRef.current = translatedSolutions;
      setSolutions(translatedSolutions);
      await saveSolutions(translatedSolutions, false, projectLanguage || undefined);
      setAiState("idle");
    } catch (err: any) {
      setError(err.message || "AI existing solution translation failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      solutionsRef.current = suggestion;
      setSolutions(suggestion);
      setSuggestion(null);
      setAiState("idle");
      await saveSolutions(
        suggestion,
        false,
        projectLanguage || undefined,
        suggestionSource === "generate" ? "existingSolutions" : undefined
      );
      setSuggestionSource(null);
      return;
    }
    setSuggestion(null);
    setSuggestionSource(null);
    setAiState("idle");
  }, [projectLanguage, saveSolutions, suggestion, suggestionSource]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setSuggestionSource(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    solutions,
    setSolutions,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    markUnsaved,
    saveSolutions,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    projectLanguage,
    existingSolutionsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
