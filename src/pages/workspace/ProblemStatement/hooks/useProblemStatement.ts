import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

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
  const saveContent = useCallback(async (content: string) => {
    setSaveStatus("saving");
    setError(null);
    try {
      await fetchApi("/projects/problem-statement", {
        method: "PATCH",
        body: JSON.stringify({ problemStatement: content }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("unsaved"), 2500);
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

  const refineWithAi = async (plainText: string) => {
    if (!plainText.trim()) {
      setError("The editor is empty — write something before asking AI to refine it.");
      return;
    }
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/problem-statement/refine", {
        method: "POST",
        body: JSON.stringify({ current: plainText }),
      });
      setSuggestion(res.suggestion);
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

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
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
