import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  FunctionalRequirement,
  RequirementPriority,
  RequirementStatus,
  getLanguageLabel,
  renumberRequirements,
  useFunctionalRequirements,
} from "./hooks/useFunctionalRequirements";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const priorities: Record<RequirementPriority, string> = {
  "Must Have": "bg-error/10 text-error border-error/20",
  "Should Have": "bg-secondary/10 text-secondary border-secondary/20",
  "Could Have": "bg-primary/10 text-primary border-primary/20",
  "Won't Have": "bg-surface-container text-on-surface-variant border-outline-variant/60",
};

const statuses: Record<RequirementStatus, { color: string; icon: string }> = {
  Approved: { color: "text-secondary", icon: "check-circle" },
  "In Review": { color: "text-primary", icon: "clock" },
  Draft: { color: "text-on-surface-variant", icon: "edit" },
};

const priorityOptions: RequirementPriority[] = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const statusOptions: RequirementStatus[] = ["Draft", "In Review", "Approved"];

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
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveRequirements,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    functionalRequirementsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useFunctionalRequirements();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    requirements.length > 0 &&
    functionalRequirementsLanguage !== projectLanguage
  );

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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading functional requirements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">System Specification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Functional Requirements
            <InfoTooltip
              label="Functional Specs"
              tooltip="Detail the precise functional behaviors, user workflows, and feature rules your system must implement."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Define and organize the functional behaviors and features your system must execute.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveRequirements(requirements, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Functional Requirements"
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={generateWithAi}
        onRefine={refineWithAi}
        onTranslate={translateWithAi}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canRefine={requirements.length > 0}
        refineDisabledTitle="Add or generate requirements before refining"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Group into Auth, Dashboard, and Export modules with MoSCoW priorities')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          <button
            type="button"
            onClick={addRequirement}
            disabled={isAiBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>Add Requirement</span>
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

      {/* AI Suggestion Ready */}
      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon="ai-spark" size={18} strokeWidth={1.8} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">AI suggestion ready</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review the generated functional requirements before applying them.
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
                Accept requirements
              </button>
            </div>
          </div>
          <RequirementsTable
            requirements={suggestion}
            editingId={null}
            readOnly
            onEdit={() => {}}
            onDelete={() => {}}
            onMove={() => {}}
            onUpdate={() => {}}
          />
        </div>
      )}

      {/* Table Container Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xs">
        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-outline-variant/70 bg-surface-container-low/40 shrink-0 min-w-0">
          <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
            <div className="flex min-w-max items-center gap-1.5 pr-2">
              {modules.map((tab) => {
                const isActive = activeTab === tab.toLowerCase();
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={cn(
                      "inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap border cursor-pointer",
                      isActive
                        ? "bg-primary text-on-primary border-primary shadow-2xs"
                        : "bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-outline-variant/70"
                    )}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative shrink-0 w-full sm:w-64">
            <HugeiconsIcon
              icon="search"
              size={15}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search requirements..."
              className="pl-8.5 pr-3 py-1.5 bg-surface border border-outline-variant/80 rounded-lg text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
            />
          </div>
        </div>

        {/* Empty State or Table */}
        {requirements.length === 0 ? (
          <button
            onClick={addRequirement}
            className="m-6 rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:bg-surface-container-low/40 transition-all py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/80 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-200">
              <HugeiconsIcon icon="add" size={22} strokeWidth={2} />
            </div>
            <span className="font-semibold text-sm text-on-surface">Add First Functional Requirement</span>
            <span className="text-xs text-on-surface-variant/70">Or click "Generate with AI" to generate specs based on your project description</span>
          </button>
        ) : (
          <RequirementsTable
            requirements={filteredRequirements}
            editingId={editingId}
            onEdit={setEditingId}
            onDelete={deleteRequirement}
            onMove={moveRequirement}
            onUpdate={updateRequirement}
          />
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
        <thead className="bg-surface-container-low/60 sticky top-0 z-10">
          <tr>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider w-24">ID</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider w-36">Module</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Requirement</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider w-36">Priority</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider w-32">Status</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 w-32 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {requirements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-xs text-on-surface-variant/70">
                No matching requirements found.
              </td>
            </tr>
          ) : (
            requirements.map((requirement, index) => {
              const id = getRequirementKey(requirement);
              const isEditing = editingId === id;
              const statusCfg = statuses[requirement.status] || statuses.Draft;

              return (
                <tr
                  key={id}
                  className={cn(
                    "transition-colors group align-top",
                    isEditing ? "bg-primary/5" : "hover:bg-surface-container-low/30"
                  )}
                >
                  {/* Code */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md inline-flex">
                      {requirement.code}
                    </span>
                  </td>

                  {/* Module */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        value={requirement.module}
                        onChange={(event) => onUpdate(id, { module: event.target.value })}
                        className="w-32 bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder="Module"
                      />
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface-variant inline-flex items-center">
                        {requirement.module}
                      </span>
                    )}
                  </td>

                  {/* Title & Description */}
                  <td className="px-5 py-3.5 min-w-[320px]">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={requirement.title}
                          onChange={(event) => onUpdate(id, { title: event.target.value })}
                          className="w-full bg-surface border border-outline-variant/80 rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface outline-none focus:border-primary"
                          placeholder="Requirement title"
                          autoFocus
                        />
                        <textarea
                          value={requirement.description}
                          onChange={(event) => onUpdate(id, { description: event.target.value })}
                          className="w-full min-h-[72px] bg-surface border border-outline-variant/80 rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary resize-y"
                          placeholder="The system shall..."
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-on-surface tracking-tight">
                          {requirement.title || "Untitled requirement"}
                        </span>
                        <span className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 pr-6">
                          {requirement.description || "No description provided."}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={requirement.priority}
                        onChange={(event) => onUpdate(id, { priority: event.target.value as RequirementPriority })}
                        className="w-32 bg-surface border border-outline-variant/80 rounded-lg px-2 py-1 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex", priorities[requirement.priority])}>
                        {requirement.priority}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={requirement.status}
                        onChange={(event) => onUpdate(id, { status: event.target.value as RequirementStatus })}
                        className="w-28 bg-surface border border-outline-variant/80 rounded-lg px-2 py-1 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", statusCfg.color)}>
                        <HugeiconsIcon icon={statusCfg.icon} size={14} strokeWidth={1.8} />
                        {requirement.status}
                      </span>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    {!readOnly && (
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onMove(id, -1)}
                          disabled={index === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="Move up"
                        >
                          <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={1.8} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(id, 1)}
                          disabled={index === requirements.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="Move down"
                        >
                          <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={1.8} className="rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(isEditing ? null : id)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                            isEditing
                              ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                              : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                          )}
                          title={isEditing ? "Save edit" : "Edit requirement"}
                        >
                          <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                          title="Delete requirement"
                        >
                          <HugeiconsIcon icon="delete" size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function getRequirementKey(requirement: FunctionalRequirement) {
  return requirement._id || requirement.localId || requirement.code;
}

