import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  NonFunctionalRequirement,
  RequirementPriority,
  RequirementStatus,
  renumberRequirements,
  useNonFunctionalRequirements,
} from "./hooks/useNonFunctionalRequirements";

const categoryStyles: Record<string, { icon: string; color: string; bg: string }> = {
  Performance: { icon: "speed", color: "text-secondary", bg: "bg-secondary-container/30" },
  Scalability: { icon: "trending_up", color: "text-secondary", bg: "bg-secondary-container/30" },
  Security: { icon: "shield_lock", color: "text-primary", bg: "bg-primary-container/30" },
  Privacy: { icon: "lock", color: "text-primary", bg: "bg-primary-container/30" },
  Usability: { icon: "touch_app", color: "text-[#d97706]", bg: "bg-[#fef3c7]" },
  Accessibility: { icon: "accessibility_new", color: "text-[#d97706]", bg: "bg-[#fef3c7]" },
  Reliability: { icon: "verified", color: "text-[#059669]", bg: "bg-[#d1fae5]" },
  Availability: { icon: "cloud_done", color: "text-[#059669]", bg: "bg-[#d1fae5]" },
  Maintainability: { icon: "build", color: "text-on-surface", bg: "bg-surface-container-high" },
  Compatibility: { icon: "devices", color: "text-on-surface", bg: "bg-surface-container-high" },
};

const priorityOptions: RequirementPriority[] = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const statusOptions: RequirementStatus[] = ["Draft", "In Review", "Approved"];

const aiButtonClass =
  "flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

const createEmptyRequirement = (index: number, category = "Performance"): NonFunctionalRequirement => ({
  localId: `new-${Date.now()}`,
  code: `NFR-${String(index + 1).padStart(2, "0")}`,
  category,
  title: "",
  description: "",
  priority: "Should Have",
  status: "Draft",
});

export default function NonFunctionalRequirements() {
  const {
    requirements,
    setRequirements,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    markUnsaved,
    saveRequirements,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useNonFunctionalRequirements();

  const [editingId, setEditingId] = useState<string | null>(null);

  const groupedRequirements = useMemo(() => groupRequirements(requirements), [requirements]);
  const groupedSuggestion = useMemo(() => groupRequirements(suggestion || []), [suggestion]);

  const updateRequirement = (id: string, updates: Partial<NonFunctionalRequirement>) => {
    setRequirements((prev) =>
      prev.map((requirement) =>
        getRequirementKey(requirement) === id ? { ...requirement, ...updates } : requirement
      )
    );
    markUnsaved();
  };

  const addRequirement = (category = "Performance") => {
    const requirement = createEmptyRequirement(requirements.length, category);
    setRequirements((prev) => [...prev, requirement]);
    setEditingId(getRequirementKey(requirement));
    markUnsaved();
  };

  const deleteRequirement = (id: string) => {
    setRequirements((prev) => renumberRequirements(prev.filter((requirement) => getRequirementKey(requirement) !== id)));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading non-functional requirements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Non-Functional Requirements
            <InfoTooltip label="Non-Func Reqs" tooltip="Define system attributes like performance, security, and scalability." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Specify the criteria that judge the operation of the system, rather than specific behaviors. Define quality attributes like performance, security, and usability.
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
          <button onClick={() => saveRequirements(requirements, true)} disabled={saveStatus === "saving" || aiState === "generating"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
          <button onClick={generateWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready"} className={aiButtonClass}>
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            {aiState === "generating" ? "Generating..." : "Generate"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || requirements.length === 0} className={aiButtonClass}>
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Refine
          </button>
          <button onClick={() => addRequirement()} disabled={aiState === "generating"} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add NFR
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
              <p className="text-body-md text-on-surface-variant">Review the generated non-functional requirements before applying them.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept requirements</button>
            </div>
          </div>
          <RequirementGrid groupedRequirements={groupedSuggestion} editingId={null} readOnly onEdit={() => {}} onDelete={() => {}} onUpdate={() => {}} onAdd={() => {}} />
        </div>
      )}

      {requirements.length === 0 ? (
        <button onClick={() => addRequirement()} className="rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors py-14 flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
          <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <span className="font-medium">Generate with AI or add your first non-functional requirement.</span>
        </button>
      ) : (
        <RequirementGrid groupedRequirements={groupedRequirements} editingId={editingId} onEdit={setEditingId} onDelete={deleteRequirement} onUpdate={updateRequirement} onAdd={addRequirement} />
      )}
    </div>
  );
}

function RequirementGrid({
  groupedRequirements,
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onUpdate,
  onAdd,
}: {
  groupedRequirements: Array<{ category: string; requirements: NonFunctionalRequirement[] }>;
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NonFunctionalRequirement>) => void;
  onAdd: (category: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
      {groupedRequirements.map((group) => {
        const style = getCategoryStyle(group.category);
        return (
          <div key={group.category} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/50 pb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.bg, style.color)}>
                <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">{group.category}</h2>
              <span className="ml-auto text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{group.requirements.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {group.requirements.map((requirement) => (
                <RequirementCard key={getRequirementKey(requirement)} requirement={requirement} editingId={editingId} readOnly={readOnly} style={style} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />
              ))}
              {!readOnly && (
                <button onClick={() => onAdd(group.category)} className="flex items-center gap-2 px-4 py-3 border border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container hover:text-on-surface transition-colors justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add {group.category} Req
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequirementCard({
  requirement,
  editingId,
  readOnly,
  style,
  onEdit,
  onDelete,
  onUpdate,
}: {
  requirement: NonFunctionalRequirement;
  editingId: string | null;
  readOnly: boolean;
  style: { bg: string; color: string; icon: string };
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NonFunctionalRequirement>) => void;
}) {
  const id = getRequirementKey(requirement);
  const isEditing = editingId === id;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 hover:shadow-sm transition-shadow group relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", style.bg)}></div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono font-bold text-outline-variant bg-surface-container px-2 py-0.5 rounded uppercase tracking-wider">{requirement.code}</span>
          {isEditing ? (
            <input value={requirement.title} onChange={(event) => onUpdate(id, { title: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm font-bold" placeholder="Requirement title" />
          ) : (
            <h3 className="font-bold text-on-surface text-sm leading-tight">{requirement.title || "Untitled requirement"}</h3>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(isEditing ? null : id)} className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors" title={isEditing ? "Done" : "Edit"}>
              <span className="material-symbols-outlined text-[16px]">{isEditing ? "check" : "edit"}</span>
            </button>
            <button onClick={() => onDelete(id)} className="w-7 h-7 rounded hover:bg-error-container flex items-center justify-center text-outline-variant hover:text-error transition-colors" title="Delete">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <input value={requirement.category} onChange={(event) => onUpdate(id, { category: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Category" />
          <textarea value={requirement.description} onChange={(event) => onUpdate(id, { description: event.target.value })} className="w-full min-h-[92px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder="The system shall..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={requirement.priority} onChange={(event) => onUpdate(id, { priority: event.target.value as RequirementPriority })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
              {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <select value={requirement.status} onChange={(event) => onUpdate(id, { status: event.target.value as RequirementStatus })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-on-surface-variant leading-relaxed">{requirement.description || "No description yet."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">{requirement.priority}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">{requirement.status}</span>
          </div>
        </>
      )}
    </div>
  );
}

function groupRequirements(requirements: NonFunctionalRequirement[]) {
  const groups = new Map<string, NonFunctionalRequirement[]>();
  requirements.forEach((requirement) => {
    const category = requirement.category || "Quality";
    groups.set(category, [...(groups.get(category) || []), requirement]);
  });
  return Array.from(groups.entries()).map(([category, groupRequirements]) => ({ category, requirements: groupRequirements }));
}

function getCategoryStyle(category: string) {
  return categoryStyles[category] || categoryStyles[category.split(" ")[0]] || { icon: "tune", color: "text-on-surface", bg: "bg-surface-container-high" };
}

function getRequirementKey(requirement: NonFunctionalRequirement) {
  return requirement._id || requirement.localId || requirement.code;
}
