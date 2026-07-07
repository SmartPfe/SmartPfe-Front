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

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

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

  const saveSolutions = useCallback(async (nextSolutions = solutions, showValidation = false) => {
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
      const res = await fetchApi(`/projects/${project._id}/existing-solutions`, {
        method: "PUT",
        body: JSON.stringify({ existingSolutions: nextSolutions }),
      });
      if (JSON.stringify(solutionsRef.current) === JSON.stringify(nextSolutions)) {
        setSolutions(normalizeSolutions(res.existingSolutions || []));
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
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") {
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
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (solutions.length === 0) {
      setError("Add or generate existing solutions before asking AI to refine them.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/existing-solutions/refine", {
        method: "POST",
        body: JSON.stringify({ existingSolutions: solutions }),
      });
      setSuggestion(normalizeSolutions(res.existingSolutions || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      solutionsRef.current = suggestion;
      setSolutions(suggestion);
      setSuggestion(null);
      setAiState("idle");
      await saveSolutions(suggestion);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [saveSolutions, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
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
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
