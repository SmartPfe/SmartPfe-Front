import { useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  ExistingSolution,
  getLanguageLabel,
  useExistingSolutions,
} from "./hooks/useExistingSolutions";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const iconOptions = [
  "search",
  "web",
  "apps",
  "science",
  "cloud",
  "school",
  "analytics",
  "devices",
  "business-center",
  "database",
  "smart-toy",
];

const createEmptySolution = (): ExistingSolution => ({
  localId: `new-${Date.now()}`,
  name: "",
  category: "Web Platform",
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
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveSolutions,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    existingSolutionsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useExistingSolutions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [matrixView, setMatrixView] = useState(false);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    solutions.length > 0 &&
    existingSolutionsLanguage !== projectLanguage
  );

  const updateSolution = (id: string, updates: Partial<ExistingSolution>) => {
    setSolutions((prev) =>
      prev.map((solution) =>
        getSolutionKey(solution) === id ? { ...solution, ...updates } : solution
      )
    );
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading existing solutions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Market Research & SOTA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Existing Solutions
            <InfoTooltip
              label="State of the Art"
              tooltip="Analyze existing market tools, frameworks, and academic alternatives to benchmark weaknesses and define your project's unique value proposition."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Position your project against the state of the art by highlighting strengths, limitations, and key differentiators.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveSolutions(solutions, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Existing Solutions"
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Global AI Action Toolbar with View Toggle & Add Solution Button */}
      <AiActionToolbar
        onGenerate={generateWithAi}
        onRefine={refineWithAi}
        onTranslate={translateWithAi}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canRefine={solutions.length > 0}
        refineDisabledTitle="Add or generate solutions before refining"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Compare against Jira and Trello with specific technical weaknesses')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMatrixView((prev) => !prev)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-semibold tracking-tight transition-all duration-150 shadow-2xs active:scale-[0.98] select-none cursor-pointer",
                matrixView
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-low"
              )}
              title={matrixView ? "Switch to Card Grid View" : "Switch to Comparison Matrix View"}
            >
              <HugeiconsIcon icon={matrixView ? "layers" : "presentation"} size={16} strokeWidth={1.75} />
              <span>{matrixView ? "Card View" : "Matrix View"}</span>
            </button>
            <button
              type="button"
              onClick={addSolution}
              disabled={isAiBusy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
            >
              <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
              <span>Add Solution</span>
            </button>
          </div>
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

      {/* Suggestion Ready Box */}
      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon="ai-spark" size={18} strokeWidth={1.8} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">AI suggestion ready</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review the benchmarked existing solutions before applying them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={discardSuggestion}
                className="h-8 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors"
              >
                Discard
              </button>
              <button
                onClick={acceptSuggestion}
                className="h-8 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs"
              >
                Accept solutions
              </button>
            </div>
          </div>
          <SolutionGrid
            solutions={suggestion}
            editingId={null}
            readOnly
            matrixView={matrixView}
            onEdit={() => {}}
            onDelete={() => {}}
            onUpdate={() => {}}
          />
        </div>
      )}

      {/* Solutions Grid / Matrix View */}
      <SolutionGrid
        solutions={solutions}
        editingId={editingId}
        matrixView={matrixView}
        onEdit={setEditingId}
        onDelete={deleteSolution}
        onUpdate={updateSolution}
      />

      {/* Empty State */}
      {solutions.length === 0 && (
        <button
          onClick={addSolution}
          className="rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:bg-surface-container-low/40 transition-all py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/80 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-200">
            <HugeiconsIcon icon="add" size={22} strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm text-on-surface">Add First Existing Solution</span>
          <span className="text-xs text-on-surface-variant/70">Or click "Generate with AI" to research existing state of the art tools</span>
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
      <div className="overflow-hidden bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-2xs">
        <div className="hidden lg:grid grid-cols-[180px_1.25fr_1fr_1fr_1.1fr_90px] gap-4 px-5 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60 text-[11px] uppercase font-bold text-on-surface-variant tracking-wider">
          <div>Solution Name</div>
          <div>Problem Solved</div>
          <div>Strengths</div>
          <div>Weaknesses</div>
          <div>Our Difference</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-outline-variant/60">
          {solutions.map((solution) => (
            <SolutionRow
              key={getSolutionKey(solution)}
              solution={solution}
              editingId={editingId}
              readOnly={readOnly}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
      {solutions.map((solution) => (
        <SolutionCard
          key={getSolutionKey(solution)}
          solution={solution}
          editingId={editingId}
          readOnly={readOnly}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
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
    <div
      className={cn(
        "bg-surface-container-lowest border rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 shadow-2xs",
        isEditing
          ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
          : "border-outline-variant/80 hover:border-outline hover:shadow-xs"
      )}
    >
      {/* Card Top Header: Title & Action Buttons aligned on the exact same row */}
      <div className="px-5 py-4 border-b border-outline-variant/70 bg-surface-container-low/40">
        <div className="flex items-center justify-between gap-3 min-h-[36px]">
          {isEditing ? (
            <input
              value={solution.name}
              onChange={(event) => onUpdate(id, { name: event.target.value })}
              className="flex-1 bg-surface border border-outline-variant/80 rounded-lg px-3 py-1.5 text-base font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Solution / App name"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-1.5 h-4 rounded-full bg-primary shrink-0 opacity-80" />
              <h3 className="font-bold text-[17px] leading-snug text-on-surface tracking-tight truncate">
                {solution.name || "Untitled solution"}
              </h3>
            </div>
          )}

          {/* Edit / Delete Buttons matching Actors Page */}
          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(isEditing ? null : id)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                  isEditing
                    ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                )}
                title={isEditing ? "Save edit" : "Edit solution"}
              >
                <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                title="Delete solution"
              >
                <HugeiconsIcon icon="delete" size={16} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Body Information */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <EditableText
          label="Description"
          value={solution.description}
          isEditing={isEditing}
          onChange={(value) => onUpdate(id, { description: value })}
          placeholder="Overview of this existing solution..."
        />
        <EditableText
          label="Problem Solved"
          value={solution.solvedProblem}
          isEditing={isEditing}
          onChange={(value) => onUpdate(id, { solvedProblem: value })}
          placeholder="What specific problem does this solution address?"
        />
        <EditableList
          title="Strengths"
          tone="secondary"
          items={solution.strengths}
          isEditing={isEditing}
          onChange={(strengths) => onUpdate(id, { strengths })}
        />
        <EditableList
          title="Weaknesses & Gaps"
          tone="error"
          items={solution.weaknesses}
          isEditing={isEditing}
          onChange={(weaknesses) => onUpdate(id, { weaknesses })}
        />
        <EditableText
          label="Our Project Difference"
          value={solution.differentiation}
          isEditing={isEditing}
          onChange={(value) => onUpdate(id, { differentiation: value })}
          placeholder="How our project differentiates or improves on this solution..."
        />
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
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[180px_1.25fr_1fr_1fr_1.1fr_90px] gap-3 lg:gap-4 px-5 py-3.5 items-start transition-colors group",
        isEditing ? "bg-primary/5" : "hover:bg-surface-container-low/30"
      )}
    >
      {/* Solution Identity */}
      <div className="min-w-0 pt-0.5">
        {isEditing ? (
          <input
            value={solution.name}
            onChange={(event) => onUpdate(id, { name: event.target.value })}
            className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface outline-none focus:border-primary"
            placeholder="Solution name"
          />
        ) : (
          <p className="font-semibold text-sm text-on-surface tracking-tight truncate">
            {solution.name || "Untitled solution"}
          </p>
        )}
      </div>

      <EditableText
        value={solution.solvedProblem}
        isEditing={isEditing}
        onChange={(value) => onUpdate(id, { solvedProblem: value })}
        placeholder="Problem solved"
        compact
      />
      <EditableList
        title="Strengths"
        tone="secondary"
        items={solution.strengths}
        isEditing={isEditing}
        onChange={(strengths) => onUpdate(id, { strengths })}
        compact
      />
      <EditableList
        title="Weaknesses"
        tone="error"
        items={solution.weaknesses}
        isEditing={isEditing}
        onChange={(weaknesses) => onUpdate(id, { weaknesses })}
        compact
      />
      <EditableText
        value={solution.differentiation}
        isEditing={isEditing}
        onChange={(value) => onUpdate(id, { differentiation: value })}
        placeholder="Difference"
        compact
      />

      {/* Row Edit/Delete Actions matching Actors */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(isEditing ? null : id)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
              isEditing
                ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
            )}
            title={isEditing ? "Save edit" : "Edit solution"}
          >
            <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
            title="Delete solution"
          >
            <HugeiconsIcon icon="delete" size={16} strokeWidth={1.8} />
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
        {label && <p className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1.5">{label}</p>}
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-h-[72px] bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">{label}</p>}
      <p className={cn("text-xs text-on-surface-variant leading-relaxed", compact ? "" : "line-clamp-3")}>
        {value || <span className="text-on-surface-variant/50 italic">No content yet.</span>}
      </p>
    </div>
  );
}

function EditableList({
  title,
  tone,
  items,
  isEditing,
  onChange,
  compact = false,
}: {
  title: string;
  tone: "secondary" | "error";
  items: string[];
  isEditing: boolean;
  onChange: (items: string[]) => void;
  compact?: boolean;
}) {
  const dotClass = tone === "secondary" ? "bg-secondary" : "bg-error";

  if (isEditing) {
    return (
      <div>
        <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
          {title}
        </h4>
        <textarea
          value={items.join("\n")}
          onChange={(event) =>
            onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))
          }
          className="w-full min-h-[72px] bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
          placeholder="One item per line"
        />
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
          {title}
        </h4>
      )}
      <ul className="flex flex-col gap-1">
        {(items.length ? items : ["No items listed."]).map((item, index) => (
          <li key={`${item}-${index}`} className="text-xs text-on-surface-variant flex items-start gap-1.5">
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

