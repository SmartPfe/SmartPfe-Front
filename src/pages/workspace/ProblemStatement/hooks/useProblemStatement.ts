import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";

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

export function useProblemStatement() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved"); // starts as saved (nothing to save yet)

  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load project on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await fetchApi("/projects/my-project");
        setProject(data);
      } catch (err: any) {
        setError("Failed to load your project. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, []);

  // Save — does NOT depend on `project` state to avoid stale closure / null guard bug.
  // The auth token in the header identifies the user; the backend finds the project by user ID.
  const saveContent = useCallback(async (content: string, language?: string) => {
    setSaveStatus("saving");
    setError(null);
    try {
      const payload = language
        ? { problemStatement: content, language }
        : { problemStatement: content };
      const res = await fetchApi("/projects/problem-statement", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setProject((current: any) => current ? {
        ...current,
        description: {
          ...current.description,
          problemStatement: res.problemStatement ?? content,
          problemStatementLanguage: res.language ?? current.description?.problemStatementLanguage ?? "",
        },
      } : current);
      setSaveStatus("saved");
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
      setSaveStatus("unsaved");
    }
  }, []); // no deps — fetchApi is stable, auth comes from localStorage

  const markUnsaved = useCallback(() => {
    setSaveStatus((prev) => (prev === "saving" ? prev : "unsaved"));
  }, []);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/problem-statement/generate", { method: "POST" });
      setAiState("idle");
      return res.suggestion; // Return directly to bypass suggestion panel
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
      return null;
    }
  };

  const refineWithAi = async (plainText: string, instructions = "") => {
    if (!plainText.trim()) {
      setError("The editor is empty. Write something before asking AI to refine it.");
      return;
    }
    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { current: plainText, instructions: trimmedInstructions }
        : { current: plainText };
      const res = await fetchApi("/ai/problem-statement/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(res.suggestion);
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async (currentContent: string) => {
    if (!currentContent.trim()) {
      setError("The editor is empty. Write something before asking AI to translate it.");
      return null;
    }
    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/problem-statement/translate", {
        method: "POST",
        body: JSON.stringify({ current: currentContent }),
      });
      setAiState("idle");
      return res.suggestion;
    } catch (err: any) {
      setError(err.message || "AI translation failed. Please try again.");
      setAiState("idle");
      return null;
    }
  };

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const problemStatementLanguage = normalizeLanguage(
    project?.description?.problemStatementLanguage || project?.description?.generatedContent?.language
  );

  const acceptSuggestion = useCallback(() => {
    setAiState("idle");
    setSuggestion(null);
  }, []);

  const discardSuggestion = useCallback(() => {
    setAiState("idle");
    setSuggestion(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    saveContent,
    markUnsaved,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    projectLanguage,
    problemStatementLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
