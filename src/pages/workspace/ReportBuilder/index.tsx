import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { useAiGeneration } from "@/context/AiGenerationContext";
import {
  AI_ACTIONS,
  AiAction,
  AiState,
  DetailLevel,
  FinalReport,
  FlatReportSection,
  ReportChapter,
  getLanguageLabel,
  normalizeLanguage,
  htmlToMarkdown,
  markdownToLatex,
  useReportStudio,
} from "./hooks/useReportStudio";
import { ReportSection } from "../ReportStructure/hooks/useReportStructure";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

type StudioTab = "rich" | "markdown" | "latex";

const detailLabels: Record<DetailLevel, string> = {
  summary: "Summary",
  standard: "Standard",
  detailed: "Detailed",
};

export interface ToolConfig {
  id: AiAction;
  label: string;
  shortLabel: string;
  icon: string;
  desc: string;
  iconColor: string;
}

export const ALL_AI_TOOLS: ToolConfig[] = [
  { id: "Rewrite Selection", label: "Rephrase", shortLabel: "Rephrase", icon: "sync-alt", desc: "Rephrase and polish with fresh wording", iconColor: "text-sky-600 dark:text-sky-400" },
  { id: "Expand", label: "Expand", shortLabel: "Expand", icon: "format-align-left", desc: "Add more depth and technical detail", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "Shorten", label: "Shorten", shortLabel: "Shorten", icon: "format-align-center", desc: "Make more concise and punchy", iconColor: "text-amber-600 dark:text-amber-400" },
  { id: "Make More Technical", label: "More Technical", shortLabel: "Technical", icon: "terminal", desc: "Incorporate engineering vocabulary", iconColor: "text-purple-600 dark:text-purple-400" },
  { id: "Simplify", label: "Simplify", shortLabel: "Simplify", icon: "tune", desc: "Clarify complex or convoluted points", iconColor: "text-blue-600 dark:text-blue-400" },
  { id: "Improve Grammar", label: "Fix Grammar", shortLabel: "Grammar", icon: "spellcheck", desc: "Fix grammar, spelling, and academic flow", iconColor: "text-teal-600 dark:text-teal-400" },
  { id: "Explain Better", label: "Explain Better", shortLabel: "Explain", icon: "psychology", desc: "Elaborate with intuitive clarity", iconColor: "text-rose-600 dark:text-rose-400" },
  { id: "Continue Writing", label: "Continue Writing", shortLabel: "Continue", icon: "arrow-forward", desc: "Continue generating the next section", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { id: "Improve Academic Style", label: "Academic Style", shortLabel: "Academic", icon: "school", desc: "Refine tone into formal thesis standard", iconColor: "text-violet-600 dark:text-violet-400" },
];

export const DEFAULT_PINNED_TOOLS: AiAction[] = [
  "Rewrite Selection",
  "Expand",
  "Shorten",
  "Make More Technical",
];

export default function ReportBuilder() {
  const {
    project,
    reportStructure,
    flatSections,
    reportChapters,
    sourceFingerprint,
    finalReport,
    loading,
    saveStatus,
    aiState,
    isSectionGenerating,
    getSectionAiState,
    isFinalizing,
    error,
    getChapter,
    updateChapter,
    saveReportChapters,
    generateChapter,
    runChapterAction,
    translateChapter,
    projectLanguage,
    generateCompleteReport,
    dismissError,
  } = useReportStudio();

  const location = useLocation();
  const { setActiveRouteState } = useAiGeneration();
  const [activeSectionId, setActiveSectionId] = useState("overview");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("standard");
  const [activeTab, setActiveTab] = useState<StudioTab>("rich");
  const [selectedText, setSelectedText] = useState("");
  const [copied, setCopied] = useState<StudioTab | "final" | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const expandAllSections = () => {
    setCollapsedSections({});
  };

  const collapseAllSections = () => {
    const all: Record<string, boolean> = {};
    flatSections.forEach((item) => {
      if (!isLeafSection(item)) {
        all[item.section.id] = true;
      }
    });
    setCollapsedSections(all);
  };

  const hasAnyCollapsed = useMemo(
    () => Object.values(collapsedSections).some(Boolean),
    [collapsedSections]
  );

  const leafSections = useMemo(() => flatSections.filter((item) => isLeafSection(item)), [flatSections]);

  // Automatically expand ancestors of active section when selected
  useEffect(() => {
    if (activeSectionId && activeSectionId !== "overview") {
      const activeSection = flatSections.find((item) => item.section.id === activeSectionId);
      if (activeSection?.ancestorIds && activeSection.ancestorIds.length > 0) {
        setCollapsedSections((prev) => {
          let hasChange = false;
          const next = { ...prev };
          for (const ancestorId of activeSection.ancestorIds!) {
            if (next[ancestorId]) {
              next[ancestorId] = false;
              hasChange = true;
            }
          }
          return hasChange ? next : prev;
        });
      }
    }
  }, [activeSectionId, flatSections]);

  useEffect(() => {
    setActiveRouteState({
      pathname: location.pathname,
      sectionId: activeSectionId,
    });
  }, [location.pathname, activeSectionId, setActiveRouteState]);

  useEffect(() => {
    if (location.state?.activeSectionId) {
      setActiveSectionId(location.state.activeSectionId);
    }
  }, [location.state?.activeSectionId]);

  const totalWords = useMemo(
    () => reportChapters.reduce((acc, chapter) => acc + countWords(chapter.contentHtml || ""), 0),
    [reportChapters]
  );

  const activeFlatSection = flatSections.find((item) => item.section.id === activeSectionId) || flatSections[0];
  const activeIsLeaf = Boolean(activeFlatSection && isLeafSection(activeFlatSection));
  const activeChapter = activeFlatSection ? getChapter(activeFlatSection.section.id) : undefined;
  const generatedCount = leafSections.filter((item) => hasContent(getChapter(item.section.id))).length;
  const completedCount = leafSections.filter((item) => getChapter(item.section.id)?.status === "completed").length;
  const outdatedCount = leafSections.filter((item) => {
    const chapter = getChapter(item.section.id);
    return chapter?.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint;
  }).length;
  const progressPercent = leafSections.length ? Math.round((generatedCount / leafSections.length) * 100) : 0;
  const allGenerated = leafSections.length > 0 && generatedCount === leafSections.length;
  const activeIsOutdated = Boolean(
    activeChapter?.sourceFingerprint &&
    sourceFingerprint &&
    activeChapter.sourceFingerprint !== sourceFingerprint
  );
  
  const currentSectionAiState = activeFlatSection ? getSectionAiState(activeFlatSection.section.id) : "idle";
  const isAiIdle = currentSectionAiState === "idle" && aiState === "idle";
  
  const projectLanguageNormalized = normalizeLanguage((project as any)?.reportStructureLanguage);
  const activeChapterLanguage = normalizeLanguage(activeChapter?.language || projectLanguageNormalized);
  const shouldShowTranslate = Boolean(
    activeIsLeaf &&
    activeChapter &&
    hasContent(activeChapter) &&
    projectLanguage &&
    activeChapterLanguage &&
    activeChapterLanguage !== projectLanguage
  );

  const currentMarkdown = useMemo(
    () => activeChapter?.contentMarkdown || htmlToMarkdown(activeChapter?.contentHtml || ""),
    [activeChapter]
  );
  const currentLatex = useMemo(
    () => activeChapter?.contentLatex || markdownToLatex(currentMarkdown),
    [activeChapter, currentMarkdown]
  );

  const handleEditorChange = (html: string) => {
    if (!activeFlatSection || !activeIsLeaf) return;
    const markdown = htmlToMarkdown(html);
    updateChapter(activeFlatSection.section.id, {
      title: activeFlatSection.section.title,
      contentHtml: html,
      contentMarkdown: markdown,
      contentLatex: markdownToLatex(markdown),
      status: "in-progress",
      language: activeChapter?.language || projectLanguage,
    });
  };

  const handleCopy = async (value: string, key: StudioTab | "final") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading AI Report Studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] w-full mx-auto pb-32">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Academic Delivery & Manuscript</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Academic Report Builder
            <InfoTooltip label="Report Builder" tooltip="Write, generate, refine, and compile your full graduation thesis with chapter-by-chapter AI assistance." />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1 leading-relaxed">
            Generate and refine rich academic thesis chapters powered by your complete project methodology context.
          </p>
        </div>
        
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveReportChapters(reportChapters, true)}
          isBusy={!isAiIdle}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-xs font-semibold">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {flatSections.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface py-16 px-6 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-primary">
            <HugeiconsIcon icon="layers" size={32} strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-1">Report Structure Required</h2>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Create or generate your Report Structure first. The Studio drafts chapters based on that table of contents.
          </p>
        </div>
      ) : (
        <div className={cn(
          "w-full grid gap-4 min-h-[calc(100dvh-220px)] min-w-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed
            ? "grid-cols-1 xl:grid-cols-[68px_minmax(0,1fr)]"
            : "grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)]"
        )}>
          <aside className={cn(
            "rounded-2xl border border-outline-variant/80 bg-surface overflow-hidden flex flex-col min-h-[420px] xl:min-h-0 min-w-0 transition-all duration-300 shadow-2xs",
            sidebarCollapsed && "items-center"
          )}>
            <div className={cn(
              "p-3.5 border-b border-outline-variant/80 bg-surface flex items-center justify-between gap-2 w-full",
              sidebarCollapsed ? "justify-center px-2" : "justify-between"
            )}>
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface truncate">Table of Contents</span>
                  <button
                    type="button"
                    onClick={hasAnyCollapsed ? expandAllSections : collapseAllSections}
                    className="text-[11px] text-primary hover:text-primary/80 font-bold px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                    title={hasAnyCollapsed ? "Expand all sections" : "Collapse all sections"}
                  >
                    {hasAnyCollapsed ? "Expand All" : "Collapse All"}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <HugeiconsIcon icon={sidebarCollapsed ? "chevron-right" : "chevron-left"} size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 w-full space-y-1">
              <button
                onClick={() => setActiveSectionId("overview")}
                className={cn(
                  "w-full flex items-center rounded-xl transition-all border mb-2 cursor-pointer shadow-2xs",
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2.5 text-left",
                  activeSectionId === "overview"
                    ? "bg-primary text-on-primary font-bold border-primary shadow-xs"
                    : "bg-surface-container-lowest text-on-surface hover:bg-surface-container hover:text-on-surface border-outline-variant/60"
                )}
              >
                <HugeiconsIcon icon="dashboard" size={17} strokeWidth={1.8} className={activeSectionId === "overview" ? "text-on-primary" : "text-primary"} />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-xs font-bold truncate flex-1">Overview Hub</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold",
                      activeSectionId === "overview" ? "bg-on-primary/20 text-on-primary" : "bg-surface text-on-surface"
                    )}>
                      {progressPercent}%
                    </span>
                  </>
                )}
              </button>

              {!sidebarCollapsed && (
                <div className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider text-on-surface/80 uppercase">
                  Chapters & Sections
                </div>
              )}

              {flatSections.map((item) => {
                const chapter = getChapter(item.section.id);
                const generating = isSectionGenerating(item.section.id);
                const isLeaf = isLeafSection(item);
                
                // If any ancestor is collapsed, hide this item when sidebar is expanded
                if (!sidebarCollapsed && item.ancestorIds?.some((ancestorId) => collapsedSections[ancestorId])) {
                  return null;
                }

                // If non-leaf container section (Chapter or Sub-chapter group)
                if (!isLeaf) {
                  const isCollapsed = Boolean(collapsedSections[item.section.id]);
                  const childLeaves = leafSections.filter(
                    (leaf) => leaf.ancestorIds?.includes(item.section.id) || leaf.section.id === item.section.id
                  );
                  const childGenerated = childLeaves.filter((leaf) => hasContent(getChapter(leaf.section.id))).length;
                  const allChildrenDone = childLeaves.length > 0 && childLeaves.every((leaf) => getChapter(leaf.section.id)?.status === "completed");

                  if (sidebarCollapsed) {
                    if (item.level > 1) return null;
                    return (
                      <div
                        key={item.section.id}
                        className="w-full flex items-center justify-center py-2 text-primary my-1 cursor-pointer hover:bg-surface-container rounded-lg"
                        title={`Chapter ${item.number}: ${item.section.title}`}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center border",
                          allChildrenDone
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}>
                          <HugeiconsIcon
                            icon={allChildrenDone ? "checkmark-circle-02" : "menu-book"}
                            size={16}
                            strokeWidth={2}
                          />
                        </div>
                      </div>
                    );
                  }

                  // Top level Chapter container (Level 1)
                  if (item.level === 1) {
                    return (
                      <div
                        key={item.section.id}
                        onClick={() => toggleSectionCollapse(item.section.id)}
                        className="w-full flex items-center justify-between rounded-xl p-2.5 text-left bg-surface-container-low hover:bg-surface-container text-on-surface select-none mt-3 mb-1 border border-outline-variant/80 cursor-pointer transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 transition-all shadow-2xs",
                              allChildrenDone
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : childGenerated > 0
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : "bg-surface-container text-on-surface-variant/70 border-outline-variant/60"
                            )}
                          >
                            <HugeiconsIcon
                              icon={allChildrenDone ? "checkmark-circle-02" : "menu-book"}
                              size={15}
                              strokeWidth={2}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-primary">
                                Chapter {item.number}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold truncate text-on-surface group-hover:text-primary transition-colors leading-tight">
                              {item.section.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                              allChildrenDone
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-surface text-on-surface-variant border-outline-variant/60"
                            )}
                          >
                            {childGenerated}/{childLeaves.length}
                          </span>
                          <HugeiconsIcon
                            icon={isCollapsed ? "chevron-right" : "chevron-down"}
                            size={14}
                            strokeWidth={2}
                            className="text-on-surface-variant group-hover:text-primary transition-transform"
                          />
                        </div>
                      </div>
                    );
                  }

                  // Nested Sub-chapter Container (Level >= 2)
                  return (
                    <div
                      key={item.section.id}
                      className="relative ml-3 pl-2.5 border-l-2 border-primary/20 my-1"
                    >
                      <div
                        onClick={() => toggleSectionCollapse(item.section.id)}
                        className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-left bg-surface-container-lowest hover:bg-surface-container-low text-on-surface select-none border border-outline-variant/50 cursor-pointer transition-all group shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon="layers" size={11} strokeWidth={2} />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-primary shrink-0">
                            {item.number}
                          </span>
                          <span className="text-xs font-semibold truncate text-on-surface group-hover:text-primary transition-colors">
                            {item.section.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1.5">
                          <span className="text-[10px] font-mono text-on-surface-variant font-bold">
                            {childGenerated}/{childLeaves.length}
                          </span>
                          <HugeiconsIcon
                            icon={isCollapsed ? "chevron-right" : "chevron-down"}
                            size={13}
                            strokeWidth={2}
                            className="text-on-surface-variant group-hover:text-on-surface transition-transform"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Leaf Section (Draftable / Editable Section)
                return (
                  <SectionNavItem
                    key={item.section.id}
                    item={item}
                    chapter={chapter}
                    active={item.section.id === activeSectionId}
                    outdated={Boolean(chapter?.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint)}
                    isLeaf={isLeaf}
                    collapsed={sidebarCollapsed}
                    isGenerating={generating}
                    onClick={() => {
                      setActiveSectionId(item.section.id);
                      setActiveTab("rich");
                      window.history.replaceState({ activeSectionId: item.section.id }, "");
                    }}
                  />
                );
              })}

              {!sidebarCollapsed && flatSections.length > 0 && (
                <div className="mt-4 pt-3 border-t border-outline-variant/60 px-2 flex items-center justify-between text-[10px] font-semibold text-on-surface-variant/80">
                  <span className="flex items-center gap-1.5" title="Completed & Approved">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs" /> Done
                  </span>
                  <span className="flex items-center gap-1.5" title="Draft in progress">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-2xs" /> Drafted
                  </span>
                  <span className="flex items-center gap-1.5" title="Not started yet">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shadow-2xs" /> Empty
                  </span>
                  <span className="flex items-center gap-1.5" title="Earlier context updated">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-2xs" /> Outdated
                  </span>
                </div>
              )}
            </div>
          </aside>

          <main className="w-full rounded-2xl border border-outline-variant/80 bg-surface relative z-10 flex flex-col min-h-[620px] min-w-0 overflow-hidden shadow-2xs">
            {activeSectionId === "overview" ? (
              <ReportOverviewDashboard
                flatSections={flatSections}
                leafSections={leafSections}
                reportStructure={reportStructure}
                reportChapters={reportChapters}
                getChapter={getChapter}
                generatedCount={generatedCount}
                completedCount={completedCount}
                outdatedCount={outdatedCount}
                progressPercent={progressPercent}
                allGenerated={allGenerated}
                totalWords={totalWords}
                finalReport={finalReport}
                aiState={aiState}
                copied={copied}
                onCopy={handleCopy}
                onGenerateFinal={generateCompleteReport}
                onSelectSection={(id) => {
                  setActiveSectionId(id);
                  setActiveTab("rich");
                }}
                sourceFingerprint={sourceFingerprint}
              />
            ) : (
              <>
                <div className="p-4 sm:p-5 border-b border-outline-variant/80 bg-surface">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-on-surface mb-1">
                        <span className="font-mono text-primary">{activeFlatSection?.number}</span>
                        <span>•</span>
                        <span>Editable Subsection</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface break-words">
                        {activeFlatSection?.section.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <ChapterStatusBadge chapter={activeChapter} outdated={activeIsOutdated} isLeaf={activeIsLeaf} />
                      {activeIsLeaf && activeChapter && (
                        <button
                          onClick={() => updateChapter(activeChapter.sectionId, { status: activeChapter.status === "completed" ? "in-progress" : "completed" })}
                          disabled={!isAiIdle}
                          className={cn(
                            "h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                            activeChapter.status === "completed"
                              ? "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                              : "bg-secondary text-on-secondary border-secondary hover:opacity-90"
                          )}
                        >
                          <HugeiconsIcon icon={activeChapter.status === "completed" ? "undo" : "checkmark-circle-02"} size={15} strokeWidth={2} />
                          <span>{activeChapter.status === "completed" ? "Reopen Draft" : "Mark Complete"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {activeIsLeaf && (
                    <AiActionToolbar
                      onGenerate={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)}
                      onRefine={(instructions) => activeFlatSection && runChapterAction(activeFlatSection.section.id, "Rewrite Selection", activeChapter?.contentHtml, undefined, instructions)}
                      onTranslate={() => activeChapter && translateChapter(activeChapter.sectionId, activeChapter.contentHtml)}
                      isGenerating={currentSectionAiState === "generating"}
                      isRefining={currentSectionAiState === "refining"}
                      isTranslating={currentSectionAiState === "translating"}
                      isBusy={!isAiIdle}
                      canGenerate={true}
                      canRefine={hasContent(activeChapter)}
                      generateLabel={hasContent(activeChapter) ? "Regenerate with AI" : "Generate with AI"}
                      refineLabel="Refine with AI"
                      refinePlaceholder="Tell AI what to improve (e.g., expand technical methodologies, clarify phrasing)..."
                      showTranslate={shouldShowTranslate}
                      translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
                      className="mb-0 mt-2"
                      primaryAction={
                        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/80 w-fit">
                          {(Object.keys(detailLabels) as DetailLevel[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => setDetailLevel(level)}
                              className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                                detailLevel === level ? "bg-primary text-on-primary shadow-2xs" : "text-on-surface hover:text-primary hover:bg-surface"
                              )}
                            >
                              {detailLabels[level]}
                            </button>
                          ))}
                        </div>
                      }
                    />
                  )}

                  {activeIsLeaf && hasContent(activeChapter) && (
                    <div className="mt-3 pt-3 border-t border-outline-variant/60">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                          <HugeiconsIcon icon="tune" size={14} strokeWidth={2} className="text-primary" />
                          Quick Polish Actions
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {selectedText.trim() ? "Applies to highlighted selection" : "Applies to entire section"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ALL_AI_TOOLS.filter((t) => t.id !== "Improve Academic Style").map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => activeChapter && runChapterAction(activeChapter.sectionId, tool.id, activeChapter.contentHtml, selectedText)}
                            disabled={!activeChapter || !isAiIdle}
                            className="h-8 px-2.5 rounded-lg border border-outline-variant/70 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface hover:text-primary transition-all cursor-pointer disabled:opacity-40 shadow-2xs flex items-center gap-1.5 group"
                            title={selectedText ? `Apply ${tool.label} to selected passage` : tool.desc}
                          >
                            <HugeiconsIcon icon={tool.icon} size={14} strokeWidth={2} className={cn(tool.iconColor, "transition-transform group-hover:scale-110")} />
                            <span>{tool.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeIsLeaf && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {selectedText.trim() ? (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold text-xs">
                          <HugeiconsIcon icon="edit" size={14} strokeWidth={2} />
                          <span>Selection active ({selectedText.trim().split(/\s+/).filter(Boolean).length} words): Quick actions will update only the selection.</span>
                          <button
                            type="button"
                            onClick={() => {
                              window.getSelection()?.removeAllRanges();
                              setSelectedText("");
                            }}
                            className="ml-1 underline font-bold cursor-pointer hover:opacity-80"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant font-medium">Highlight any passage in the editor to refine or expand only that specific selection.</span>
                      )}
                      <span className="text-xs font-mono font-bold text-on-surface ml-auto">{countWords(activeChapter?.contentHtml || "")} words</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 border-b border-outline-variant/80 bg-surface">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {([
                      ["rich", "Rich Editor"],
                      ["markdown", "Markdown Source"],
                      ["latex", "LaTeX Source"],
                    ] as [StudioTab, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                          "py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                          activeTab === key ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {activeTab !== "rich" && (
                    <button
                      onClick={() => handleCopy(activeTab === "markdown" ? currentMarkdown : currentLatex, activeTab)}
                      className="h-7 px-2.5 rounded-md border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <HugeiconsIcon icon={copied === activeTab ? "checkmark-circle-02" : "copy"} size={13} strokeWidth={2} />
                      <span>{copied === activeTab ? "Copied" : "Copy Code"}</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto bg-surface-container-lowest">
                  {!hasContent(activeChapter) ? (
                    <EmptyChapter
                      detailLevel={detailLevel}
                      disabled={!activeFlatSection || !activeIsLeaf || !isAiIdle}
                      loading={currentSectionAiState === "generating"}
                      onGenerate={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)}
                    />
                  ) : activeTab === "rich" ? (
                    <RichChapterEditor
                      key={activeChapter?.sectionId}
                      content={activeChapter?.contentHtml || ""}
                      disabled={!isAiIdle}
                      aiState={currentSectionAiState}
                      onChange={handleEditorChange}
                      onSelectionChange={setSelectedText}
                      onAiAction={async (action, instructions) => {
                        if (!activeChapter) return;
                        await runChapterAction(activeChapter.sectionId, action, activeChapter.contentHtml, selectedText, instructions);
                      }}
                    />
                  ) : (
                    <SourcePreview value={activeTab === "markdown" ? currentMarkdown : currentLatex} dark={activeTab === "latex"} />
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function SectionNavItem({
  item,
  chapter,
  active,
  outdated,
  isLeaf,
  collapsed = false,
  isGenerating = false,
  onClick,
}: {
  item: FlatReportSection;
  chapter?: ReportChapter;
  active: boolean;
  outdated: boolean;
  isLeaf: boolean;
  collapsed?: boolean;
  isGenerating?: boolean;
  onClick: () => void;
}) {
  const generated = hasContent(chapter);
  const isCompleted = chapter?.status === "completed";
  const wordCount = countWords(chapter?.contentHtml || "");

  // Status configuration: icon, color, badge bg
  const statusConfig = isGenerating
    ? {
        icon: "sync-alt",
        iconClass: "text-primary animate-spin",
        badgeClass: "bg-primary/10 text-primary border-primary/25",
        label: "Generating draft...",
      }
    : outdated
      ? {
          icon: "alert-circle",
          iconClass: "text-amber-600 dark:text-amber-400",
          badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          label: "Outdated",
        }
      : isCompleted
        ? {
            icon: "checkmark-circle-02",
            iconClass: "text-emerald-600 dark:text-emerald-400",
            badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
            label: "Completed",
          }
        : generated
          ? {
              icon: "edit",
              iconClass: "text-blue-600 dark:text-blue-400",
              badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
              label: "Drafted",
            }
          : {
              icon: "document-validation",
              iconClass: "text-on-surface-variant/70",
              badgeClass: "bg-surface-container text-on-surface-variant/70 border-outline-variant/60",
              label: "Not started",
            };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all border cursor-pointer my-1 group shadow-2xs",
          isGenerating && "ring-2 ring-primary/30 bg-primary/10",
          active
            ? "bg-primary text-on-primary border-primary shadow-xs"
            : "text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface"
        )}
        title={`${item.number} ${item.section.title} (${statusConfig.label})`}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
            active ? "bg-white/20 text-white border-white/30" : statusConfig.badgeClass
          )}
        >
          <HugeiconsIcon
            icon={statusConfig.icon}
            size={14}
            strokeWidth={2}
            className={active ? "text-white" : statusConfig.iconClass}
          />
        </div>
        <span className={cn("text-[9px] font-mono font-bold mt-1", active ? "text-on-primary" : "text-primary")}>
          {item.number}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center group/navitem my-0.5",
        item.level > 1 && "ml-3 pl-2.5 border-l-2 border-outline-variant/40 hover:border-primary/40 transition-colors"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all border cursor-pointer group shadow-2xs min-w-0",
          isGenerating && "bg-primary/10 border-primary/30 text-primary",
          active
            ? "bg-primary text-on-primary border-primary font-bold shadow-xs ring-2 ring-primary/25"
            : "text-on-surface border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container hover:border-outline-variant/80"
        )}
      >
        {/* Status Icon Badge */}
        <div
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-all shadow-2xs",
            active ? "bg-white/20 text-white border-white/30" : statusConfig.badgeClass
          )}
          title={statusConfig.label}
        >
          <HugeiconsIcon
            icon={statusConfig.icon}
            size={13}
            strokeWidth={2.2}
            className={active ? "text-white" : statusConfig.iconClass}
          />
        </div>

        {/* Section Number */}
        <span
          className={cn(
            "font-mono text-xs font-bold shrink-0",
            active ? "text-on-primary" : "text-primary/90"
          )}
        >
          {item.number}
        </span>

        {/* Section Title */}
        <span
          className={cn(
            "text-xs truncate flex-1",
            active ? "text-on-primary font-bold" : "text-on-surface font-medium group-hover:text-primary transition-colors"
          )}
        >
          {item.section.title}
        </span>

        {/* Word count or active ping */}
        {isGenerating ? (
          <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0 ml-1" title="Generating draft..." />
        ) : generated && !active ? (
          <span className="text-[10px] font-mono text-on-surface-variant/70 shrink-0 hidden sm:inline-block">
            {wordCount}w
          </span>
        ) : null}
      </button>
    </div>
  );
}

function ChapterStatusBadge({ chapter, outdated, isLeaf }: { chapter?: ReportChapter; outdated: boolean; isLeaf: boolean }) {
  if (!isLeaf) {
    return <Badge icon="layers" label="Chapter Container" className="bg-primary/10 text-primary border-primary/25" />;
  }
  if (outdated) {
    return <Badge icon="alert-circle" label="Sync Outdated" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" />;
  }
  if (chapter?.status === "completed") {
    return <Badge icon="checkmark-circle-02" label="Completed" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" />;
  }
  if (hasContent(chapter)) {
    return <Badge icon="edit" label="Draft in Progress" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" />;
  }
  return <Badge icon="document-validation" label="Not Drafted" className="bg-surface-container text-on-surface-variant/80 border-outline-variant/70" />;
}

function Badge({ icon, label, className }: { icon: string; label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-2xs", className)}>
      <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
}

function EmptyChapter({
  detailLevel,
  disabled,
  loading,
  onGenerate,
}: {
  detailLevel: DetailLevel;
  disabled: boolean;
  loading: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[460px]">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
        <HugeiconsIcon icon="edit" size={28} strokeWidth={1.8} />
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-1">No draft generated for this section yet</h3>
      <p className="text-xs text-on-surface-variant max-w-sm mb-6 leading-relaxed">
        Generate your first academic draft with AI using the project context and all completed workflow steps.
      </p>
      <button
        onClick={onGenerate}
        disabled={disabled}
        className="h-10 px-5 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
      >
        <HugeiconsIcon icon={loading ? "sync-alt" : "edit"} size={15} strokeWidth={2} className={loading ? "animate-spin" : undefined} />
        <span>{loading ? "Generating Draft..." : `Generate ${detailLabels[detailLevel]} Draft`}</span>
      </button>
    </div>
  );
}

function RichChapterEditor({
  content,
  disabled,
  aiState,
  onChange,
  onSelectionChange,
  onAiAction,
}: {
  content: string;
  disabled: boolean;
  aiState: AiState;
  onChange: (html: string) => void;
  onSelectionChange: (text: string) => void;
  onAiAction: (action: AiAction, instructions?: string) => Promise<void>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);
  const [currentSelectedText, setCurrentSelectedText] = useState("");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current?.innerHTML || "");
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(editorRef.current?.innerHTML || "");
  };

  const isToolbarInteractingRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);

  const calculatePos = useCallback((sel: Selection) => {
    if (!containerRef.current || sel.rangeCount === 0) return;
    try {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      if (rect.width > 0 || rect.height > 0) {
        const toolbarEstimatedWidth = 440;
        const spaceAbove = rect.top - containerRect.top;

        // Position above selection if space permits, otherwise below
        const top = spaceAbove > 52 ? spaceAbove - 46 : rect.bottom - containerRect.top + 8;

        // Clamp horizontally within container bounds
        const selectionCenter = rect.left - containerRect.left + (rect.width / 2);
        const maxLeft = Math.max(8, containerRect.width - toolbarEstimatedWidth - 8);
        const left = Math.max(8, Math.min(maxLeft, selectionCenter - (toolbarEstimatedWidth / 2)));

        setFloatingPos({ top, left });
      }
    } catch {
      setFloatingPos(null);
    }
  }, []);

  useEffect(() => {
    const handleSelectionUpdate = () => {
      if (isToolbarInteractingRef.current) {
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setCurrentSelectedText("");
        onSelectionChange("");
        setFloatingPos(null);
        return;
      }

      if (editorRef.current && (editorRef.current.contains(sel.anchorNode) || editorRef.current.contains(sel.focusNode))) {
        const text = sel.toString();
        if (text.trim()) {
          setCurrentSelectedText(text);
          onSelectionChange(text);
          calculatePos(sel);
        } else {
          setCurrentSelectedText("");
          onSelectionChange("");
          setFloatingPos(null);
        }
      } else {
        setCurrentSelectedText("");
        onSelectionChange("");
        setFloatingPos(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionUpdate);
    document.addEventListener("mouseup", handleSelectionUpdate);
    document.addEventListener("keyup", handleSelectionUpdate);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionUpdate);
      document.removeEventListener("mouseup", handleSelectionUpdate);
      document.removeEventListener("keyup", handleSelectionUpdate);
    };
  }, [calculatePos, onSelectionChange]);

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-outline-variant/80 overflow-visible bg-surface shadow-2xs transition-all">
      {aiState !== "idle" && (
        <div className="absolute top-0 inset-x-0 z-30 overflow-hidden rounded-t-2xl">
          <div className="h-1 w-full bg-primary/15 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: "40%",
                animation: "report-studio-indeterminate 1.4s ease-in-out infinite",
              }}
            />
          </div>
          <div className="bg-primary-container/90 backdrop-blur-sm border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs font-bold text-primary">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {aiState === "generating"
                ? "AI is drafting chapter section..."
                : aiState === "refining"
                  ? "AI is refining content..."
                  : aiState === "translating"
                    ? "AI is translating chapter..."
                    : "AI is rewriting selection..."}
            </span>
            <span className="text-[11px] font-normal text-on-surface-variant flex items-center gap-1">
              <HugeiconsIcon icon="info" size={13} strokeWidth={2} className="text-primary" />
              Background Task Active
            </span>
          </div>
        </div>
      )}

      {floatingPos && currentSelectedText.trim() && (
        <FloatingSelectionAiBar
          position={floatingPos}
          selectedText={currentSelectedText}
          disabled={disabled || aiState !== "idle"}
          aiState={aiState}
          onInteractStart={() => {
            isToolbarInteractingRef.current = true;
          }}
          onInteractEnd={() => {
            isToolbarInteractingRef.current = false;
          }}
          onAction={async (action, instructions) => {
            isToolbarInteractingRef.current = false;
            await onAiAction(action, instructions);
            setFloatingPos(null);
          }}
          onClose={() => {
            isToolbarInteractingRef.current = false;
            setFloatingPos(null);
            window.getSelection()?.removeAllRanges();
            setCurrentSelectedText("");
            onSelectionChange("");
          }}
        />
      )}

      <div className="flex flex-wrap gap-1 p-2 border-b border-outline-variant/80 bg-surface">
        <ToolbarButton label="Bold" onClick={() => exec("bold")} disabled={disabled}>
          <span className="font-bold text-xs">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")} disabled={disabled}>
          <span className="italic text-xs font-serif">I</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 2" onClick={() => exec("formatBlock", "h2")} disabled={disabled}>
          <span className="font-bold text-xs">H2</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => exec("formatBlock", "h3")} disabled={disabled}>
          <span className="font-bold text-xs">H3</span>
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")} disabled={disabled}>
          <HugeiconsIcon icon="list-ordered" size={15} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton label="Code block" onClick={() => insertHtml("<pre><code>// Code snippet</code></pre>")} disabled={disabled}>
          <HugeiconsIcon icon="code" size={15} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton label="Table" onClick={() => insertHtml("<table><caption>Table: Caption</caption><tbody><tr><th>Element</th><th>Description</th></tr><tr><td>...</td><td>...</td></tr></tbody></table>")} disabled={disabled}>
          <HugeiconsIcon icon="layers" size={15} strokeWidth={2} />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="report-rich-editor min-h-[520px] px-6 py-7 outline-none text-on-surface leading-relaxed bg-surface focus:ring-2 focus:ring-primary/20 overflow-x-auto rounded-b-2xl"
      />
    </div>
  );
}

function FloatingSelectionAiBar({
  position,
  selectedText,
  disabled,
  aiState,
  onInteractStart,
  onInteractEnd,
  onAction,
  onClose,
}: {
  position: { top: number; left: number };
  selectedText: string;
  disabled: boolean;
  aiState: AiState;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  onAction: (action: AiAction, instructions?: string) => void;
  onClose: () => void;
}) {
  const [pinnedToolIds, setPinnedToolIds] = useState<AiAction[]>(() => {
    try {
      const saved = localStorage.getItem("report_studio_pinned_tools");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return DEFAULT_PINNED_TOOLS;
  });

  const [moreOpen, setMoreOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = selectedText.trim().split(/\s+/).filter(Boolean).length;

  const togglePin = (toolId: AiAction, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedToolIds((prev) => {
      const next = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      const final = next.length > 0 ? next : DEFAULT_PINNED_TOOLS;
      try {
        localStorage.setItem("report_studio_pinned_tools", JSON.stringify(final));
      } catch { }
      return final;
    });
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customPrompt.trim()) return;
    onAction("Rewrite Selection", customPrompt.trim());
    setCustomOpen(false);
    setCustomPrompt("");
  };

  useEffect(() => {
    if (customOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [customOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  const pinnedTools = ALL_AI_TOOLS.filter((t) => pinnedToolIds.includes(t.id));

  return (
    <div
      ref={barRef}
      onMouseDown={(e) => {
        // Prevent selection loss when clicking inside the toolbar or typing
        e.stopPropagation();
      }}
      className={cn(
        "absolute z-50 transition-all duration-200 ease-out pointer-events-auto",
        customOpen ? "w-[min(480px,calc(100%-16px))]" : "max-w-[calc(100%-16px)]"
      )}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex flex-col rounded-xl border border-outline-variant/80 bg-surface-bright/95 backdrop-blur-md p-1.5 shadow-2xl ring-1 ring-black/5 overflow-hidden transition-all duration-200">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Clean word count badge */}
          <span className="px-2 py-1 text-[11px] font-mono font-semibold text-on-surface-variant bg-surface-container rounded-md shrink-0 select-none">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>

          <div className="h-4 w-px bg-outline-variant mx-0.5 shrink-0" />

          {/* Pinned Quick Action Buttons */}
          {pinnedTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onAction(tool.id)}
              disabled={disabled}
              className="h-8 px-2.5 rounded-lg border border-outline-variant/70 bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface hover:text-primary transition-all disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs group"
              title={tool.desc}
            >
              <HugeiconsIcon icon={tool.icon} size={14} strokeWidth={2} className={cn(tool.iconColor, "transition-transform group-hover:scale-110")} />
              <span>{tool.label}</span>
            </button>
          ))}

          {/* More Tools (+) Button */}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(!moreOpen);
              if (!moreOpen) setCustomOpen(false);
            }}
            disabled={disabled}
            className={cn(
              "h-8 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer shrink-0",
              moreOpen ? "bg-primary/10 text-primary border border-primary/20" : "text-on-surface hover:text-primary hover:bg-surface-container border border-outline-variant/60"
            )}
            title="More AI tools & customize toolbar"
          >
            <HugeiconsIcon icon="plus" size={15} strokeWidth={2} />
          </button>

          {/* Custom Instruct Button */}
          <button
            type="button"
            onClick={() => {
              setCustomOpen(!customOpen);
              if (!customOpen) setMoreOpen(false);
            }}
            disabled={disabled}
            className={cn(
              "h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0",
              customOpen ? "bg-primary text-on-primary shadow-2xs" : "text-on-surface hover:text-primary hover:bg-surface-container border border-outline-variant/60"
            )}
            title="Give specific custom instructions for this selection"
          >
            <HugeiconsIcon icon="edit" size={14} strokeWidth={2} />
            <span>Instruct</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors ml-auto cursor-pointer shrink-0"
            title="Dismiss selection"
          >
            <HugeiconsIcon icon="close" size={14} strokeWidth={2} />
          </button>
        </div>

        {/* More Tools & Pin Manager Popover */}
        {moreOpen && (
          <div className="mt-2 pt-2 border-t border-outline-variant max-h-56 overflow-y-auto divide-y divide-outline-variant/40 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-2 py-1 text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
              <span>All AI Selection Tools</span>
              <span className="text-[10px] lowercase font-normal text-on-surface-variant">Click tool to run • Pin to toolbar</span>
            </div>
            {ALL_AI_TOOLS.map((tool) => {
              const isPinned = pinnedToolIds.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    onAction(tool.id);
                    setMoreOpen(false);
                  }}
                  className="px-2.5 py-1.5 flex items-center justify-between gap-3 hover:bg-surface-container cursor-pointer rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-surface-container border border-outline-variant/60 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={tool.icon} size={13} strokeWidth={2} className={tool.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-on-surface block truncate group-hover:text-primary transition-colors">{tool.label}</span>
                      <span className="text-[11px] text-on-surface-variant block truncate">{tool.desc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => togglePin(tool.id, e)}
                    className={cn(
                      "p-1 rounded-md text-xs transition-colors shrink-0 cursor-pointer",
                      isPinned
                        ? "text-primary bg-primary/15 hover:bg-primary/25"
                        : "text-on-surface-variant opacity-40 group-hover:opacity-100 hover:text-primary hover:bg-surface-container"
                    )}
                    title={isPinned ? "Unpin from toolbar" : "Pin to toolbar"}
                  >
                    <HugeiconsIcon icon={isPinned ? "checkmark-circle-02" : "plus"} size={14} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Full-width smooth expanded prompt textarea */}
        {customOpen && (
          <div
            className="mt-2 pt-2 border-t border-outline-variant/70 flex flex-col gap-2 px-1 overflow-hidden"
            style={{ animation: "report-builder-expand-down 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <textarea
              ref={textareaRef}
              value={customPrompt}
              onFocus={() => onInteractStart?.()}
              onBlur={() => onInteractEnd?.()}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  onInteractEnd?.();
                  handleCustomSubmit();
                } else if (e.key === "Escape") {
                  onInteractEnd?.();
                  setCustomOpen(false);
                }
              }}
              placeholder="How should AI refine this selection? (e.g. simplify explanation, add technical detail...)"
              rows={3}
              className="w-full resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-on-surface-variant/70 font-mono">
                Ctrl+Enter to apply
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onInteractEnd?.();
                    setCustomOpen(false);
                    setCustomPrompt("");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInteractEnd?.();
                    handleCustomSubmit();
                  }}
                  disabled={!customPrompt.trim() || disabled}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="h-8 min-w-[32px] px-2 rounded-lg flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container transition-all disabled:opacity-40 cursor-pointer shadow-2xs border border-outline-variant/60 bg-surface"
    >
      {children}
    </button>
  );
}

function SourcePreview({ value, dark = false }: { value: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5 min-h-[520px] overflow-auto border shadow-2xs", dark ? "bg-[#1e293b] border-[#334155]" : "bg-surface border-outline-variant/80")}>
      <pre className={cn("font-mono text-xs leading-relaxed whitespace-pre-wrap", dark ? "text-[#f8fafc]" : "text-on-surface")}>
        {value || "No source generated yet."}
      </pre>
    </div>
  );
}

function countWords(html = "") {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function hasContent(chapter?: ReportChapter) {
  return Boolean(chapter?.contentHtml?.replace(/<[^>]*>/g, " ").trim());
}

function isLeafSection(item: FlatReportSection) {
  return !item.section.children?.length;
}

function ReportOverviewDashboard({
  flatSections,
  leafSections,
  reportStructure,
  reportChapters,
  getChapter,
  generatedCount,
  completedCount,
  outdatedCount,
  progressPercent,
  allGenerated,
  totalWords,
  finalReport,
  aiState,
  copied,
  onCopy,
  onGenerateFinal,
  onSelectSection,
  sourceFingerprint,
}: {
  flatSections: FlatReportSection[];
  leafSections: FlatReportSection[];
  reportStructure: ReportSection[];
  reportChapters: ReportChapter[];
  getChapter: (id: string) => ReportChapter | undefined;
  generatedCount: number;
  completedCount: number;
  outdatedCount: number;
  progressPercent: number;
  allGenerated: boolean;
  totalWords: number;
  finalReport: FinalReport | null;
  aiState: AiState;
  copied: StudioTab | "final" | null;
  onCopy: (value: string, key: StudioTab | "final") => void;
  onGenerateFinal: () => void;
  onSelectSection: (sectionId: string) => void;
  sourceFingerprint: string;
}) {
  const [collapsedOverviewChapters, setCollapsedOverviewChapters] = useState<Record<string, boolean>>({});

  const nextPendingSection =
    leafSections.find((item) => !hasContent(getChapter(item.section.id))) ||
    leafSections.find((item) => getChapter(item.section.id)?.status !== "completed");

  const estimatedReadMinutes = Math.max(1, Math.round(totalWords / 200));
  const topLevelSections = useMemo(() => flatSections.filter((item) => item.level === 1), [flatSections]);

  const toggleChapter = (chapterId: string) => {
    setCollapsedOverviewChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-6 p-6 sm:p-8 overflow-y-auto bg-surface-container-lowest">
      {/* Top Banner Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-outline-variant/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              Thesis Compilation Hub
            </span>
            <span className="text-xs text-on-surface font-semibold">
              {topLevelSections.length} Chapters • {leafSections.length} Subsections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
            Academic Report Progress
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {nextPendingSection && (
            <button
              onClick={() => onSelectSection(nextPendingSection.section.id)}
              className="h-9 px-3.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all shadow-2xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <HugeiconsIcon icon="edit" size={14} strokeWidth={2} />
              <span>Resume Drafting ({nextPendingSection.number})</span>
            </button>
          )}
          <button
            onClick={onGenerateFinal}
            disabled={!allGenerated || aiState !== "idle"}
            className={cn(
              "h-9 px-3.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
              allGenerated
                ? "bg-secondary text-on-secondary hover:bg-secondary/90"
                : "bg-surface text-on-surface border border-outline-variant"
            )}
          >
            <HugeiconsIcon icon={aiState === "finalizing" ? "sync-alt" : "book-open"} size={14} strokeWidth={2} className={aiState === "finalizing" ? "animate-spin" : undefined} />
            <span>{aiState === "finalizing" ? "Compiling..." : "Compile Complete Report"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Drafts */}
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface/80 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70">Drafted Sections</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <HugeiconsIcon icon="document" size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">{generatedCount}</span>
            <span className="text-xs text-on-surface-variant font-medium">/ {leafSections.length}</span>
            <span className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Completed */}
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface/80 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70">Approved & Done</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <HugeiconsIcon icon="checkmark-circle-02" size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">{completedCount}</span>
            <span className="text-xs text-on-surface-variant font-medium">/ {leafSections.length}</span>
            <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {leafSections.length ? Math.round((completedCount / leafSections.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${leafSections.length ? (completedCount / leafSections.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Outdated */}
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface/80 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70">Sync Health</span>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center border",
              outdatedCount > 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            )}>
              <HugeiconsIcon icon={outdatedCount > 0 ? "alert-circle" : "checkmark-circle-02"} size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold font-mono tracking-tight", outdatedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
              {outdatedCount}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">outdated</span>
            <span className={cn(
              "ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
              outdatedCount > 0 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            )}>
              {outdatedCount > 0 ? "Re-sync" : "Synced"}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-3 truncate font-medium">
            {outdatedCount > 0 ? "Earlier project data updated" : "All chapters up to date"}
          </p>
        </div>

        {/* Metric 4: Total Volume */}
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface/80 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/70">Total Volume</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
              <HugeiconsIcon icon="menu-book" size={15} strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-400">
              {totalWords.toLocaleString()}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">words</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-3 truncate font-medium">
            ~{estimatedReadMinutes} min reading time
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start min-w-0 w-full">
        {/* Left: Structured Chapter Matrix */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface/80 flex items-center gap-2">
              <HugeiconsIcon icon="list-ordered" size={15} strokeWidth={2} className="text-primary" />
              <span>Chapter Breakdown & Matrix</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              Click any section to edit
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {topLevelSections.map((topItem) => {
              const isCollapsed = Boolean(collapsedOverviewChapters[topItem.section.id]);
              const childLeaves = leafSections.filter(
                (leaf) => leaf.ancestorIds?.includes(topItem.section.id) || leaf.section.id === topItem.section.id
              );
              const childGenerated = childLeaves.filter((leaf) => hasContent(getChapter(leaf.section.id))).length;
              const childCompleted = childLeaves.filter((leaf) => getChapter(leaf.section.id)?.status === "completed").length;
              const childPercent = childLeaves.length ? Math.round((childGenerated / childLeaves.length) * 100) : 0;

              return (
                <div
                  key={topItem.section.id}
                  className="rounded-2xl border border-outline-variant/80 bg-surface overflow-hidden shadow-2xs"
                >
                  {/* Chapter Header Banner */}
                  <div
                    onClick={() => toggleChapter(topItem.section.id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-container/50 transition-colors border-b border-outline-variant/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HugeiconsIcon
                        icon={childPercent === 100 ? "checkmark-circle-02" : "layers"}
                        size={18}
                        strokeWidth={2}
                        className={childPercent === 100 ? "text-secondary" : "text-primary"}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary font-mono">
                            Chapter {topItem.number}
                          </span>
                          <span className="text-xs text-on-surface-variant">•</span>
                          <span className="text-xs text-on-surface font-semibold">
                            {childGenerated}/{childLeaves.length} Drafted
                          </span>
                          {childCompleted === childLeaves.length && childLeaves.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 uppercase">
                              Complete
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-on-surface truncate mt-0.5">
                          {topItem.section.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-on-surface font-mono">{childPercent}%</span>
                        <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${childPercent}%` }} />
                        </div>
                      </div>
                      <HugeiconsIcon icon={isCollapsed ? "chevron-down" : "chevron-up"} size={16} strokeWidth={2} className="text-on-surface-variant" />
                    </div>
                  </div>

                  {/* Subsection Clean Table Rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-outline-variant/40">
                      {childLeaves.map((leaf) => {
                        const chapter = getChapter(leaf.section.id);
                        const isGen = hasContent(chapter);
                        const isComp = chapter?.status === "completed";
                        const isOut = Boolean(chapter?.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint);
                        const wordCount = countWords(chapter?.contentHtml || "");

                        return (
                          <div
                            key={leaf.section.id}
                            onClick={() => onSelectSection(leaf.section.id)}
                            className="p-3 sm:px-5 flex items-center justify-between gap-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 transition-all shadow-2xs",
                                  isOut
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                    : isComp
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : isGen
                                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                        : "bg-surface-container text-on-surface-variant/70 border-outline-variant/60"
                                )}
                              >
                                <HugeiconsIcon
                                  icon={isOut ? "alert-circle" : isComp ? "checkmark-circle-02" : isGen ? "edit" : "document-validation"}
                                  size={15}
                                  strokeWidth={2}
                                />
                              </div>

                              <div className="flex items-baseline gap-2.5 min-w-0 flex-1">
                                <span className="text-xs font-bold text-primary font-mono shrink-0">
                                  {leaf.number}
                                </span>
                                <span className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                                  {leaf.section.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {isGen && (
                                <span className="hidden md:inline-block text-[11px] text-on-surface-variant font-mono">
                                  {wordCount} words
                                </span>
                              )}

                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                                  isOut
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                    : isComp
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                      : isGen
                                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                        : "bg-surface-container text-on-surface-variant/80 border-outline-variant/70"
                                )}
                              >
                                {isOut ? "Outdated" : isComp ? "Done" : isGen ? "Drafted" : "Empty"}
                              </span>

                              <HugeiconsIcon icon="chevron-right" size={14} strokeWidth={2} className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Assembly & Quick Controls */}
        <div className="flex flex-col gap-4">
          {/* Compilation Hub Card */}
          <div className="p-5 rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HugeiconsIcon icon="checkmark-circle-02" size={18} strokeWidth={2} className="text-secondary" />
                <h3 className="text-sm font-bold text-on-surface">Final Thesis Compilation</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Assemble and export your full academic document with table of contents and LaTeX source.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest flex items-center justify-between text-xs font-semibold">
              <span className="text-on-surface">Thesis Status</span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  allGenerated ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-surface-container text-on-surface-variant"
                )}
              >
                {allGenerated ? "Ready to Compile" : `${generatedCount}/${leafSections.length} Drafted`}
              </span>
            </div>

            <button
              onClick={onGenerateFinal}
              disabled={!allGenerated || aiState !== "idle"}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                allGenerated
                  ? "bg-primary text-on-primary hover:bg-primary/90"
                  : "bg-surface-container text-on-surface-variant border border-outline-variant"
              )}
            >
              <HugeiconsIcon icon={aiState === "finalizing" ? "sync-alt" : "book-open"} size={15} strokeWidth={2} className={aiState === "finalizing" ? "animate-spin" : undefined} />
              <span>{aiState === "finalizing" ? "Compiling..." : finalReport?.contentMarkdown ? "Recompile Full Report" : "Compile Full Report"}</span>
            </button>

            {finalReport?.contentMarkdown && (
              <div className="pt-3 border-t border-outline-variant/80 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <HugeiconsIcon icon="checkmark-circle-02" size={14} strokeWidth={2} />
                  Report Ready for Export
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onCopy(finalReport.contentMarkdown || "", "final")}
                    className="py-2 px-3 rounded-lg border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <HugeiconsIcon icon={copied === "final" ? "checkmark-circle-02" : "copy"} size={13} strokeWidth={2} className="text-primary" />
                    <span>{copied === "final" ? "Copied" : "Markdown"}</span>
                  </button>
                  <button
                    onClick={() => onCopy(finalReport.contentLatex || markdownToLatex(finalReport.contentMarkdown || ""), "final")}
                    className="py-2 px-3 rounded-lg border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <HugeiconsIcon icon={copied === "final" ? "checkmark-circle-02" : "code"} size={13} strokeWidth={2} className="text-primary" />
                    <span>{copied === "final" ? "Copied" : "LaTeX"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
