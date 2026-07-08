import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  FunctionalRequirement,
  RequirementPriority,
  RequirementStatus,
  renumberRequirements,
  useFunctionalRequirements,
} from "./hooks/useFunctionalRequirements";

const priorities: Record<RequirementPriority, string> = {
  "Must Have": "bg-error-container text-on-error-container border-error/20",
  "Should Have": "bg-secondary-container text-on-secondary-container border-secondary/20",
  "Could Have": "bg-primary-container text-on-primary-container border-primary/20",
  "Won't Have": "bg-surface-container-high text-on-surface border-outline-variant/50",
};

const statuses: Record<RequirementStatus, string> = {
  Approved: "text-secondary",
  "In Review": "text-primary",
  Draft: "text-outline",
};

const priorityOptions: RequirementPriority[] = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const statusOptions: RequirementStatus[] = ["Draft", "In Review", "Approved"];

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

const createEmptyRequirement = (index: number): FunctionalRequirement => ({
  localId: `new-${Date.now()}`,
  code: `FR-${String(index + 1).padStart(2, "0")}`,
  module: "Core",
  title: "",
  description: "",
  priority: "Should Have",
  status: "Draft",
});

export default function FunctionalRequirements() {
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
  } = useFunctionalRequirements();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const modules = useMemo(() => {
    const uniqueModules = Array.from(new Set(requirements.map((requirement) => requirement.module).filter(Boolean)));
    return ["All", ...uniqueModules];
  }, [requirements]);

  const filteredRequirements = requirements.filter((requirement) => {
    const matchesTab = activeTab === "all" || requirement.module.toLowerCase() === activeTab;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      requirement.code.toLowerCase().includes(query) ||
      requirement.module.toLowerCase().includes(query) ||
      requirement.title.toLowerCase().includes(query) ||
      requirement.description.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const updateRequirement = (id: string, updates: Partial<FunctionalRequirement>) => {
    setRequirements((prev) =>
      prev.map((requirement) =>
        getRequirementKey(requirement) === id ? { ...requirement, ...updates } : requirement
      )
    );
    markUnsaved();
  };

  const addRequirement = () => {
    const requirement = createEmptyRequirement(requirements.length);
    setRequirements((prev) => [...prev, requirement]);
    setEditingId(getRequirementKey(requirement));
    markUnsaved();
  };

  const deleteRequirement = (id: string) => {
    setRequirements((prev) => renumberRequirements(prev.filter((requirement) => getRequirementKey(requirement) !== id)));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  const moveRequirement = (id: string, direction: -1 | 1) => {
    setRequirements((prev) => {
      const currentIndex = prev.findIndex((requirement) => getRequirementKey(requirement) === id);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, item);
      return renumberRequirements(next);
    });
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading functional requirements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Functional Requirements
            <InfoTooltip label="Func Reqs" tooltip="Specify the exact behaviors and features the system must support." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            List and organize the specific behaviors and functions your system must support. These define what the system is supposed to accomplish.
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
            {aiState === "generating" ? "Generating..." : "Generate with AI"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || requirements.length === 0} className={aiButtonClass}>
            Refine with AI
          </button>
          <button onClick={addRequirement} disabled={aiState === "generating"} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Requirement
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
              <p className="text-body-md text-on-surface-variant">Review the generated functional requirements before applying them.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept requirements</button>
            </div>
          </div>
          <RequirementsTable requirements={suggestion} editingId={null} readOnly onEdit={() => {}} onDelete={() => {}} onMove={() => {}} onUpdate={() => {}} />
        </div>
      )}

      <div className="bg-surface border border-outline-variant rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex gap-2 relative overflow-x-auto">
            {modules.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  activeTab === tab.toLowerCase()
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search FRs..." className="pl-9 pr-4 py-1.5 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full lg:w-64" />
          </div>
        </div>

        {requirements.length === 0 ? (
          <button onClick={addRequirement} className="m-6 rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors py-14 flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
            <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </div>
            <span className="font-medium">Generate with AI or add your first functional requirement.</span>
          </button>
        ) : (
          <RequirementsTable requirements={filteredRequirements} editingId={editingId} onEdit={setEditingId} onDelete={deleteRequirement} onMove={moveRequirement} onUpdate={updateRequirement} />
        )}
      </div>
    </div>
  );
}

function RequirementsTable({
  requirements,
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onMove,
  onUpdate,
}: {
  requirements: FunctionalRequirement[];
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onUpdate: (id: string, updates: Partial<FunctionalRequirement>) => void;
}) {
  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Module</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider w-36">Priority</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 border-b border-outline-variant w-32"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {requirements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">No matching requirements.</td>
            </tr>
          ) : requirements.map((requirement) => {
            const id = getRequirementKey(requirement);
            const isEditing = editingId === id;

            return (
              <tr key={id} className="hover:bg-surface-container-lowest/50 transition-colors group align-top">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-mono font-medium text-primary bg-primary-container/30 px-2 py-1 rounded inline-flex">{requirement.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <input value={requirement.module} onChange={(event) => onUpdate(id, { module: event.target.value })} className="w-40 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Module" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-outline-variant/50"></span>
                      {requirement.module}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 min-w-[320px]">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input value={requirement.title} onChange={(event) => onUpdate(id, { title: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm font-bold" placeholder="Requirement title" />
                      <textarea value={requirement.description} onChange={(event) => onUpdate(id, { description: event.target.value })} className="w-full min-h-[88px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder="The system shall..." />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-on-surface">{requirement.title || "Untitled requirement"}</span>
                      <span className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 pr-8">{requirement.description || "No description yet."}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <select value={requirement.priority} onChange={(event) => onUpdate(id, { priority: event.target.value as RequirementPriority })} className="w-36 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
                      {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  ) : (
                    <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border", priorities[requirement.priority])}>{requirement.priority}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <select value={requirement.status} onChange={(event) => onUpdate(id, { status: event.target.value as RequirementStatus })} className="w-32 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                      <span className={cn("material-symbols-outlined text-[16px]", statuses[requirement.status])}>
                        {requirement.status === "Approved" ? "check_circle" : requirement.status === "In Review" ? "pending" : "edit_document"}
                      </span>
                      {requirement.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {!readOnly && (
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onMove(id, -1)} className="p-1.5 text-outline-variant hover:text-on-surface hover:bg-surface-container rounded-md" title="Move up">
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                      </button>
                      <button onClick={() => onMove(id, 1)} className="p-1.5 text-outline-variant hover:text-on-surface hover:bg-surface-container rounded-md" title="Move down">
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                      </button>
                      <button onClick={() => onEdit(isEditing ? null : id)} className="p-1.5 text-outline-variant hover:text-primary hover:bg-surface-container rounded-md" title={isEditing ? "Done" : "Edit"}>
                        <span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span>
                      </button>
                      <button onClick={() => onDelete(id)} className="p-1.5 text-outline-variant hover:text-error hover:bg-error-container rounded-md" title="Delete">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getRequirementKey(requirement: FunctionalRequirement) {
  return requirement._id || requirement.localId || requirement.code;
}
