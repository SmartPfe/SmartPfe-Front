import { DragEvent, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  ReportSection,
  createEmptySection,
  getLanguageLabel,
  useReportStructure,
} from "./hooks/useReportStructure";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const MAX_DEPTH = 3;

type DropPosition = "before" | "after" | "child";
type DropTarget = { path: number[]; position: DropPosition } | null;

export default function ReportStructure() {
  const {
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
  } = useReportStructure();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragPath, setDragPath] = useState<number[] | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  const flatCount = useMemo(() => countSections(reportStructure), [reportStructure]);
  const chapterCount = reportStructure.length;

  const maxDepth = useMemo(() => {
    if (!reportStructure.length) return 0;
    return Math.max(...reportStructure.map(getSubtreeDepth));
  }, [reportStructure]);

  const structureQuality = useMemo(() => {
    if (chapterCount === 0) return { label: "Empty", color: "text-on-surface-variant", hint: "No chapters added yet" };
    if (chapterCount < 3) return { label: "Brief Outline", color: "text-amber-500", hint: "Recommended: 4–6 chapters" };
    if (chapterCount >= 3 && chapterCount <= 7 && maxDepth >= 2) return { label: "Thesis Ready", color: "text-secondary", hint: "Optimal chapter & depth balance" };
    if (chapterCount > 8) return { label: "Extensive", color: "text-primary", hint: "Consider merging related chapters" };
    return { label: "Standard", color: "text-secondary", hint: `${maxDepth}-level hierarchy` };
  }, [chapterCount, maxDepth]);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    reportStructure.length > 0 &&
    reportStructureLanguage !== projectLanguage
  );

  const updateTree = (updater: (tree: ReportSection[]) => ReportSection[]) => {
    setReportStructure((current) => updater(current));
    markUnsaved();
  };

  const insertSection = (path: number[], position: DropPosition) => {
    const section = createEmptySection();
    updateTree((tree) => insertNode(tree, path, position, section));
    setEditingId(section.id);
  };

  const updateTitle = (path: number[], title: string) => {
    updateTree((tree) => updateNode(tree, path, (node) => ({ ...node, title })));
  };

  const toggleCollapsed = (path: number[]) => {
    updateTree((tree) => updateNode(tree, path, (node) => ({ ...node, collapsed: !node.collapsed })));
  };

  const deleteSection = (path: number[]) => {
    updateTree((tree) => removeNode(tree, path).tree);
  };

  const moveSection = (path: number[], direction: -1 | 1) => {
    const siblingIndex = path[path.length - 1];
    const targetIndex = siblingIndex + direction;
    if (targetIndex < 0) return;
    updateTree((tree) => moveSibling(tree, path, targetIndex));
  };

  const handleDrop = () => {
    if (!dragPath || !dropTarget || pathsEqual(dragPath, dropTarget.path) || isDescendantPath(dropTarget.path, dragPath)) {
      setDragPath(null);
      setDropTarget(null);
      return;
    }

    updateTree((tree) => moveNode(tree, dragPath, dropTarget.path, dropTarget.position));
    setDragPath(null);
    setDropTarget(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading report structure...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto flex flex-col h-full pb-32">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Academic Document</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Report Structure
            <InfoTooltip
              label="Report Outline"
              tooltip="Define the chapters and sections hierarchy for your final PFE academic thesis."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Organize the table of contents and chapter hierarchy that will structure your final generated report.
          </p>
        </div>

        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveReportStructure(reportStructure, true)}
          isBusy={isAiBusy}
        />
      </div>

      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Report Structure"
        action={aiState}
        onCancel={cancelAi}
      />

      <AiActionToolbar
        onGenerate={generateWithAi}
        onRefine={refineWithAi}
        onTranslate={translateWithAi}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canRefine={reportStructure.length > 0}
        refineDisabledTitle="Add or generate chapters before refining"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Organize into 5 academic chapters: Intro, State of Art, Needs, Architecture, and Implementation')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          <button
            type="button"
            onClick={() => insertSection([Math.max(0, reportStructure.length - 1)], reportStructure.length ? "after" : "before")}
            disabled={isAiBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>Add Chapter</span>
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon="ai-spark" size={18} strokeWidth={1.8} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">AI suggestion ready</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review the generated table of contents before applying it to your report.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={discardSuggestion}
                className="h-8 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={acceptSuggestion}
                className="h-8 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs cursor-pointer"
              >
                Accept structure
              </button>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-outline-variant/80 p-3 max-h-[380px] overflow-y-auto">
            <OutlineTree sections={suggestion} readOnly />
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60">
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <HugeiconsIcon icon="book-open" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-on-surface leading-none">{chapterCount}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Main Chapters</span>
              </div>
              <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">Top-level report divisions</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
              <HugeiconsIcon icon="schema" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-on-surface leading-none">{flatCount}</span>
                <span className="text-xs font-semibold text-on-surface-variant">Total Elements</span>
              </div>
              <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
                Across {maxDepth} nesting level{maxDepth === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <HugeiconsIcon icon="verified" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold uppercase tracking-wider", structureQuality.color)}>
                  {structureQuality.label}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
                {structureQuality.hint}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-outline-variant/70 bg-surface-container-low/40 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-on-surface tracking-tight">Document Hierarchy</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Drag to rearrange. Numbering updates automatically.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-low/20">
          {reportStructure.length === 0 ? (
            <button
              onClick={() => insertSection([0], "before")}
              className="w-full rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:bg-surface-container-low/40 transition-all py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/80 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-200">
                <HugeiconsIcon icon="add" size={22} strokeWidth={2} />
              </div>
              <span className="font-semibold text-sm text-on-surface">Add First Chapter</span>
              <span className="text-xs text-on-surface-variant/70">Or click "Generate with AI" to construct a complete academic outline</span>
            </button>
          ) : (
            <OutlineTree
              sections={reportStructure}
              editingId={editingId}
              dragPath={dragPath}
              dropTarget={dropTarget}
              onEdit={setEditingId}
              onUpdateTitle={updateTitle}
              onToggle={toggleCollapsed}
              onDelete={deleteSection}
              onInsert={insertSection}
              onMove={moveSection}
              onDragStart={setDragPath}
              onDropTarget={setDropTarget}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OutlineTree({
  sections,
  readOnly = false,
  editingId = null,
  dragPath = null,
  dropTarget = null,
  onEdit = () => {},
  onUpdateTitle = () => {},
  onToggle = () => {},
  onDelete = () => {},
  onInsert = () => {},
  onMove = () => {},
  onDragStart = () => {},
  onDropTarget = () => {},
  onDrop = () => {},
}: {
  sections: ReportSection[];
  readOnly?: boolean;
  editingId?: string | null;
  dragPath?: number[] | null;
  dropTarget?: DropTarget;
  onEdit?: (id: string | null) => void;
  onUpdateTitle?: (path: number[], title: string) => void;
  onToggle?: (path: number[]) => void;
  onDelete?: (path: number[]) => void;
  onInsert?: (path: number[], position: DropPosition) => void;
  onMove?: (path: number[], direction: -1 | 1) => void;
  onDragStart?: (path: number[]) => void;
  onDropTarget?: (target: DropTarget) => void;
  onDrop?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {sections.map((section, index) => (
        <OutlineNode
          key={section.id}
          section={section}
          path={[index]}
          number={`${index + 1}`}
          level={1}
          readOnly={readOnly}
          editingId={editingId}
          dragPath={dragPath}
          dropTarget={dropTarget}
          onEdit={onEdit}
          onUpdateTitle={onUpdateTitle}
          onToggle={onToggle}
          onDelete={onDelete}
          onInsert={onInsert}
          onMove={onMove}
          onDragStart={onDragStart}
          onDropTarget={onDropTarget}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}

function OutlineNode({
  section,
  path,
  number,
  level,
  readOnly,
  editingId,
  dragPath,
  dropTarget,
  onEdit,
  onUpdateTitle,
  onToggle,
  onDelete,
  onInsert,
  onMove,
  onDragStart,
  onDropTarget,
  onDrop,
}: {
  section: ReportSection;
  path: number[];
  number: string;
  level: number;
  readOnly: boolean;
  editingId: string | null;
  dragPath: number[] | null;
  dropTarget: DropTarget;
  onEdit: (id: string | null) => void;
  onUpdateTitle: (path: number[], title: string) => void;
  onToggle: (path: number[]) => void;
  onDelete: (path: number[]) => void;
  onInsert: (path: number[], position: DropPosition) => void;
  onMove: (path: number[], direction: -1 | 1) => void;
  onDragStart: (path: number[]) => void;
  onDropTarget: (target: DropTarget) => void;
  onDrop: () => void;
}) {
  const isEditing = editingId === section.id;
  const hasChildren = section.children.length > 0;
  const isDragging = dragPath && pathsEqual(dragPath, path);
  const targetPosition = dropTarget && pathsEqual(dropTarget.path, path) ? dropTarget.position : null;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly || !dragPath) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const relativeX = event.clientX - rect.left;
    let position: DropPosition = relativeY < rect.height / 2 ? "before" : "after";
    if (relativeX > 96 && level < MAX_DEPTH) position = "child";
    onDropTarget({ path, position });
  };

  return (
    <div className={cn("group/node relative", isDragging && "opacity-40")}>
      {!readOnly && (
        <button
          onClick={() => onInsert(path, "before")}
          className="absolute -top-2 left-10 z-10 h-5 w-5 rounded-full border border-primary/30 bg-surface text-primary shadow-2xs flex items-center justify-center opacity-0 group-hover/node:opacity-100 hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
          title="Insert section here"
        >
          <HugeiconsIcon icon="add" size={12} strokeWidth={2} />
        </button>
      )}

      {targetPosition === "before" && <div className="h-0.5 bg-primary rounded-full mb-1" />}

      <div
        draggable={!readOnly}
        onDragStart={() => onDragStart(path)}
        onDragOver={handleDragOver}
        onDrop={(event) => {
          event.preventDefault();
          onDrop();
        }}
        className={cn(
          "relative flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-150 bg-surface",
          "hover:bg-surface-container-low hover:border-outline-variant/80 hover:shadow-2xs",
          targetPosition === "child" ? "border-primary bg-primary/10" : "border-outline-variant/60",
          targetPosition === "after" ? "mb-1" : ""
        )}
        style={{ marginLeft: readOnly ? `${(level - 1) * 24}px` : `${(level - 1) * 28}px` }}
      >
        {!readOnly && (
          <span className="text-on-surface-variant/40 hover:text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0 flex items-center">
            <HugeiconsIcon icon="drag-indicator" size={16} strokeWidth={1.8} />
          </span>
        )}

        <button
          type="button"
          disabled={!hasChildren}
          onClick={() => onToggle(path)}
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-on-surface-variant transition-colors cursor-pointer",
            hasChildren ? "hover:bg-surface-container hover:text-on-surface" : "opacity-0 pointer-events-none"
          )}
          title={section.collapsed ? "Expand" : "Collapse"}
        >
          <HugeiconsIcon icon={section.collapsed ? "chevron-right" : "chevron-down"} size={14} strokeWidth={2} />
        </button>

        <div className={cn("rounded-lg bg-surface-container flex items-center justify-center text-primary font-mono font-bold shrink-0 border border-outline-variant/50", level === 1 ? "min-w-8 h-7 px-2 text-xs" : "min-w-7 h-6 px-1.5 text-[11px]")}>
          {number}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing && !readOnly ? (
            <input
              value={section.title}
              onChange={(event) => onUpdateTitle(path, event.target.value)}
              onBlur={() => onEdit(null)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onEdit(null);
              }}
              autoFocus
              className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 outline-none focus:border-primary text-xs font-bold text-on-surface"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => !readOnly && onEdit(section.id)}
              className={cn(
                "text-left truncate w-full cursor-pointer tracking-tight",
                level === 1 ? "font-bold text-sm text-on-surface" : "font-medium text-xs text-on-surface-variant hover:text-on-surface"
              )}
            >
              {section.title || "Untitled section"}
            </button>
          )}
        </div>

        {!readOnly && (
          <div className="opacity-100 md:opacity-0 md:group-hover/node:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => onInsert(path, "after")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
              title="Add sibling"
            >
              <HugeiconsIcon icon="add" size={15} strokeWidth={1.8} />
            </button>
            {level < MAX_DEPTH && (
              <button
                type="button"
                onClick={() => onInsert(path, "child")}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                title="Add subsection"
              >
                <HugeiconsIcon icon="subdirectory-arrow-right" size={15} strokeWidth={1.8} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onMove(path, -1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Move up"
            >
              <HugeiconsIcon icon="arrow-right" size={13} strokeWidth={1.8} className="-rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => onMove(path, 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Move down"
            >
              <HugeiconsIcon icon="arrow-right" size={13} strokeWidth={1.8} className="rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(isEditing ? null : section.id)}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                isEditing
                  ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              )}
              title={isEditing ? "Save" : "Edit"}
            >
              <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(path)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
              title="Delete"
            >
              <HugeiconsIcon icon="delete" size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {targetPosition === "after" && <div className="h-0.5 bg-primary rounded-full mt-1" />}

      {hasChildren && !section.collapsed && (
        <div className="mt-1.5 border-l border-outline-variant/60 ml-6 pl-1 flex flex-col gap-1.5">
          {section.children.map((child, index) => (
            <OutlineNode
              key={child.id}
              section={child}
              path={[...path, index]}
              number={`${number}.${index + 1}`}
              level={level + 1}
              readOnly={readOnly}
              editingId={editingId}
              dragPath={dragPath}
              dropTarget={dropTarget}
              onEdit={onEdit}
              onUpdateTitle={onUpdateTitle}
              onToggle={onToggle}
              onDelete={onDelete}
              onInsert={onInsert}
              onMove={onMove}
              onDragStart={onDragStart}
              onDropTarget={onDropTarget}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function countSections(sections: ReportSection[]): number {
  return sections.reduce((sum, section) => sum + 1 + countSections(section.children), 0);
}

function pathsEqual(a: number[] | null, b: number[] | null) {
  return Boolean(a && b && a.length === b.length && a.every((value, index) => value === b[index]));
}

function isDescendantPath(path: number[], ancestor: number[]) {
  return path.length > ancestor.length && ancestor.every((value, index) => path[index] === value);
}

function getSubtreeDepth(node: ReportSection): number {
  if (!node.children.length) return 1;
  return 1 + Math.max(...node.children.map(getSubtreeDepth));
}

function updateNode(tree: ReportSection[], path: number[], updater: (node: ReportSection) => ReportSection): ReportSection[] {
  return tree.map((node, index) => {
    if (index !== path[0]) return node;
    if (path.length === 1) return updater(node);
    return { ...node, children: updateNode(node.children, path.slice(1), updater) };
  });
}

function removeNode(tree: ReportSection[], path: number[]): { tree: ReportSection[]; node: ReportSection | null } {
  if (path.length === 1) {
    const next = [...tree];
    const [node] = next.splice(path[0], 1);
    return { tree: next, node: node || null };
  }

  const [head, ...tail] = path;
  let removed: ReportSection | null = null;
  const next = tree.map((node, index) => {
    if (index !== head) return node;
    const result = removeNode(node.children, tail);
    removed = result.node;
    return { ...node, children: result.tree };
  });

  return { tree: next, node: removed };
}

function insertNode(tree: ReportSection[], path: number[], position: DropPosition, nodeToInsert: ReportSection): ReportSection[] {
  if (position === "child") {
    return updateNode(tree, path, (node) => ({
      ...node,
      collapsed: false,
      children: [...node.children, nodeToInsert],
    }));
  }

  const parentPath = path.slice(0, -1);
  const targetIndex = path[path.length - 1] ?? 0;
  const insertIndex = position === "before" ? targetIndex : targetIndex + 1;

  if (parentPath.length === 0) {
    const next = [...tree];
    next.splice(insertIndex, 0, nodeToInsert);
    return next;
  }

  return updateNode(tree, parentPath, (parent) => {
    const nextChildren = [...parent.children];
    nextChildren.splice(insertIndex, 0, nodeToInsert);
    return { ...parent, children: nextChildren };
  });
}

function moveSibling(tree: ReportSection[], path: number[], targetIndex: number): ReportSection[] {
  const parentPath = path.slice(0, -1);
  const siblings = getChildrenAtPath(tree, parentPath);
  if (targetIndex < 0 || targetIndex >= siblings.length) return tree;
  const currentIndex = path[path.length - 1];
  const nextSiblings = [...siblings];
  const [node] = nextSiblings.splice(currentIndex, 1);
  nextSiblings.splice(targetIndex, 0, node);

  if (parentPath.length === 0) return nextSiblings;
  return updateNode(tree, parentPath, (parent) => ({ ...parent, children: nextSiblings }));
}
