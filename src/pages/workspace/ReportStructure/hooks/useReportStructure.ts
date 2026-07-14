import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";

export type ReportSection = {
  id: string;
  title: string;
  collapsed: boolean;
  children: ReportSection[];
};

export type AiState = "idle" | "generating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const createId = () => `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const normalizeReportStructure = (sections: ReportSection[] = []): ReportSection[] =>
  sections
    .map((section) => ({
      id: section.id || createId(),
      title: section.title || "Untitled section",
      collapsed: Boolean(section.collapsed),
      children: normalizeReportStructure(section.children || []),
    }))
    .filter((section) => section.title.trim());

export function createEmptySection(title = "New section"): ReportSection {
  return {
    id: createId(),
    title,
    collapsed: false,
    children: [],
  };
}

export function useReportStructure() {
  const [project, setProject] = useState<any>(null);
  const [reportStructure, setReportStructure] = useState<ReportSection[]>([]);
  const [suggestion, setSuggestion] = useState<ReportSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const structureRef = useRef<ReportSection[]>([]);

  useEffect(() => {
    structureRef.current = reportStructure;
  }, [reportStructure]);

  useEffect(() => {
    const fetchReportStructure = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);
        const data = await fetchApi(`/projects/${projectData._id}/report-structure`);
        setReportStructure(normalizeReportStructure(data.reportStructure || []));
      } catch (err: any) {
        setError(err.message || "Failed to load report structure. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportStructure();
  }, []);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveReportStructure = useCallback(async (nextStructure = reportStructure, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = normalizeReportStructure(nextStructure);
    if (normalized.length === 0) {
      if (showValidation) setError("Please add at least one report section before saving.");
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/report-structure`, {
        method: "PUT",
        body: JSON.stringify({ reportStructure: normalized }),
      });
      if (JSON.stringify(structureRef.current) === JSON.stringify(normalized)) {
        setReportStructure(normalizeReportStructure(res.reportStructure || []));
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save report structure. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, reportStructure]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState === "generating") return;
    if (reportStructure.length === 0) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveReportStructure(reportStructure), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, project?._id, reportStructure, saveReportStructure, saveStatus]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/report-structure/generate", { method: "POST" });
      setSuggestion(normalizeReportStructure(res.reportStructure || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const refineWithAi = async () => {
    if (reportStructure.length === 0) {
      setError("Add or generate a report structure before asking AI to refine it.");
      return;
    }

    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/report-structure/refine", {
        method: "POST",
        body: JSON.stringify({ reportStructure }),
      });
      setSuggestion(normalizeReportStructure(res.reportStructure || []));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      structureRef.current = suggestion;
      setReportStructure(suggestion);
      setSuggestion(null);
      setAiState("idle");
      await saveReportStructure(suggestion);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [saveReportStructure, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    reportStructure,
    setReportStructure,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    markUnsaved,
    saveReportStructure,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
