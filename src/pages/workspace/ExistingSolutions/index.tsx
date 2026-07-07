import { useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  ExistingSolution,
  useExistingSolutions,
} from "./hooks/useExistingSolutions";

const aiButtonClass =
  "px-4 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-sm font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

const iconOptions = ["search", "web", "apps", "science", "cloud", "school", "analytics", "devices", "business_center", "database", "smart_toy"];

const createEmptySolution = (): ExistingSolution => ({
  localId: `new-${Date.now()}`,
  name: "",
  category: "Existing Solution",
  icon: "search",
  description: "",
  solvedProblem: "",
  strengths: [],
  weaknesses: [],
  differentiation: "",
});

export default function ExistingSolutions() {
  const {
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
  } = useExistingSolutions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [matrixView, setMatrixView] = useState(false);

  const updateSolution = (id: string, updates: Partial<ExistingSolution>) => {
    setSolutions((prev) => prev.map((solution) => getSolutionKey(solution) === id ? { ...solution, ...updates } : solution));
    markUnsaved();
  };

  const addSolution = () => {
    const solution = createEmptySolution();
    setSolutions((prev) => [...prev, solution]);
    setEditingId(getSolutionKey(solution));
    markUnsaved();
  };

  const deleteSolution = (id: string) => {
    setSolutions((prev) => prev.filter((solution) => getSolutionKey(solution) !== id));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading existing solutions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="font-display text-display text-on-surface mb-2 flex items-center">
            Existing Solutions
            <InfoTooltip label="Solutions" tooltip="Outline the technical and functional solutions to the problem." />
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">
            Analyze the state of the art to position your project and highlight your competitive advantage. Identify competitors and alternative methods.
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
          <button
            onClick={() => saveSolutions(solutions, true)}
            disabled={saveStatus === "saving" || aiState === "generating"}
            className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Save now
          </button>
          <button
            onClick={() => setMatrixView((value) => !value)}
            className={cn("flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm", matrixView && "bg-surface-container-low")}
          >
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            Matrix View
          </button>
          <button
            onClick={addSolution}
            disabled={aiState === "generating"}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Solution
          </button>
        </div>
      </div>

      <div className="mb-8 p-6 rounded-xl bg-secondary-container border border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface/50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-secondary-container">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-medium text-on-secondary-container text-base">Generate Competitive Analysis</h3>
            <p className="text-on-secondary-container/80 text-sm mt-1">Let AI identify relevant existing solutions using your project context, problem statement, and actors.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={generateWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready"} className={aiButtonClass}>
            {aiState === "generating" ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : "Generate with AI"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || solutions.length === 0} className={aiButtonClass}>
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
              <p className="text-body-md text-on-surface-variant">Review the generated existing solutions before applying them.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept solutions</button>
            </div>
          </div>
          <SolutionGrid solutions={suggestion} editingId={null} readOnly matrixView={matrixView} onEdit={() => {}} onDelete={() => {}} onUpdate={() => {}} />
        </div>
      )}

      <SolutionGrid solutions={solutions} editingId={editingId} matrixView={matrixView} onEdit={setEditingId} onDelete={deleteSolution} onUpdate={updateSolution} />

      {solutions.length === 0 && (
        <button onClick={addSolution} className="rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors py-14 flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
          <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <span className="font-medium">Add New Solution</span>
        </button>
      )}
    </div>
  );
}

function SolutionGrid({
  solutions,
  editingId,
  readOnly = false,
  matrixView,
  onEdit,
  onDelete,
  onUpdate,
}: {
  solutions: ExistingSolution[];
  editingId: string | null;
  readOnly?: boolean;
  matrixView: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExistingSolution>) => void;
}) {
  if (matrixView) {
    return (
      <div className="overflow-hidden bg-surface border border-outline-variant rounded-xl">
        <div className="hidden lg:grid grid-cols-[1fr_1.25fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-surface-container-low border-b border-outline-variant text-[10px] uppercase font-bold text-outline tracking-wider">
          <div>Solution</div>
          <div>Problem solved</div>
          <div>Strengths</div>
          <div>Weaknesses</div>
          <div>Difference</div>
          <div className="w-20 text-right">Actions</div>
        </div>
        <div className="divide-y divide-outline-variant">
          {solutions.map((solution) => (
            <SolutionRow key={getSolutionKey(solution)} solution={solution} editingId={editingId} readOnly={readOnly} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start min-h-0">
      {solutions.map((solution) => (
        <SolutionCard key={getSolutionKey(solution)} solution={solution} editingId={editingId} readOnly={readOnly} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function SolutionCard(props: {
  solution: ExistingSolution;
  editingId: string | null;
  readOnly: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExistingSolution>) => void;
}) {
  const { solution, editingId, readOnly, onEdit, onDelete, onUpdate } = props;
  const id = getSolutionKey(solution);
  const isEditing = editingId === id;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0 text-on-surface">
            <span className="material-symbols-outlined">{solution.icon}</span>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button onClick={() => onEdit(isEditing ? null : id)} className="w-8 h-8 rounded-full text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors" title={isEditing ? "Done" : "Edit"}>
                <span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span>
              </button>
              <button onClick={() => onDelete(id)} className="w-8 h-8 rounded-full text-outline hover:text-error hover:bg-error-container flex items-center justify-center transition-colors" title="Delete">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input value={solution.name} onChange={(event) => onUpdate(id, { name: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary font-bold" placeholder="Solution name" />
            <input value={solution.category} onChange={(event) => onUpdate(id, { category: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Category" />
            <select value={solution.icon} onChange={(event) => onUpdate(id, { icon: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
              {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">{solution.category}</span>
            <h3 className="font-bold text-lg text-on-surface">{solution.name || "Untitled solution"}</h3>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        <EditableText label="Description" value={solution.description} isEditing={isEditing} onChange={(value) => onUpdate(id, { description: value })} placeholder="Describe the solution" />
        <EditableText label="Problem Solved" value={solution.solvedProblem} isEditing={isEditing} onChange={(value) => onUpdate(id, { solvedProblem: value })} placeholder="What problem does it solve?" />
        <EditableList title="Strengths" icon="add_circle" tone="secondary" items={solution.strengths} isEditing={isEditing} onChange={(strengths) => onUpdate(id, { strengths })} />
        <EditableList title="Weaknesses" icon="remove_circle" tone="error" items={solution.weaknesses} isEditing={isEditing} onChange={(weaknesses) => onUpdate(id, { weaknesses })} />
        <EditableText label="Our Difference" value={solution.differentiation} isEditing={isEditing} onChange={(value) => onUpdate(id, { differentiation: value })} placeholder="Why is the project different?" />
      </div>
    </div>
  );
}

function SolutionRow(props: {
  solution: ExistingSolution;
  editingId: string | null;
  readOnly: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ExistingSolution>) => void;
}) {
  const { solution, editingId, readOnly, onEdit, onDelete, onUpdate } = props;
  const id = getSolutionKey(solution);
  const isEditing = editingId === id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-start hover:bg-surface-container-low transition-colors">
      <div className="font-medium text-on-surface flex gap-3">
        <span className="material-symbols-outlined text-outline text-[20px] shrink-0">{solution.icon}</span>
        <div className="min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input value={solution.name} onChange={(event) => onUpdate(id, { name: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary" placeholder="Solution name" />
              <input value={solution.category} onChange={(event) => onUpdate(id, { category: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Category" />
            </div>
          ) : (
            <>
              <p>{solution.name || "Untitled solution"}</p>
              <p className="text-label-sm text-on-surface-variant">{solution.category}</p>
            </>
          )}
        </div>
      </div>
      <EditableText value={solution.solvedProblem} isEditing={isEditing} onChange={(value) => onUpdate(id, { solvedProblem: value })} placeholder="Problem solved" compact />
      <EditableList title="Strengths" icon="add_circle" tone="secondary" items={solution.strengths} isEditing={isEditing} onChange={(strengths) => onUpdate(id, { strengths })} compact />
      <EditableList title="Weaknesses" icon="remove_circle" tone="error" items={solution.weaknesses} isEditing={isEditing} onChange={(weaknesses) => onUpdate(id, { weaknesses })} compact />
      <EditableText value={solution.differentiation} isEditing={isEditing} onChange={(value) => onUpdate(id, { differentiation: value })} placeholder="Difference" compact />
      {!readOnly && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => onEdit(isEditing ? null : id)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-DEFAULT transition-colors" title={isEditing ? "Done" : "Edit"}>
            <span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span>
          </button>
          <button onClick={() => onDelete(id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors" title="Delete">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

function EditableText({
  label,
  value,
  isEditing,
  onChange,
  placeholder,
  compact = false,
}: {
  label?: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  compact?: boolean;
}) {
  if (isEditing) {
    return (
      <div>
        {label && <p className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">{label}</p>}
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-h-[78px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder={placeholder} />
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">{label}</p>}
      <p className={cn("text-sm text-on-surface-variant leading-relaxed", compact ? "" : "line-clamp-4")}>{value || "No content yet."}</p>
    </div>
  );
}

function EditableList({
  title,
  icon,
  tone,
  items,
  isEditing,
  onChange,
  compact = false,
}: {
  title: string;
  icon: string;
  tone: "secondary" | "error";
  items: string[];
  isEditing: boolean;
  onChange: (items: string[]) => void;
  compact?: boolean;
}) {
  const colorClass = tone === "secondary" ? "text-secondary" : "text-error";
  const dotClass = tone === "secondary" ? "bg-secondary" : "bg-error";

  if (isEditing) {
    return (
      <div>
        <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className={cn("material-symbols-outlined text-[14px]", colorClass)}>{icon}</span>
          {title}
        </h4>
        <textarea value={items.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} className="w-full min-h-[88px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder="One item per line" />
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className={cn("material-symbols-outlined text-[14px]", colorClass)}>{icon}</span>
          {title}
        </h4>
      )}
      <ul className="flex flex-col gap-1.5">
        {(items.length ? items : ["No items yet."]).map((item, index) => (
          <li key={`${item}-${index}`} className="text-sm text-on-surface-variant flex items-start gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotClass)} />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getSolutionKey(solution: ExistingSolution) {
  return solution._id || solution.localId || `${solution.name}-${solution.category}`;
}
