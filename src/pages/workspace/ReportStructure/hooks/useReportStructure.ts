import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAiGeneration } from "@/context/AiGenerationContext";

export type ReportSection = {
  id: string;
  title: string;
  collapsed: boolean;
  children: ReportSection[];
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

const TASK_ID = "report-structure:main";
const SCOPE = "report-structure";
const PAGE_ROUTE = "/workspace/report-structure";

export function useReportStructure() {
  const { startTask, isTaskActive, getTask, tasks, dismissTask, cancelTask } = useAiGeneration();
  const [project, setProject] = useState<any>(null);
  const [reportStructure, setReportStructure] = useState<ReportSection[]>([]);
  const [suggestion, setSuggestion] = useState<ReportSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [localAiState, setLocalAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const structureRef = useRef<ReportSection[]>([]);
  const handledTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    structureRef.current = reportStructure;
  }, [reportStructure]);

  const fetchReportStructure = useCallback(async () => {
    try {
      const projectData = await fetchApi("/projects/my-project");
      setProject(projectData);
      const data = await fetchApi(`/projects/${projectData._id}/report-structure`);
      const normalized = normalizeReportStructure(data.reportStructure || []);
      setReportStructure(normalized);
      structureRef.current = normalized;
      return { projectData, reportStructure: normalized };
    } catch (err: any) {
      setError(err.message || "Failed to load report structure. Please refresh the page.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportStructure();
  }, [fetchReportStructure]);

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
        if (task.result.type === "suggestion" && Array.isArray(task.result.reportStructure)) {
          setSuggestion(task.result.reportStructure);
          setLocalAiState("suggestion_ready");
        } else if (task.result.type === "saved" && Array.isArray(task.result.reportStructure)) {
          setReportStructure(task.result.reportStructure);
          structureRef.current = task.result.reportStructure;
          setLocalAiState("idle");
          fetchReportStructure();
        }
      }
    } else if (task.status === "error") {
      setLocalAiState("idle");
      if (task.error && !task.error.includes("Limit reached")) {
        setError(task.error);
      }
    }
  }, [fetchReportStructure, localAiState, tasks]);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveReportStructure = useCallback(async (nextStructure = reportStructure, showValidation = false, language?: string) => {
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
      const payload = language
        ? { reportStructure: normalized, language }
        : { reportStructure: normalized };
      const res = await fetchApi(`/projects/${project._id}/report-structure`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(structureRef.current) === JSON.stringify(normalized)) {
        const resNormalized = normalizeReportStructure(res.reportStructure || []);
        setReportStructure(resNormalized);
        structureRef.current = resNormalized;
        setProject((current: any) => current ? {
          ...current,
          reportStructureLanguage: res.language ?? current.reportStructureLanguage ?? "",
        } : current);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save report structure. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, reportStructure]);

  const isRunning = isTaskActive(TASK_ID);
  const currentTask = getTask(TASK_ID);

  const aiState: AiState = isRunning
    ? (currentTask?.status as AiState) || "generating"
    : localAiState;

  const isAiBusy = isRunning || aiState === "generating" || aiState === "refining" || aiState === "translating";

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || isAiBusy) return;
    if (reportStructure.length === 0) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveReportStructure(reportStructure), 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [isAiBusy, project?._id, reportStructure, saveReportStructure, saveStatus]);

  const projectLanguage = normalizeLanguage(project?.basics?.language || project?.language);
  const reportStructureLanguage = normalizeLanguage(project?.reportStructureLanguage);

  const generateWithAi = async () => {
    setLocalAiState("generating");
    setError(null);

    try {
      const result = await startTask<{ type: string; reportStructure: ReportSection[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Report Structure",
        subTitle: "Generating report structure with AI...",
        pageRoute: PAGE_ROUTE,
        status: "generating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/report-structure/generate", {
            method: "POST",
            signal,
          });
          const normalized = normalizeReportStructure(res.reportStructure || []);
          return { type: "suggestion", reportStructure: normalized };
        },
      });

      if (result?.reportStructure) {
        setSuggestion(result.reportStructure);
        setLocalAiState("suggestion_ready");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI generation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const refineWithAi = async (instructions = "") => {
    if (reportStructure.length === 0) {
      setError("Add or generate a report structure before asking AI to refine it.");
      return;
    }

    setLocalAiState("refining");
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { reportStructure: structureRef.current, instructions: trimmedInstructions }
        : { reportStructure: structureRef.current };

      const result = await startTask<{ type: string; reportStructure: ReportSection[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Report Structure",
        subTitle: "Refining report structure with AI...",
        pageRoute: PAGE_ROUTE,
        status: "refining",
        runner: async (signal) => {
          const res = await fetchApi("/ai/report-structure/refine", {
            method: "POST",
            body: JSON.stringify(payload),
            signal,
          });
          const normalized = normalizeReportStructure(res.reportStructure || []);
          return { type: "suggestion", reportStructure: normalized };
        },
      });

      if (result?.reportStructure) {
        setSuggestion(result.reportStructure);
        setLocalAiState("suggestion_ready");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI refinement failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (reportStructure.length === 0) {
      setError("Add or generate a report structure before asking AI to translate it.");
      return;
    }

    setLocalAiState("translating");
    setError(null);

    try {
      const result = await startTask<{ type: string; reportStructure: ReportSection[] }>({
        id: TASK_ID,
        scope: SCOPE,
        title: "Report Structure",
        subTitle: `Translating report structure to ${getLanguageLabel(projectLanguage)}...`,
        pageRoute: PAGE_ROUTE,
        status: "translating",
        runner: async (signal) => {
          const res = await fetchApi("/ai/report-structure/translate", {
            method: "POST",
            body: JSON.stringify({ reportStructure: structureRef.current }),
            signal,
          });
          const translatedStructure = normalizeReportStructure(res.reportStructure || []);

          if (project?._id) {
            const savePayload = projectLanguage
              ? { reportStructure: translatedStructure, language: projectLanguage }
              : { reportStructure: translatedStructure };
            await fetchApi(`/projects/${project._id}/report-structure`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
              signal,
            });
          }

          return { type: "saved", reportStructure: translatedStructure };
        },
      });

      if (result?.reportStructure) {
        structureRef.current = result.reportStructure;
        setReportStructure(result.reportStructure);
        setLocalAiState("idle");
        setSaveStatus("saved");
      } else {
        setLocalAiState("idle");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err.message || "AI report structure translation failed. Please try again.");
      }
      setLocalAiState("idle");
    }
  };

  const cancelAi = useCallback(() => {
    cancelTask(TASK_ID);
    setLocalAiState("idle");
  }, [cancelTask]);

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      structureRef.current = suggestion;
      setReportStructure(suggestion);
      setSuggestion(null);
      setLocalAiState("idle");
      dismissTask(TASK_ID);
      await saveReportStructure(suggestion, false, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask, projectLanguage, saveReportStructure, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setLocalAiState("idle");
    dismissTask(TASK_ID);
  }, [dismissTask]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    reportStructure,
    setReportStructure,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveReportStructure,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    reportStructureLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
