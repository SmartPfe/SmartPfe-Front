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

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

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

  const saveActors = useCallback(async (nextActors = actors, showValidation = false) => {
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
      const res = await fetchApi(`/projects/${project._id}/actors`, {
        method: "PUT",
        body: JSON.stringify({ actors: nextActors }),
      });
      if (JSON.stringify(actorsRef.current) === JSON.stringify(nextActors)) {
        setActors(normalizeActors(res.actors || []));
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
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") {
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
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (actors.length === 0) {
      setError("Add or generate actors before asking AI to refine them.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/actors/refine", {
        method: "POST",
        body: JSON.stringify({ actors }),
      });
      setSuggestion(normalizeActors(res.actors || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(() => {
    if (suggestion) {
      setActors(suggestion);
      setSaveStatus("unsaved");
    }
    setSuggestion(null);
    setAiState("idle");
  }, [suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
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
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
