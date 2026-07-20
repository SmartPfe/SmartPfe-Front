import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { normalizeReportStructure, ReportSection } from "../../ReportStructure/hooks/useReportStructure";

export type ChapterStatus = "not-started" | "in-progress" | "completed";
export type DetailLevel = "summary" | "standard" | "detailed";
export type SaveStatus = "unsaved" | "saving" | "saved";
export type AiState = "idle" | "generating" | "acting" | "finalizing";

export type ReportChapter = {
  _id?: string;
  localId?: string;
  sectionId: string;
  title: string;
  contentHtml: string;
  contentMarkdown: string;
  contentLatex: string;
  status: ChapterStatus;
  generatedFrom: string[];
  sourceFingerprint: string;
  lastModified?: string;
};

export type FinalReport = {
  contentHtml?: string;
  contentMarkdown?: string;
  contentLatex?: string;
  generatedAt?: string;
  sourceFingerprint?: string;
};

export type FlatReportSection = {
  section: ReportSection;
  number: string;
  level: number;
};

export const AI_ACTIONS = [
  "Expand",
  "Shorten",
  "Improve Academic Style",
  "Make More Technical",
  "Simplify",
  "Continue Writing",
  "Improve Grammar",
  "Rewrite Selection",
  "Regenerate Selection",
  "Explain Better",
] as const;

export type AiAction = typeof AI_ACTIONS[number];

const createLocalId = () => `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const stripHtml = (html = "") =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

export const htmlToMarkdown = (html = "") =>
  html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "### $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gis, "- $1\n")
    .replace(/<\/(ul|ol)>/gis, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gis, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gis, "_$1_")
    .replace(/<i[^>]*>(.*?)<\/i>/gis, "_$1_")
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const escapeLatex = (value = "") =>
  value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

export const markdownToLatex = (markdown = "") =>
  markdown
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith("### ")) return `\\subsubsection{${escapeLatex(line.slice(4))}}`;
      if (line.startsWith("## ")) return `\\subsection{${escapeLatex(line.slice(3))}}`;
      if (line.startsWith("# ")) return `\\section{${escapeLatex(line.slice(2))}}`;
      if (/^\s*[-*]\s+/.test(line)) return `\\item ${escapeLatex(line.replace(/^\s*[-*]\s+/, ""))}`;
      return escapeLatex(line);
    })
    .join("\n");

export const normalizeChapter = (chapter: Partial<ReportChapter> = {}): ReportChapter => {
  const contentHtml = String(chapter.contentHtml || "").trim();
  const contentMarkdown = String(chapter.contentMarkdown || htmlToMarkdown(contentHtml)).trim();
  const normalizedHtml = contentHtml || (contentMarkdown ? `<p>${contentMarkdown.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>` : "");
  const hasContent = Boolean(stripHtml(normalizedHtml));

  return {
    _id: chapter._id,
    localId: chapter.localId || createLocalId(),
    sectionId: String(chapter.sectionId || "").trim(),
    title: String(chapter.title || "Untitled chapter").trim(),
    contentHtml: normalizedHtml,
    contentMarkdown,
    contentLatex: String(chapter.contentLatex || markdownToLatex(contentMarkdown)).trim(),
    status: chapter.status || (hasContent ? "in-progress" : "not-started"),
    generatedFrom: Array.isArray(chapter.generatedFrom) ? chapter.generatedFrom.filter(Boolean) : [],
    sourceFingerprint: String(chapter.sourceFingerprint || "").trim(),
    lastModified: chapter.lastModified,
  };
};

export const flattenReportStructure = (sections: ReportSection[] = [], prefix = "", level = 1): FlatReportSection[] =>
  sections.flatMap((section, index) => {
    const number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
    return [
      { section, number, level },
      ...flattenReportStructure(section.children || [], number, level + 1),
    ];
  });

export const hasChapterContent = (chapter?: ReportChapter) => Boolean(chapter && stripHtml(chapter.contentHtml));

export function useReportStudio() {
  const [project, setProject] = useState<any>(null);
  const [reportStructure, setReportStructure] = useState<ReportSection[]>([]);
  const [reportChapters, setReportChapters] = useState<ReportChapter[]>([]);
  const [sourceFingerprint, setSourceFingerprint] = useState("");
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const chaptersRef = useRef<ReportChapter[]>([]);

  const flatSections = useMemo(() => flattenReportStructure(reportStructure), [reportStructure]);

  useEffect(() => {
    chaptersRef.current = reportChapters;
  }, [reportChapters]);

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);

        const [structureData, chapterData] = await Promise.all([
          fetchApi(`/projects/${projectData._id}/report-structure`),
          fetchApi(`/projects/${projectData._id}/report-chapters`),
        ]);

        setReportStructure(normalizeReportStructure(structureData.reportStructure || []));
        setReportChapters((chapterData.reportChapters || []).map(normalizeChapter));
        setSourceFingerprint(chapterData.sourceFingerprint || "");
        setFinalReport(chapterData.finalReport || null);
      } catch (err: any) {
        setError(err.message || "Failed to load report studio. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudio();
  }, []);

  const getChapter = useCallback(
    (sectionId: string) => reportChapters.find((chapter) => chapter.sectionId === sectionId),
    [reportChapters]
  );

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveReportChapters = useCallback(async (nextChapters = reportChapters, showValidation = false) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = nextChapters.map(normalizeChapter);
    if (showValidation && normalized.length === 0) {
      setError("Generate or edit at least one report chapter before saving.");
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const res = await fetchApi(`/projects/${project._id}/report-chapters`, {
        method: "PUT",
        body: JSON.stringify({ reportChapters: normalized }),
      });
      if (JSON.stringify(chaptersRef.current.map(normalizeChapter)) === JSON.stringify(normalized)) {
        setReportChapters((res.reportChapters || []).map(normalizeChapter));
        setSourceFingerprint(res.sourceFingerprint || sourceFingerprint);
        setFinalReport(res.finalReport || null);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save report chapters. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, reportChapters, sourceFingerprint]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveReportChapters(reportChapters), 1200);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, project?._id, reportChapters, saveReportChapters, saveStatus]);

  const upsertChapter = useCallback((chapter: ReportChapter) => {
    setReportChapters((current) => {
      const normalized = normalizeChapter(chapter);
      const exists = current.some((item) => item.sectionId === normalized.sectionId);
      return exists
        ? current.map((item) => (item.sectionId === normalized.sectionId ? normalized : item))
        : [...current, normalized];
    });
  }, []);

  const updateChapter = useCallback((sectionId: string, updates: Partial<ReportChapter>) => {
    setReportChapters((current) => {
      const existing = current.find((chapter) => chapter.sectionId === sectionId);
      const section = flatSections.find((item) => item.section.id === sectionId)?.section;
      const merged = normalizeChapter({
        ...existing,
        sectionId,
        title: section?.title || existing?.title || "Untitled chapter",
        ...updates,
        status: updates.status || existing?.status || "in-progress",
      });
      const exists = current.some((chapter) => chapter.sectionId === sectionId);
      return exists
        ? current.map((chapter) => (chapter.sectionId === sectionId ? merged : chapter))
        : [...current, merged];
    });
    markUnsaved();
  }, [flatSections, markUnsaved]);

  const generateChapter = async (sectionId: string, detailLevel: DetailLevel) => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/report-studio/chapter/generate", {
        method: "POST",
        body: JSON.stringify({ sectionId, detailLevel, reportChapters: chaptersRef.current }),
      });
      const nextChapter = normalizeChapter(res.chapter);
      const nextChapters = [
        ...chaptersRef.current.filter((chapter) => chapter.sectionId !== sectionId),
        nextChapter,
      ];
      chaptersRef.current = nextChapters;
      setReportChapters(nextChapters);
      setSaveStatus("unsaved");
      await saveReportChapters(nextChapters);
    } catch (err: any) {
      setError(err.message || "AI chapter generation failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const runChapterAction = async (sectionId: string, action: AiAction, currentContent: string, selectedText = "") => {
    setAiState("acting");
    setError(null);
    try {
      const res = await fetchApi("/ai/report-studio/chapter/action", {
        method: "POST",
        body: JSON.stringify({ sectionId, action, currentContent, selectedText, reportChapters: chaptersRef.current }),
      });
      const nextChapter = normalizeChapter(res.chapter);
      const nextChapters = [
        ...chaptersRef.current.filter((chapter) => chapter.sectionId !== sectionId),
        nextChapter,
      ];
      chaptersRef.current = nextChapters;
      setReportChapters(nextChapters);
      setSaveStatus("unsaved");
      await saveReportChapters(nextChapters);
    } catch (err: any) {
      setError(err.message || "AI writing action failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const generateCompleteReport = async () => {
    setAiState("finalizing");
    setError(null);
    try {
      const res = await fetchApi("/ai/report-studio/final/generate", {
        method: "POST",
        body: JSON.stringify({ reportChapters: chaptersRef.current }),
      });
      setFinalReport(res.finalReport || null);
    } catch (err: any) {
      setError(err.message || "Complete report generation failed. Please try again.");
    } finally {
      setAiState("idle");
    }
  };

  const dismissError = useCallback(() => setError(null), []);

  return {
    project,
    reportStructure,
    flatSections,
    reportChapters,
    sourceFingerprint,
    finalReport,
    loading,
    saveStatus,
    aiState,
    error,
    getChapter,
    hasChapterContent,
    markUnsaved,
    updateChapter,
    upsertChapter,
    saveReportChapters,
    generateChapter,
    runChapterAction,
    generateCompleteReport,
    dismissError,
  };
}
