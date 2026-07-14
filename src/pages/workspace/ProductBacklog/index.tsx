import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  BacklogPriority,
  ProductBacklogItem,
  renumberProductBacklog,
  useProductBacklog,
} from "./hooks/useProductBacklog";

const priorityStyles: Record<BacklogPriority, string> = {
  High: "bg-error-container text-on-error-container border-error/20",
  Medium: "bg-secondary-container text-on-secondary-container border-secondary/20",
  Low: "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
};

const priorityOptions: BacklogPriority[] = ["High", "Medium", "Low"];

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

const createEmptyBacklogItem = (index: number): ProductBacklogItem => ({
  localId: `new-${Date.now()}`,
  code: `PB-${String(index + 1).padStart(2, "0")}`,
  epic: "Project",
  task: "",
  priority: "Medium",
  durationDays: 3,
  sprint: "",
  notes: "",
});

export default function ProductBacklog() {
  const {
    productBacklog,
    setProductBacklog,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    targetDurationDays,
    markUnsaved,
    saveProductBacklog,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useProductBacklog();

  const [activeEpic, setActiveEpic] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const epics = useMemo(() => {
    const uniqueEpics = Array.from(new Set(productBacklog.map((item) => item.epic).filter(Boolean)));
    return ["All", ...uniqueEpics];
  }, [productBacklog]);

  const totalDuration = productBacklog.reduce((sum, item) => sum + Number(item.durationDays || 0), 0);
  const durationGap = targetDurationDays ? totalDuration - targetDurationDays : 0;
  const durationRatio = targetDurationDays ? Math.min(100, Math.round((totalDuration / targetDurationDays) * 100)) : 0;
  const highPriorityCount = productBacklog.filter((item) => item.priority === "High").length;

  const filteredBacklog = productBacklog.filter((item) => {
    const matchesEpic = activeEpic === "all" || item.epic.toLowerCase() === activeEpic;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.code.toLowerCase().includes(query) ||
      item.epic.toLowerCase().includes(query) ||
      item.task.toLowerCase().includes(query) ||
      item.sprint.toLowerCase().includes(query) ||
      item.notes.toLowerCase().includes(query);
    return matchesEpic && matchesPriority && matchesSearch;
  });

  const updateBacklogItem = (id: string, updates: Partial<ProductBacklogItem>) => {
    setProductBacklog((prev) =>
      prev.map((item) => (getBacklogKey(item) === id ? { ...item, ...updates } : item))
    );
    markUnsaved();
  };

  const addBacklogItem = () => {
    const item = createEmptyBacklogItem(productBacklog.length);
    setProductBacklog((prev) => [...prev, item]);
    setEditingId(getBacklogKey(item));
    markUnsaved();
  };

  const deleteBacklogItem = (id: string) => {
    setProductBacklog((prev) => renumberProductBacklog(prev.filter((item) => getBacklogKey(item) !== id)));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  const moveBacklogItem = (id: string, direction: -1 | 1) => {
    setProductBacklog((prev) => {
      const currentIndex = prev.findIndex((item) => getBacklogKey(item) === id);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, item);
      return renumberProductBacklog(next);
    });
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading product backlog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Product Backlog
            <InfoTooltip label="Backlog" tooltip="Organize the project tasks, priorities, and planned durations for your PFE report." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Build a report-ready backlog table that translates your project scope into realistic tasks, priorities, phases, and durations.
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
          <button onClick={() => saveProductBacklog(productBacklog, true)} disabled={saveStatus === "saving" || aiState === "generating"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
          <button onClick={generateWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready"} className={aiButtonClass}>
            {aiState === "generating" ? "Generating..." : "Generate with AI"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || productBacklog.length === 0} className={aiButtonClass}>
            Refine with AI
          </button>
          <button onClick={addBacklogItem} disabled={aiState === "generating"} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Task
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
              <p className="text-body-md text-on-surface-variant">Review the generated product backlog before applying it to your report.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept backlog</button>
            </div>
          </div>
          <BacklogTable items={suggestion} editingId={null} readOnly onEdit={() => {}} onDelete={() => {}} onMove={() => {}} onUpdate={() => {}} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-6">
        <SummaryCard icon="format_list_numbered" label="Tasks" value={productBacklog.length.toString()} helper={`${highPriorityCount} high priority`} />
        <SummaryCard icon="calendar_month" label="Planned duration" value={`${totalDuration} days`} helper={targetDurationDays ? `Target: ~${targetDurationDays} days` : "Set duration in onboarding"} />
        <div className="rounded-lg border border-outline-variant bg-surface p-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-primary">timeline</span>
              <span className="font-label-md text-label-md">Duration fit</span>
            </div>
            <span className={cn("font-label-sm", Math.abs(durationGap) <= 10 || !targetDurationDays ? "text-secondary" : "text-error")}>
              {targetDurationDays ? `${durationGap > 0 ? "+" : ""}${durationGap} days` : "N/A"}
            </span>
          </div>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${durationRatio}%` }} />
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {targetDurationDays ? "AI balances tasks against the onboarding project duration." : "Project duration is missing from onboarding."}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-4 border-b border-outline-variant bg-surface-container-lowest shrink-0 min-w-0">
          <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
            <div className="flex min-w-max items-center gap-2 pr-2">
              {epics.map((epic) => (
                <button
                  key={epic}
                  onClick={() => setActiveEpic(epic.toLowerCase())}
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap border",
                    activeEpic === epic.toLowerCase()
                      ? "bg-primary-container text-primary border-primary/20"
                      : "bg-surface text-on-surface hover:text-primary hover:bg-surface-container-low border-outline-variant"
                  )}
                >
                  {epic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="px-3 py-1.5 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:border-primary">
              <option value="all">All priorities</option>
              {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search backlog..." className="pl-9 pr-4 py-1.5 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-72" />
            </div>
          </div>
        </div>

        {productBacklog.length === 0 ? (
          <button onClick={addBacklogItem} className="m-6 rounded-xl border-2 border-dashed border-outline-variant bg-surface hover:bg-surface-container-low transition-colors py-14 flex flex-col items-center justify-center gap-4 text-on-surface-variant group">
            <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-300">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </div>
            <span className="font-medium">Generate with AI or add your first backlog task.</span>
          </button>
        ) : (
          <BacklogTable items={filteredBacklog} editingId={editingId} onEdit={setEditingId} onDelete={deleteBacklogItem} onMove={moveBacklogItem} onUpdate={updateBacklogItem} />
        )}
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

function BacklogTable({
  items,
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onMove,
  onUpdate,
}: {
  items: ProductBacklogItem[];
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onUpdate: (id: string, updates: Partial<ProductBacklogItem>) => void;
}) {
  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase">ID</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase">Epic / Phase</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase">Task</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase w-32">Priority</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase w-32">Duration</th>
            <th className="px-6 py-3 border-b border-outline-variant text-[11px] font-bold text-on-surface uppercase">Sprint</th>
            <th className="px-6 py-3 border-b border-outline-variant w-32"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">No matching backlog tasks.</td>
            </tr>
          ) : items.map((item) => {
            const id = getBacklogKey(item);
            const isEditing = editingId === id;
            return (
              <tr key={id} className="hover:bg-surface-container-low transition-colors group align-top">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-mono font-medium text-primary bg-primary-container/30 px-2 py-1 rounded inline-flex">{item.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <input value={item.epic} onChange={(event) => onUpdate(id, { epic: event.target.value })} className="w-40 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Epic" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-outline-variant/50"></span>
                      {item.epic}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 min-w-[360px]">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea value={item.task} onChange={(event) => onUpdate(id, { task: event.target.value })} className="w-full min-h-[74px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm font-medium" placeholder="Describe the backlog task" />
                      <input value={item.notes} onChange={(event) => onUpdate(id, { notes: event.target.value })} className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Optional notes" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-on-surface">{item.task || "Untitled backlog task"}</span>
                      {item.notes && <span className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 pr-8">{item.notes}</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <select value={item.priority} onChange={(event) => onUpdate(id, { priority: event.target.value as BacklogPriority })} className="w-32 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm">
                      {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  ) : (
                    <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border", priorityStyles[item.priority])}>{item.priority}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <input type="number" min={1} value={item.durationDays} onChange={(event) => onUpdate(id, { durationDays: Number(event.target.value) })} className="w-24 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" />
                  ) : (
                    <span className="font-label-md text-on-surface">{item.durationDays} day{item.durationDays === 1 ? "" : "s"}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <input value={item.sprint} onChange={(event) => onUpdate(id, { sprint: event.target.value })} className="w-32 bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-sm" placeholder="Sprint / Phase" />
                  ) : (
                    <span className="text-sm text-on-surface-variant">{item.sprint || "Unassigned"}</span>
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

function getBacklogKey(item: ProductBacklogItem) {
  return item._id || item.localId || item.code;
}
