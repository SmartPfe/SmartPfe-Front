import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
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
import { ReportSection } from "../../ReportStructure/hooks/useReportStructure";

type StudioTab = "rich" | "markdown" | "latex";

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

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
}

export const ALL_AI_TOOLS: ToolConfig[] = [
  { id: "Rewrite Selection", label: "Rephrase", shortLabel: "Rephrase", icon: "sync_alt", desc: "Rephrase and polish this text with alternative wording" },
  { id: "Expand", label: "Expand", shortLabel: "Expand", icon: "format_align_left", desc: "Add more depth and technical detail" },
  { id: "Shorten", label: "Shorten", shortLabel: "Shorten", icon: "format_align_center", desc: "Make more concise and clear" },
  { id: "Make More Technical", label: "More Technical", shortLabel: "Technical", icon: "terminal", desc: "Incorporate deeper technical phrasing" },
  { id: "Simplify", label: "Simplify", shortLabel: "Simplify", icon: "auto_fix_high", desc: "Clarify complex or convoluted points" },
  { id: "Improve Grammar", label: "Fix Grammar", shortLabel: "Grammar", icon: "spellcheck", desc: "Fix grammar, spelling, and flow" },
  { id: "Explain Better", label: "Explain Better", shortLabel: "Explain", icon: "psychology", desc: "Elaborate with intuitive clarity" },
  { id: "Continue Writing", label: "Continue Writing", shortLabel: "Continue", icon: "arrow_forward", desc: "Continue generating the next section" },
  { id: "Improve Academic Style", label: "Academic Style", shortLabel: "Academic", icon: "school", desc: "Refine tone into formal academic standard" },
];

const DEFAULT_PINNED_TOOLS: AiAction[] = [
  "Rewrite Selection",
  "Expand",
  "Shorten",
  "Make More Technical",
];

const actionConfigMap = new Map(ALL_AI_TOOLS.map((tool) => [tool.id, tool]));

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

  const [activeSectionId, setActiveSectionId] = useState("overview");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("standard");
  const [activeTab, setActiveTab] = useState<StudioTab>("rich");
  const [selectedText, setSelectedText] = useState("");
  const [copied, setCopied] = useState<StudioTab | "final" | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstructions, setRefineInstructions] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const refinePopoverRef = useRef<HTMLDivElement>(null);

  const leafSections = useMemo(() => flatSections.filter((item) => isLeafSection(item)), [flatSections]);

  useEffect(() => {
    if (activeSectionId === "overview") return;
    const isCurrentActiveLeaf = activeSectionId && leafSections.some((item) => item.section.id === activeSectionId);
    if (!isCurrentActiveLeaf && leafSections.length > 0) {
      setActiveSectionId("overview");
    }
  }, [activeSectionId, leafSections]);

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
  const isAiIdle = aiState === "idle";
  const reportStructureLanguage = normalizeLanguage((project as any)?.reportStructureLanguage);
  const activeChapterLanguage = normalizeLanguage(activeChapter?.language || reportStructureLanguage);
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (refinePopoverRef.current && !refinePopoverRef.current.contains(event.target as Node)) {
        setRefineOpen(false);
      }
    };

    if (refineOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [refineOpen]);

  useEffect(() => {
    if (aiState !== "idle" || !activeChapter || !hasContent(activeChapter)) {
      setRefineOpen(false);
    }
  }, [activeChapter, aiState]);

  const handleRefineSubmit = async () => {
    if (!activeChapter) return;
    await runChapterAction(
      activeChapter.sectionId,
      "Improve Academic Style",
      activeChapter.contentHtml,
      selectedText,
      refineInstructions
    );
    setRefineInstructions("");
    setRefineOpen(false);
  };

  const handleEditorChange = (html: string) => {
    if (!activeFlatSection) return;
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
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading AI Report Studio...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            AI Report Studio
            <InfoTooltip label="Report" tooltip="Generate and edit your final PFE report chapter by chapter from the approved report structure." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[48rem]">
            Transform your structured project work into academic report chapters while keeping full control over every paragraph.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className={`text-label-sm transition-colors ${saveStatus === "saving" ? "text-on-surface-variant" :
              saveStatus === "saved" ? "text-secondary" :
                "text-error"
            }`}>
            {saveStatus === "saving" ? "Autosaving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
          </span>
          <style>{`
            @keyframes report-builder-popover-in {
              from { opacity: 0; transform: translateY(-4px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes report-builder-expand-down {
              from {
                opacity: 0;
                transform: translateY(-8px);
                max-height: 0;
              }
              to {
                opacity: 1;
                transform: translateY(0);
                max-height: 220px;
              }
            }
            @keyframes report-studio-indeterminate {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(120%); }
              100% { transform: translateX(250%); }
            }
          `}</style>
          <button onClick={() => saveReportChapters(reportChapters, true)} disabled={saveStatus === "saving" || aiState !== "idle"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {flatSections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-outline-variant bg-surface py-16 px-6 text-center">
          <span className="material-symbols-outlined text-[42px] text-primary mb-4">account_tree</span>
          <h2 className="text-headline-md text-on-surface mb-2">Report structure required</h2>
          <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
            Create or generate the Report Structure first. The Studio writes chapters from that table of contents so the final report stays coherent.
          </p>
        </div>
      ) : (
        <div className={cn(
          "w-full grid gap-md min-h-[calc(100dvh-250px)] min-w-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed
            ? "grid-cols-1 xl:grid-cols-[68px_minmax(0,1fr)]"
            : "grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)]"
        )}>
          <aside className={cn(
            "rounded-xl border border-outline-variant bg-surface overflow-hidden flex flex-col min-h-[420px] xl:min-h-0 min-w-0 transition-all duration-300",
            sidebarCollapsed && "items-center"
          )}>
            <div className={cn(
              "p-3.5 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-2 w-full",
              sidebarCollapsed ? "justify-center px-2" : "justify-between"
            )}>
              {!sidebarCollapsed && (
                <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Report Structure</h2>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {sidebarCollapsed ? "dock_to_right" : "dock_to_left"}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 w-full">
              <button
                onClick={() => setActiveSectionId("overview")}
                className={cn(
                  "w-full flex items-center rounded-lg transition-colors border mb-2 cursor-pointer",
                  sidebarCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2.5 text-left",
                  activeSectionId === "overview"
                    ? "bg-primary-container/80 text-primary font-bold border-primary/30 shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-on-surface border-outline-variant/60"
                )}
                title={sidebarCollapsed ? `Report Overview (${progressPercent}%)` : undefined}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 text-primary">space_dashboard</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="text-body-sm font-semibold truncate flex-1">Report Overview</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold",
                      activeSectionId === "overview" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {progressPercent}%
                    </span>
                  </>
                )}
              </button>

              {!sidebarCollapsed && (
                <div className="px-2 pt-2 pb-1 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">
                  Chapters & Sections
                </div>
              )}

              {flatSections.map((item) => {
                const chapter = getChapter(item.section.id);
                return (
                  <SectionNavItem
                    key={item.section.id}
                    item={item}
                    chapter={chapter}
                    active={item.section.id === activeSectionId}
                    outdated={Boolean(chapter?.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint)}
                    isLeaf={isLeafSection(item)}
                    collapsed={sidebarCollapsed}
                    onClick={() => {
                      setActiveSectionId(item.section.id);
                      setActiveTab("rich");
                    }}
                  />
                );
              })}
            </div>
          </aside>

          <main className="w-full rounded-xl border border-outline-variant bg-surface relative z-10 flex flex-col min-h-[620px] min-w-0 overflow-hidden">
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
                <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-1">
                        <span>{activeFlatSection?.number}</span>
                        <span>Editable section</span>
                      </div>
                      <h2 className="text-headline-md text-on-surface break-words">{activeFlatSection?.section.title}</h2>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ChapterStatusBadge chapter={activeChapter} outdated={activeIsOutdated} isLeaf={activeIsLeaf} />
                      {activeIsLeaf && activeChapter && (
                        <button
                          onClick={() => updateChapter(activeChapter.sectionId, { status: activeChapter.status === "completed" ? "in-progress" : "completed" })}
                          disabled={!isAiIdle}
                          className={cn(
                            "px-4 py-2 rounded-lg text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                            activeChapter.status === "completed"
                              ? "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                              : "bg-secondary text-on-secondary border-secondary/30 hover:opacity-90 ring-2 ring-secondary/20"
                          )}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {activeChapter.status === "completed" ? "undo" : "check_circle"}
                          </span>
                          {activeChapter.status === "completed" ? "Reopen Section" : "Mark Complete"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-outline-variant bg-surface p-3">
                    <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
                      {activeIsLeaf && (
                        <div className="flex bg-surface-container-lowest rounded-lg p-1 border border-outline-variant w-fit">
                          {(Object.keys(detailLabels) as DetailLevel[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => setDetailLevel(level)}
                              className={cn(
                                "px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors",
                                detailLevel === level ? "bg-primary-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                              )}
                            >
                              {detailLabels[level]}
                            </button>
                          ))}
                        </div>
                      )}
                      {activeIsLeaf && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)}
                            disabled={!activeFlatSection || !isAiIdle}
                            className={aiButtonClass}
                          >
                            {aiState === "generating" ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Generating...
                              </span>
                            ) : hasContent(activeChapter) ? (
                              "Regenerate with AI"
                            ) : (
                              "Generate with AI"
                            )}
                          </button>
                          <div className="relative" ref={refinePopoverRef}>
                            <button
                              onClick={() => setRefineOpen(true)}
                              disabled={!activeChapter || !hasContent(activeChapter) || !isAiIdle}
                              className={aiButtonClass}
                            >
                              {aiState === "refining" ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  Refining...
                                </span>
                              ) : (
                                "Refine with AI"
                              )}
                            </button>

                            {refineOpen && (
                              <div
                                className="absolute left-0 sm:left-auto sm:right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-3rem))] rounded-xl border border-outline-variant bg-surface-bright p-4 shadow-2xl"
                                style={{ animation: "report-builder-popover-in 150ms ease-out" }}
                              >
                                <textarea
                                  value={refineInstructions}
                                  onChange={(event) => setRefineInstructions(event.target.value)}
                                  placeholder="Tell AI what you'd like to improve (optional)..."
                                  rows={4}
                                  className="w-full resize-none rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                                  autoFocus
                                />
                                <div className="mt-3 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefineInstructions("");
                                      setRefineOpen(false);
                                    }}
                                    className="px-3 py-1.5 rounded-md border border-outline-variant bg-surface text-label-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleRefineSubmit}
                                    disabled={aiState === "refining"}
                                    className="px-3 py-1.5 rounded-md bg-primary text-label-sm font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                                  >
                                    {aiState === "refining" ? "Refining..." : "Refine"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {shouldShowTranslate && (
                            <button
                              onClick={() => activeChapter && translateChapter(activeChapter.sectionId, activeChapter.contentHtml)}
                              disabled={!activeChapter || !isAiIdle}
                              className="px-5 py-2 rounded-md border border-secondary/30 bg-secondary-container/60 text-secondary text-label-md font-semibold hover:bg-secondary-container transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                            >
                              {aiState === "translating" ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                                  Translating...
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2">
                                  <span aria-hidden="true">🌐</span>
                                  Translate to {getLanguageLabel(projectLanguage)}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {activeIsLeaf && hasContent(activeChapter) && (
                      <div className="mt-3.5 pt-3 border-t border-outline-variant/60">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">auto_fix_high</span>
                            Quick AI Actions
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            {selectedText.trim() ? "Applies to highlighted selection" : "Applies to full chapter"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ALL_AI_TOOLS.filter((t) => t.id !== "Improve Academic Style").map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => activeChapter && runChapterAction(activeChapter.sectionId, tool.id, activeChapter.contentHtml, selectedText)}
                              disabled={!activeChapter || !isAiIdle}
                              className={cn(
                                "h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                                "bg-surface-container-low/70 hover:bg-primary-container/40 text-on-surface hover:text-primary border-outline-variant/70 hover:border-primary/30"
                              )}
                              title={selectedText ? `Apply ${tool.label} to selected passage` : tool.desc}
                            >
                              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">{tool.icon}</span>
                              <span>{tool.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeIsLeaf && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-body-sm">
                        {selectedText.trim() ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-container text-primary border border-primary/20 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            <span>Selection Active ({selectedText.trim().split(/\s+/).filter(Boolean).length} words): AI tools will only update the highlighted passage.</span>
                            <button
                              type="button"
                              onClick={() => {
                                window.getSelection()?.removeAllRanges();
                                setSelectedText("");
                              }}
                              className="ml-2 underline text-primary hover:opacity-80 cursor-pointer font-bold"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                            <span>Pro-tip: Highlight any text in the editor below to rewrite or improve only that specific selection with AI.</span>
                          </div>
                        )}
                        <span className="text-xs text-on-surface-variant font-mono">{countWords(activeChapter?.contentHtml || "")} words</span>
                      </div>
                    )}
                    {activeIsOutdated && (
                      <div className="mt-3 rounded-md border border-error/20 bg-error-container/40 px-3 py-2 text-body-sm text-on-error-container">
                        Earlier project data changed after this chapter was generated. Regenerate or improve it before finalizing.
                      </div>
                    )}
                    {finalReport?.contentMarkdown && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-secondary/20 bg-secondary-container/20 px-3 py-2">
                        <span className="text-body-sm text-on-surface">Complete report is ready.</span>
                        <button
                          onClick={() => handleCopy(finalReport.contentMarkdown || "", "final")}
                          className="h-8 px-3 bg-surface text-primary border border-primary/20 rounded-md text-label-sm font-semibold hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1">{copied === "final" ? "check" : "content_copy"}</span>
                          {copied === "final" ? "Copied" : "Copy Markdown"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 border-b border-outline-variant">
                  <div className="flex gap-5 overflow-x-auto no-scrollbar">
                    {([
                      ["rich", "Rich Text"],
                      ["markdown", "Markdown"],
                      ["latex", "LaTeX"],
                    ] as [StudioTab, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                          "py-3 text-label-md font-semibold border-b-2 transition-colors whitespace-nowrap",
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
                      className="h-8 px-3 font-label-sm text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">{copied === activeTab ? "check" : "content_copy"}</span>
                      {copied === activeTab ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto bg-surface">
                  {!hasContent(activeChapter) ? (
                    <EmptyChapter
                      detailLevel={detailLevel}
                      disabled={!activeFlatSection || !activeIsLeaf || aiState !== "idle"}
                      loading={aiState === "generating"}
                      onGenerate={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)}
                    />
                  ) : activeTab === "rich" ? (
                    <RichChapterEditor
                      key={activeChapter?.sectionId}
                      content={activeChapter?.contentHtml || ""}
                      disabled={aiState !== "idle"}
                      aiState={aiState}
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
  onClick,
}: {
  item: FlatReportSection;
  chapter?: ReportChapter;
  active: boolean;
  outdated: boolean;
  isLeaf: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  if (!isLeaf) {
    if (collapsed) {
      return (
        <div
          className="w-full flex items-center justify-center py-1.5 text-primary opacity-80 my-1"
          title={`Chapter ${item.number}: ${item.section.title}`}
        >
          <span className="material-symbols-outlined text-[18px]">folder</span>
        </div>
      );
    }
    return (
      <div
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left border border-transparent bg-surface-container-lowest/60 text-on-surface opacity-85 select-none my-0.5"
        style={{ paddingLeft: `${12 + (item.level - 1) * 18}px` }}
      >
        <span className="material-symbols-outlined text-[18px] shrink-0 text-primary">folder</span>
        <span className="font-label-sm text-primary shrink-0 w-10">{item.number}</span>
        <span className="text-body-sm font-semibold truncate text-on-surface">{item.section.title}</span>
      </div>
    );
  }

  const generated = hasContent(chapter);
  const icon = outdated ? "warning" : chapter?.status === "completed" ? "check_circle" : generated ? "edit_document" : "radio_button_unchecked";
  const iconClass = outdated ? "text-error" : chapter?.status === "completed" ? "text-secondary" : generated ? "text-primary" : "text-outline";

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex flex-col items-center justify-center p-2 rounded-lg transition-colors border cursor-pointer my-1 group",
          active ? "bg-primary-container text-primary border-primary/30 shadow-xs" : "text-on-surface-variant border-transparent hover:bg-surface-container-low hover:text-on-surface"
        )}
        title={`${item.number} ${item.section.title}`}
      >
        <span className={cn("material-symbols-outlined text-[18px]", iconClass)}>{icon}</span>
        <span className="text-[10px] font-mono font-bold mt-0.5 text-primary">{item.number}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors border cursor-pointer",
        active ? "bg-primary-container/50 text-primary border-primary/20" : "text-on-surface-variant border-transparent hover:bg-surface-container-low hover:text-on-surface"
      )}
      style={{ paddingLeft: `${12 + (item.level - 1) * 18}px` }}
    >
      <span className={cn("material-symbols-outlined text-[18px] shrink-0", iconClass)}>{icon}</span>
      <span className="font-label-sm text-primary shrink-0 w-10">{item.number}</span>
      <span className={cn("text-body-sm truncate", active && "font-semibold")}>{item.section.title}</span>
    </button>
  );
}

function ChapterStatusBadge({ chapter, outdated, isLeaf }: { chapter?: ReportChapter; outdated: boolean; isLeaf: boolean }) {
  if (!isLeaf) {
    return <Badge icon="folder" label="Container" className="bg-surface text-on-surface-variant border-outline-variant" />;
  }
  if (outdated) {
    return <Badge icon="warning" label="Outdated" className="bg-error-container/60 text-on-error-container border-error/20" />;
  }
  if (chapter?.status === "completed") {
    return <Badge icon="check_circle" label="Completed" className="bg-secondary-container/40 text-secondary border-secondary/20" />;
  }
  if (hasContent(chapter)) {
    return <Badge icon="edit_document" label="In Progress" className="bg-primary-container/30 text-primary border-primary/20" />;
  }
  return <Badge icon="radio_button_unchecked" label="Not Started" className="bg-surface text-on-surface-variant border-outline-variant" />;
}

function Badge({ icon, label, className }: { icon: string; label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-label-sm font-bold uppercase tracking-wider whitespace-nowrap", className)}>
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {label}
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
    <div className="w-full min-h-[430px] flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest p-6">
      <div className="w-16 h-16 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[30px] text-primary">edit_document</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">No draft for this section yet</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-[440px] mb-6">
        Generate a first academic draft from the report structure and all completed Smart PFE artifacts.
      </p>
      <button onClick={onGenerate} disabled={disabled} className="h-10 px-6 bg-primary text-on-primary font-label-md rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        {loading ? "Generating..." : `Generate ${detailLabels[detailLevel]} Draft`}
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
      // If user is actively typing in custom prompt input/textarea in the toolbar, don't clear
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

      // Ensure selection is inside this editor
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
        // Selection is outside editor
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
    <div ref={containerRef} className="relative rounded-xl border border-outline-variant overflow-visible bg-surface shadow-sm transition-all">
      {aiState !== "idle" && (
        <div className="absolute top-0 inset-x-0 z-30 overflow-hidden rounded-t-xl">
          <div className="h-1 w-full bg-primary/15 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: "40%",
                animation: "report-studio-indeterminate 1.4s ease-in-out infinite",
              }}
            />
          </div>
          <div className="bg-primary-container/80 backdrop-blur-sm border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {aiState === "generating"
                ? "AI is generating chapter draft..."
                : aiState === "refining"
                  ? "AI is refining content..."
                  : aiState === "translating"
                    ? "AI is translating chapter..."
                    : "AI is rewriting selection..."}
            </span>
            <span className="text-[11px] font-normal text-on-surface-variant">Please wait, your document will update automatically</span>
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

      <div className="flex flex-wrap gap-1 p-2 border-b border-outline-variant bg-surface-container-lowest">
        <ToolbarButton icon="format_bold" label="Bold" onClick={() => exec("bold")} disabled={disabled} />
        <ToolbarButton icon="format_italic" label="Italic" onClick={() => exec("italic")} disabled={disabled} />
        <ToolbarButton icon="title" label="Heading 2" onClick={() => exec("formatBlock", "h2")} disabled={disabled} />
        <ToolbarButton icon="subtitles" label="Heading 3" onClick={() => exec("formatBlock", "h3")} disabled={disabled} />
        <ToolbarButton icon="format_list_bulleted" label="Bullet list" onClick={() => exec("insertUnorderedList")} disabled={disabled} />
        <ToolbarButton icon="format_list_numbered" label="Numbered list" onClick={() => exec("insertOrderedList")} disabled={disabled} />
        <ToolbarButton icon="code" label="Code block" onClick={() => insertHtml("<pre><code>// Code snippet</code></pre>")} disabled={disabled} />
        <ToolbarButton icon="table" label="Table" onClick={() => insertHtml("<table><caption>Table: Caption</caption><tbody><tr><th>Element</th><th>Description</th></tr><tr><td>...</td><td>...</td></tr></tbody></table>")} disabled={disabled} />
        <ToolbarButton icon="image" label="Figure" onClick={() => insertHtml('<figure data-placeholder="true"><div>[Figure placeholder]</div><figcaption>Figure: Caption</figcaption></figure>')} disabled={disabled} />
        <ToolbarButton icon="vertical_split" label="Page break" onClick={() => insertHtml('<hr data-page-break="true" />')} disabled={disabled} />
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="report-rich-editor min-h-[520px] px-6 py-7 outline-none text-on-surface leading-relaxed bg-surface focus:ring-4 focus:ring-primary/10 overflow-x-auto"
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
              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-on-surface hover:text-primary hover:bg-primary-container/30 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              title={tool.desc}
            >
              <span className="material-symbols-outlined text-[16px] text-primary">{tool.icon}</span>
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
              "h-8 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer shrink-0",
              moreOpen ? "bg-primary-container text-primary" : "text-on-surface hover:text-primary hover:bg-primary-container/30"
            )}
            title="More AI tools & customize toolbar"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
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
              "h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0",
              customOpen ? "bg-primary text-on-primary shadow-sm" : "text-on-surface hover:text-primary hover:bg-primary-container/30"
            )}
            title="Give specific custom instructions for this selection"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Instruct</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors ml-auto cursor-pointer shrink-0"
            title="Dismiss selection"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* More Tools & Pin Manager Popover */}
        {moreOpen && (
          <div className="mt-2 pt-2 border-t border-outline-variant max-h-56 overflow-y-auto divide-y divide-outline-variant/40 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-2 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
              <span>All AI Selection Tools</span>
              <span className="text-[10px] lowercase font-normal opacity-80">Click tool to run • Pin to toolbar</span>
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
                  className="px-2.5 py-1.5 flex items-center justify-between gap-3 hover:bg-primary-container/20 cursor-pointer rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">{tool.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-on-surface block truncate group-hover:text-primary">{tool.label}</span>
                      <span className="text-[11px] text-on-surface-variant block truncate">{tool.desc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => togglePin(tool.id, e)}
                    className={cn(
                      "p-1 rounded-md text-xs transition-colors shrink-0 cursor-pointer",
                      isPinned
                        ? "text-primary bg-primary-container/60 hover:bg-primary-container"
                        : "text-on-surface-variant opacity-40 group-hover:opacity-100 hover:text-primary hover:bg-surface-container"
                    )}
                    title={isPinned ? "Unpin from toolbar" : "Pin to toolbar"}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isPinned ? "push_pin" : "bookmark_add"}
                    </span>
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

function ToolbarButton({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function SourcePreview({ value, dark = false }: { value: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-xl p-4 min-h-[520px] overflow-auto border", dark ? "bg-[#1f2937] border-[#374151]" : "bg-surface-container-lowest border-outline-variant")}>
      <pre className={cn("font-mono text-[13px] leading-relaxed whitespace-pre-wrap", dark ? "text-[#f9fafb]" : "text-on-surface")}>
        {value || "No source generated yet."}
      </pre>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-container-lowest border border-outline-variant px-3 py-2 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="block font-label-md text-on-surface mt-0.5">{value}</span>
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
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const nextPendingSection =
    leafSections.find((item) => !hasContent(getChapter(item.section.id))) ||
    leafSections.find((item) => getChapter(item.section.id)?.status !== "completed");

  const estimatedReadMinutes = Math.max(1, Math.round(totalWords / 200));
  const topLevelSections = useMemo(() => flatSections.filter((item) => item.level === 1), [flatSections]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-6 p-6 sm:p-8 overflow-y-auto bg-surface">
      {/* Executive Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-outline-variant/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-primary-container text-primary border border-primary/20">
              Report Studio Overview
            </span>
            <span className="text-sm text-on-surface-variant font-medium">
              {topLevelSections.length} Chapters • {leafSections.length} Total Subsections
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Academic Report Progress
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {nextPendingSection && (
            <button
              onClick={() => onSelectSection(nextPendingSection.section.id)}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Resume at {nextPendingSection.number}</span>
            </button>
          )}
          <button
            onClick={onGenerateFinal}
            disabled={!allGenerated || aiState !== "idle"}
            className={cn(
              "h-10 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
              allGenerated
                ? "bg-secondary text-on-secondary hover:bg-secondary/90"
                : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {aiState === "finalizing" ? "sync" : "auto_stories"}
            </span>
            <span>{aiState === "finalizing" ? "Compiling..." : "Compile Complete Report"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Drafts */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">Sections Drafted</span>
            <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">{generatedCount}</span>
            <span className="text-body-sm text-on-surface-variant font-medium">/ {leafSections.length}</span>
            <span className="ml-auto text-label-sm font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Completed */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">Approved & Done</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">{completedCount}</span>
            <span className="text-body-sm text-on-surface-variant font-medium">/ {leafSections.length}</span>
            <span className="ml-auto text-label-sm font-bold text-secondary">
              {leafSections.length ? Math.round((completedCount / leafSections.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-300"
              style={{ width: `${leafSections.length ? (completedCount / leafSections.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Outdated */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">Needs Re-sync</span>
            <span className={cn("material-symbols-outlined text-[20px]", outdatedCount > 0 ? "text-error" : "text-on-surface-variant")}>
              {outdatedCount > 0 ? "warning" : "sync"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl sm:text-3xl font-bold font-mono tracking-tight", outdatedCount > 0 ? "text-error" : "text-on-surface")}>
              {outdatedCount}
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">sections</span>
            <span className={cn("ml-auto text-label-xs font-semibold", outdatedCount > 0 ? "text-error" : "text-on-surface-variant")}>
              {outdatedCount > 0 ? "Outdated" : "In sync"}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-3 truncate">
            {outdatedCount > 0 ? "Earlier project data updated" : "All chapters up to date"}
          </p>
        </div>

        {/* Metric 4: Total Volume */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Volume</span>
            <span className="material-symbols-outlined text-[20px] text-tertiary">menu_book</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
              {totalWords.toLocaleString()}
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">words</span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-3 truncate">
            ~{estimatedReadMinutes} min reading time
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start min-w-0 w-full">
        {/* Left: Structured Chapter Matrix */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">format_list_bulleted</span>
              Chapter Breakdown & Progress
            </h2>
            <span className="text-body-sm text-on-surface-variant font-medium">
              Click any section to edit
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {topLevelSections.map((topItem) => {
              const isCollapsed = !expandedChapters[topItem.section.id];
              const childLeaves = leafSections.filter(
                (leaf) => leaf.number === topItem.number || leaf.number.startsWith(`${topItem.number}.`)
              );
              const childGenerated = childLeaves.filter((leaf) => hasContent(getChapter(leaf.section.id))).length;
              const childCompleted = childLeaves.filter((leaf) => getChapter(leaf.section.id)?.status === "completed").length;
              const childPercent = childLeaves.length ? Math.round((childGenerated / childLeaves.length) * 100) : 0;

              return (
                <div
                  key={topItem.section.id}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs"
                >
                  {/* Chapter Header Banner */}
                  <div
                    onClick={() => toggleChapter(topItem.section.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-outline-variant/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                        {childPercent === 100 ? "task_alt" : "folder_open"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-label-sm font-bold text-primary font-mono">
                            Chapter {topItem.number}
                          </span>
                          <span className="text-body-sm text-on-surface-variant">•</span>
                          <span className="text-label-sm text-on-surface-variant font-medium">
                            {childGenerated}/{childLeaves.length} Drafted
                          </span>
                          {childCompleted === childLeaves.length && childLeaves.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-container text-secondary">
                              Complete
                            </span>
                          )}
                        </div>
                        <h3 className="text-body-lg font-bold text-on-surface truncate mt-0.5">
                          {topItem.section.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-label-sm font-bold text-on-surface font-mono">{childPercent}%</span>
                        <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${childPercent}%` }} />
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                        {isCollapsed ? "expand_more" : "expand_less"}
                      </span>
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
                            className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-primary-container/10 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {/* Status Icon */}
                              <span
                                className={cn(
                                  "material-symbols-outlined text-[18px] shrink-0",
                                  isOut ? "text-error" : isComp ? "text-secondary" : isGen ? "text-primary" : "text-outline"
                                )}
                              >
                                {isOut ? "warning" : isComp ? "check_circle" : isGen ? "edit_document" : "radio_button_unchecked"}
                              </span>

                              {/* Section Title */}
                              <div className="flex items-baseline gap-2.5 min-w-0 flex-1">
                                <span className="text-label-sm font-bold text-primary font-mono shrink-0">
                                  {leaf.number}
                                </span>
                                <span className="text-body-md font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                                  {leaf.section.title}
                                </span>
                              </div>
                            </div>

                            {/* Metadata & Open Action */}
                            <div className="flex items-center gap-3 shrink-0">
                              {isGen && (
                                <span className="hidden md:inline-block text-label-xs text-on-surface-variant font-mono">
                                  {wordCount} words
                                </span>
                              )}

                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded text-label-xs font-bold uppercase tracking-wider",
                                  isOut
                                    ? "bg-error-container text-on-error-container"
                                    : isComp
                                      ? "bg-secondary-container/80 text-secondary"
                                      : isGen
                                        ? "bg-primary-container/80 text-primary"
                                        : "bg-surface-container text-on-surface-variant"
                                )}
                              >
                                {isOut ? "Outdated" : isComp ? "Done" : isGen ? "Drafted" : "Empty"}
                              </span>

                              <span className="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                                arrow_forward
                              </span>
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
          <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xs flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                <h3 className="text-body-lg font-bold text-on-surface">Final Report</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Assemble and export the entire thesis with all table of contents, LaTeX styling, and bibliography.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-outline-variant bg-surface flex items-center justify-between text-body-sm">
              <span className="text-on-surface font-medium">Readiness</span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-label-xs font-bold uppercase",
                  allGenerated ? "bg-secondary-container text-secondary" : "bg-surface-container-high text-on-surface-variant"
                )}
              >
                {allGenerated ? "Ready to Compile" : `${generatedCount}/${leafSections.length} Drafted`}
              </span>
            </div>

            <button
              onClick={onGenerateFinal}
              disabled={!allGenerated || aiState !== "idle"}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-semibold text-label-md flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                allGenerated
                  ? "bg-primary text-on-primary hover:bg-primary/90"
                  : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">
                {aiState === "finalizing" ? "sync" : "auto_stories"}
              </span>
              <span>{aiState === "finalizing" ? "Compiling..." : finalReport?.contentMarkdown ? "Recompile Report" : "Compile Full Report"}</span>
            </button>

            {finalReport?.contentMarkdown && (
              <div className="pt-3 border-t border-outline-variant flex flex-col gap-2.5">
                <span className="text-label-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Report compiled & ready
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onCopy(finalReport.contentMarkdown || "", "final")}
                    className="py-2 px-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-body-sm font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {copied === "final" ? "check" : "content_copy"}
                    </span>
                    <span>{copied === "final" ? "Copied" : "Markdown"}</span>
                  </button>
                  <button
                    onClick={() => onCopy(finalReport.contentLatex || markdownToLatex(finalReport.contentMarkdown || ""), "final")}
                    className="py-2 px-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-body-sm font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {copied === "final" ? "check" : "code"}
                    </span>
                    <span>{copied === "final" ? "Copied" : "LaTeX"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="p-5 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xs flex flex-col gap-3">
            <h4 className="text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Writing Workflow
            </h4>
            <ul className="text-body-sm text-on-surface-variant space-y-2">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">auto_awesome</span>
                <span>Generate drafts using AI trained on your previous project steps.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">tune</span>
                <span>Refine tone, format tables, and citations in the rich text editor.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Mark completed when satisfied to unlock final document compilation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
