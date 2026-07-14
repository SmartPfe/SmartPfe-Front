import { DragEvent, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  ReportSection,
  createEmptySection,
  useReportStructure,
} from "./hooks/useReportStructure";

const MAX_DEPTH = 3;

type DropPosition = "before" | "after" | "child";
type DropTarget = { path: number[]; position: DropPosition } | null;

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

export default function ReportStructure() {
  const {
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
  } = useReportStructure();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragPath, setDragPath] = useState<number[] | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  const flatCount = useMemo(() => countSections(reportStructure), [reportStructure]);
  const chapterCount = reportStructure.length;

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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading report structure...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Report Structure
            <InfoTooltip label="Structure" tooltip="Outline the chapters and sections of your final PFE report." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Define the table of contents that will guide the final report generator. Drag chapters, edit titles, and organize the hierarchy.
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
          <button onClick={() => saveReportStructure(reportStructure, true)} disabled={saveStatus === "saving" || aiState === "generating"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
          <button onClick={generateWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready"} className={aiButtonClass}>
            {aiState === "generating" ? "Generating..." : "Generate with AI"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || reportStructure.length === 0} className={aiButtonClass}>
            Refine with AI
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary-container/20 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-label-md font-bold text-on-surface">AI suggestion ready</h3>
              <p className="text-body-md text-on-surface-variant">Review the generated table of contents before applying it.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept structure</button>
            </div>
          </div>
          <div className="bg-surface rounded-lg border border-outline-variant p-3 max-h-[380px] overflow-y-auto">
            <OutlineTree sections={suggestion} readOnly />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-6">
        <SummaryCard icon="menu_book" label="Main chapters" value={String(chapterCount)} helper="Top-level report chapters" />
        <SummaryCard icon="account_tree" label="Total sections" value={String(flatCount)} helper="Includes subsections and sub-subsections" />
        <SummaryCard icon="auto_awesome" label="AI context" value="Synced" helper="Uses previous wizard artifacts" />
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Table of Contents</h2>
            <p className="text-body-md text-on-surface-variant">Numbering updates automatically after every edit.</p>
          </div>
          <button onClick={() => insertSection([Math.max(0, reportStructure.length - 1)], reportStructure.length ? "after" : "before")} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Chapter
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-surface-container-low/20">
          {reportStructure.length === 0 ? (
            <button onClick={() => insertSection([0], "before")} className="w-full rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors py-14 flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
              <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                <span className="material-symbols-outlined text-[24px]">add</span>
              </div>
              <span className="font-medium">Generate with AI or create your first chapter.</span>
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

function SummaryCard({ icon, label, value, helper }: { icon: string; label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-md">
      <div className="flex items-center gap-2 text-on-surface-variant mb-2">
        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        <span className="font-label-md text-label-md">{label}</span>
      </div>
      <p className="text-headline-md text-on-surface">{value}</p>
      <p className="text-body-md text-on-surface-variant mt-1">{helper}</p>
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
    <div className="flex flex-col gap-1">
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
          className="absolute -top-2 left-10 z-10 h-5 w-5 rounded-full border border-primary/30 bg-surface text-primary shadow-sm flex items-center justify-center opacity-0 group-hover/node:opacity-100 hover:bg-primary hover:text-on-primary transition-all"
          title="Insert section here"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
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
          "relative flex items-center gap-sm p-3 rounded-lg border transition-colors bg-surface",
          "hover:bg-surface-container-low hover:border-outline-variant",
          targetPosition === "child" ? "border-primary bg-primary-container/20" : "border-transparent",
          targetPosition === "after" ? "mb-1" : ""
        )}
        style={{ marginLeft: readOnly ? `${(level - 1) * 28}px` : `${(level - 1) * 34}px` }}
      >
        {!readOnly && (
          <span className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing shrink-0">drag_indicator</span>
        )}
        <button
          type="button"
          disabled={!hasChildren}
          onClick={() => onToggle(path)}
          className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 text-on-surface-variant", hasChildren ? "hover:bg-surface-container" : "opacity-0")}
          title={section.collapsed ? "Expand" : "Collapse"}
        >
          <span className="material-symbols-outlined text-[18px]">{section.collapsed ? "chevron_right" : "expand_more"}</span>
        </button>
        <div className={cn("rounded bg-surface-container flex items-center justify-center text-primary font-label-md shrink-0", level === 1 ? "min-w-9 h-8 px-2" : "min-w-8 h-7 px-2 text-label-sm")}>
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
              className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm font-semibold"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => !readOnly && onEdit(section.id)}
              className={cn("text-left truncate w-full", level === 1 ? "font-headline-sm text-headline-sm text-on-surface" : "font-body-md text-body-md text-on-surface")}
            >
              {section.title}
            </button>
          )}
        </div>

        {!readOnly && (
          <div className="opacity-100 md:opacity-0 md:group-hover/node:opacity-100 flex items-center gap-xs transition-opacity shrink-0">
            <button onClick={() => onInsert(path, "after")} className="text-on-surface-variant hover:text-primary p-1" title="Add sibling">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
            {level < MAX_DEPTH && (
              <button onClick={() => onInsert(path, "child")} className="text-on-surface-variant hover:text-primary p-1" title="Add subsection">
                <span className="material-symbols-outlined text-[19px]">subdirectory_arrow_right</span>
              </button>
            )}
            <button onClick={() => onMove(path, -1)} className="text-on-surface-variant hover:text-on-surface p-1" title="Move up">
              <span className="material-symbols-outlined text-[19px]">keyboard_arrow_up</span>
            </button>
            <button onClick={() => onMove(path, 1)} className="text-on-surface-variant hover:text-on-surface p-1" title="Move down">
              <span className="material-symbols-outlined text-[19px]">keyboard_arrow_down</span>
            </button>
            <button onClick={() => onEdit(isEditing ? null : section.id)} className="text-on-surface-variant hover:text-primary p-1" title="Edit">
              <span className="material-symbols-outlined text-[19px]">{isEditing ? "check" : "edit"}</span>
            </button>
            <button onClick={() => onDelete(path)} className="text-on-surface-variant hover:text-error p-1" title="Delete">
              <span className="material-symbols-outlined text-[19px]">delete</span>
            </button>
          </div>
        )}
      </div>

      {targetPosition === "after" && <div className="h-0.5 bg-primary rounded-full mt-1" />}

      {hasChildren && !section.collapsed && (
        <div className="mt-1 border-l border-outline-variant/70 ml-8">
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

function getChildrenAtPath(tree: ReportSection[], parentPath: number[]) {
  let children = tree;
  for (const index of parentPath) {
    children = children[index]?.children || [];
  }
  return children;
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

  const index = path[0];
  const result = removeNode(tree[index].children, path.slice(1));
  return {
    tree: tree.map((node, nodeIndex) => nodeIndex === index ? { ...node, children: result.tree } : node),
    node: result.node,
  };
}

function insertIntoParent(tree: ReportSection[], parentPath: number[], index: number, node: ReportSection): ReportSection[] {
  if (parentPath.length === 0) {
    const next = [...tree];
    next.splice(index, 0, node);
    return next;
  }

  return tree.map((section, sectionIndex) => {
    if (sectionIndex !== parentPath[0]) return section;
    return { ...section, children: insertIntoParent(section.children, parentPath.slice(1), index, node) };
  });
}

function insertNode(tree: ReportSection[], targetPath: number[], position: DropPosition, node: ReportSection): ReportSection[] {
  if (!tree.length && position === "before") return [node];
  if (position === "child") {
    const targetDepth = targetPath.length;
    if (targetDepth + getSubtreeDepth(node) > MAX_DEPTH) return tree;
    return updateNode(tree, targetPath, (target) => ({ ...target, collapsed: false, children: [...target.children, node] }));
  }

  const parentPath = targetPath.slice(0, -1);
  const targetIndex = targetPath[targetPath.length - 1] ?? -1;
  const insertIndex = position === "before" ? Math.max(0, targetIndex) : targetIndex + 1;
  if (parentPath.length + getSubtreeDepth(node) > MAX_DEPTH) return tree;
  return insertIntoParent(tree, parentPath, insertIndex, node);
}

function moveNode(tree: ReportSection[], sourcePath: number[], targetPath: number[], position: DropPosition): ReportSection[] {
  const removed = removeNode(tree, sourcePath);
  if (!removed.node) return tree;

  let adjustedTarget = [...targetPath];
  if (sourcePath.length === targetPath.length && sourcePath.slice(0, -1).every((value, index) => value === targetPath[index])) {
    const sourceIndex = sourcePath[sourcePath.length - 1];
    const targetIndex = targetPath[targetPath.length - 1];
    if (sourceIndex < targetIndex) adjustedTarget[adjustedTarget.length - 1] -= 1;
  }

  const parentDepth = position === "child" ? adjustedTarget.length : adjustedTarget.length - 1;
  if (parentDepth + getSubtreeDepth(removed.node) > MAX_DEPTH) return tree;

  return insertNode(removed.tree, adjustedTarget, position, removed.node);
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
