import { useEffect, useMemo, useRef, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import {
  AI_ACTIONS,
  AiAction,
  DetailLevel,
  FlatReportSection,
  ReportChapter,
  htmlToMarkdown,
  markdownToLatex,
  useReportStudio,
} from "./hooks/useReportStudio";

type StudioTab = "rich" | "markdown" | "latex";

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

const detailLabels: Record<DetailLevel, string> = {
  summary: "Summary",
  standard: "Standard",
  detailed: "Detailed",
};

const actionIcons: Record<AiAction, string> = {
  Expand: "add_box",
  Shorten: "compress",
  "Improve Academic Style": "school",
  "Make More Technical": "memory",
  Simplify: "lightbulb",
  "Continue Writing": "more_horiz",
  "Improve Grammar": "spellcheck",
  "Rewrite Selection": "edit_note",
  "Regenerate Selection": "autorenew",
  "Explain Better": "psychology",
};

const sourceLabels = [
  "Project Context",
  "Problem Statement",
  "Actors",
  "Existing Solutions",
  "Functional Requirements",
  "Non-Functional Requirements",
  "Product Backlog",
  "User Stories",
  "UML Preparation",
  "Previous Chapters",
];

export default function ReportBuilder() {
  const {
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
    generateCompleteReport,
    dismissError,
  } = useReportStudio();

  const [activeSectionId, setActiveSectionId] = useState("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("standard");
  const [activeTab, setActiveTab] = useState<StudioTab>("rich");
  const [selectedText, setSelectedText] = useState("");
  const [copied, setCopied] = useState<StudioTab | "final" | null>(null);

  useEffect(() => {
    if (!activeSectionId && flatSections.length) {
      setActiveSectionId(flatSections[0].section.id);
    }
  }, [activeSectionId, flatSections]);

  const activeFlatSection = flatSections.find((item) => item.section.id === activeSectionId) || flatSections[0];
  const activeChapter = activeFlatSection ? getChapter(activeFlatSection.section.id) : undefined;
  const generatedCount = flatSections.filter((item) => hasContent(getChapter(item.section.id))).length;
  const completedCount = reportChapters.filter((chapter) => chapter.status === "completed").length;
  const progressPercent = flatSections.length ? Math.round((generatedCount / flatSections.length) * 100) : 0;
  const allGenerated = flatSections.length > 0 && generatedCount === flatSections.length;
  const activeIsOutdated = Boolean(
    activeChapter?.sourceFingerprint &&
    sourceFingerprint &&
    activeChapter.sourceFingerprint !== sourceFingerprint
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
    if (!activeFlatSection) return;
    const markdown = htmlToMarkdown(html);
    updateChapter(activeFlatSection.section.id, {
      title: activeFlatSection.section.title,
      contentHtml: html,
      contentMarkdown: markdown,
      contentLatex: markdownToLatex(markdown),
      status: "in-progress",
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
    <div className="max-w-[1500px] mx-auto flex flex-col h-full pb-24">
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
          <span className={`text-label-sm transition-colors ${
            saveStatus === "saving" ? "text-on-surface-variant" :
            saveStatus === "saved" ? "text-secondary" :
            "text-error"
          }`}>
            {saveStatus === "saving" ? "Autosaving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
          </span>
          <button onClick={() => saveReportChapters(reportChapters, true)} disabled={saveStatus === "saving" || aiState !== "idle"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
          <button onClick={generateCompleteReport} disabled={!allGenerated || aiState !== "idle"} className={cn(aiButtonClass, allGenerated && "bg-primary text-on-primary border-primary hover:bg-primary/90 hover:from-primary hover:to-primary")}>
            {aiState === "finalizing" ? "Finalizing..." : "Generate Complete Report"}
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
        <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_300px] gap-md min-h-[calc(100dvh-250px)]">
          <aside className="rounded-xl border border-outline-variant bg-surface overflow-hidden flex flex-col min-h-[420px] xl:min-h-0">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Report Structure</h2>
                  <p className="text-body-sm text-on-surface-variant">{generatedCount} of {flatSections.length} generated</p>
                </div>
                <span className="font-headline-sm text-headline-sm text-primary">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {flatSections.map((item) => {
                const chapter = getChapter(item.section.id);
                return (
                  <SectionNavItem
                    key={item.section.id}
                    item={item}
                    chapter={chapter}
                    active={item.section.id === activeSectionId}
                    outdated={Boolean(chapter?.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint)}
                    onClick={() => {
                      setActiveSectionId(item.section.id);
                      setActiveTab("rich");
                    }}
                  />
                );
              })}
            </div>
          </aside>

          <main className="rounded-xl border border-outline-variant bg-surface overflow-hidden flex flex-col min-h-[620px]">
            <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-lowest">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-1">
                    <span>{activeFlatSection?.number}</span>
                    <span>Writing Studio</span>
                  </div>
                  <h2 className="text-headline-md text-on-surface break-words">{activeFlatSection?.section.title}</h2>
                </div>
                <ChapterStatusBadge chapter={activeChapter} outdated={activeIsOutdated} />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-5">
                <div className="flex bg-surface rounded-lg p-1 border border-outline-variant w-fit">
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
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)} disabled={!activeFlatSection || aiState !== "idle"} className={aiButtonClass}>
                    <span className="material-symbols-outlined text-[17px] align-[-3px] mr-1">auto_awesome</span>
                    {hasContent(activeChapter) ? "Regenerate with AI" : "Generate with AI"}
                  </button>
                  <button onClick={() => activeChapter && runChapterAction(activeChapter.sectionId, "Improve Academic Style", activeChapter.contentHtml, selectedText)} disabled={!activeChapter || !hasContent(activeChapter) || aiState !== "idle"} className={aiButtonClass}>
                    <span className="material-symbols-outlined text-[17px] align-[-3px] mr-1">school</span>
                    Refine with AI
                  </button>
                  <button onClick={() => activeChapter && updateChapter(activeChapter.sectionId, { status: activeChapter.status === "completed" ? "in-progress" : "completed" })} disabled={!activeChapter || aiState !== "idle"} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-sm font-medium hover:bg-surface-container-low disabled:opacity-50">
                    <span className="material-symbols-outlined text-[17px] align-[-3px] mr-1">done_all</span>
                    {activeChapter?.status === "completed" ? "Reopen" : "Mark Complete"}
                  </button>
                </div>
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
                  disabled={!activeFlatSection || aiState !== "idle"}
                  loading={aiState === "generating"}
                  onGenerate={() => activeFlatSection && generateChapter(activeFlatSection.section.id, detailLevel)}
                />
              ) : activeTab === "rich" ? (
                <RichChapterEditor
                  key={activeChapter?.sectionId}
                  content={activeChapter?.contentHtml || ""}
                  disabled={aiState !== "idle"}
                  onChange={handleEditorChange}
                  onSelectionChange={setSelectedText}
                />
              ) : (
                <SourcePreview value={activeTab === "markdown" ? currentMarkdown : currentLatex} dark={activeTab === "latex"} />
              )}
            </div>

            {hasContent(activeChapter) && (
              <div className="border-t border-outline-variant p-4 bg-surface-container-lowest">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-label-sm text-on-surface-variant uppercase mr-1">AI Tools</span>
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => activeChapter && runChapterAction(activeChapter.sectionId, action, activeChapter.contentHtml, selectedText)}
                      disabled={!activeChapter || aiState !== "idle"}
                      className="h-8 px-3 bg-surface hover:bg-surface-container-low border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title={selectedText ? `Apply to selected text: ${selectedText.slice(0, 60)}` : "Apply to the whole chapter"}
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">{actionIcons[action]}</span>
                      {action}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-body-sm text-on-surface-variant">
                  <span>{selectedText ? `Selection active: ${selectedText.trim().split(/\s+/).length} words` : "No text selected. AI actions will use the whole chapter."}</span>
                  <span>{countWords(activeChapter?.contentHtml || "")} words</span>
                </div>
              </div>
            )}
          </main>

          <aside className="rounded-xl border border-outline-variant bg-surface overflow-hidden flex flex-col min-h-[420px] xl:min-h-0">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
              <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
                Context
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Sources used to keep the chapter coherent.</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {activeIsOutdated && (
                <div className="rounded-lg border border-error/20 bg-error-container/40 p-3">
                  <h3 className="font-label-md text-on-error-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Chapter may be outdated
                  </h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Earlier project data changed after this chapter was generated. Regenerate or improve it before finalizing.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-label-md text-on-surface">Generated using</h3>
                {(activeChapter?.generatedFrom?.length ? activeChapter.generatedFrom : sourceLabels).map((source) => (
                  <div key={source} className="flex items-center gap-2 text-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                    {source}
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                <h3 className="font-label-md text-on-surface mb-2">Report Health</h3>
                <div className="space-y-3">
                  <Metric label="Generated" value={`${generatedCount}/${flatSections.length}`} />
                  <Metric label="Completed" value={`${completedCount}/${flatSections.length}`} />
                  <Metric label="Outdated" value={`${reportChapters.filter((chapter) => chapter.sourceFingerprint && sourceFingerprint && chapter.sourceFingerprint !== sourceFingerprint).length}`} />
                </div>
              </div>

              {finalReport?.contentMarkdown && (
                <div className="rounded-lg border border-secondary/20 bg-secondary-container/20 p-3">
                  <h3 className="font-label-md text-on-surface mb-1">Complete report ready</h3>
                  <p className="text-body-sm text-on-surface-variant mb-3">The polished report has been generated from all chapters.</p>
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
          </aside>
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
  onClick,
}: {
  item: FlatReportSection;
  chapter?: ReportChapter;
  active: boolean;
  outdated: boolean;
  onClick: () => void;
}) {
  const generated = hasContent(chapter);
  const icon = outdated ? "warning" : chapter?.status === "completed" ? "check_circle" : generated ? "edit_document" : "radio_button_unchecked";
  const iconClass = outdated ? "text-error" : chapter?.status === "completed" ? "text-secondary" : generated ? "text-primary" : "text-outline";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors border",
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

function ChapterStatusBadge({ chapter, outdated }: { chapter?: ReportChapter; outdated: boolean }) {
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
    <div className="min-h-[430px] flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest p-6">
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
  onChange,
  onSelectionChange,
}: {
  content: string;
  disabled: boolean;
  onChange: (html: string) => void;
  onSelectionChange: (text: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

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

  const captureSelection = () => onSelectionChange(window.getSelection()?.toString() || "");

  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface shadow-sm">
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
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        className="report-rich-editor min-h-[520px] px-6 py-7 outline-none text-on-surface leading-relaxed bg-surface focus:ring-4 focus:ring-primary/10 overflow-x-auto"
      />
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
    <div className="flex items-center justify-between gap-4 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-label-md text-on-surface">{value}</span>
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
