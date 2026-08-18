import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  BacklogPriority,
  ProductBacklogItem,
  getLanguageLabel,
  renumberProductBacklog,
  useProductBacklog,
} from "./hooks/useProductBacklog";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const priorityStyles: Record<BacklogPriority, string> = {
  High: "bg-error/10 text-error border-error/20",
  Medium: "bg-secondary/10 text-secondary border-secondary/20",
  Low: "bg-surface-container text-on-surface-variant border-outline-variant/60",
};

const priorityOptions: BacklogPriority[] = ["High", "Medium", "Low"];

const createEmptyBacklogItem = (index: number, primaryActorOptions: string[]): ProductBacklogItem => ({
  localId: `new-${Date.now()}`,
  code: `1.${index + 1}`,
  epic: "Project",
  actors: [primaryActorOptions[0] || "User"],
  task: "",
  priority: "Medium",
  durationDays: 3,
  sprint: "Sprint 1",
  notes: "",
});

export default function ProductBacklog() {
  const {
    productBacklog,
    setProductBacklog,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    primaryActorOptions,
    targetDurationDays,
    markUnsaved,
    saveProductBacklog,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    productBacklogLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useProductBacklog();

  const [activeEpic, setActiveEpic] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    productBacklog.length > 0 &&
    productBacklogLanguage !== projectLanguage
  );

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
      item.actors.join(" ").toLowerCase().includes(query) ||
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
    const item = createEmptyBacklogItem(productBacklog.length, primaryActorOptions);
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading product backlog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Agile Planning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Product Backlog
            <InfoTooltip
              label="Backlog Specs"
              tooltip="Organize project epics, user stories, assigned actors, sprints, and priorities for your engineering report."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Build a report-ready Product Backlog with epics, primary actors, user stories, and estimation metrics.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveProductBacklog(productBacklog, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Product Backlog"
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
        canRefine={productBacklog.length > 0}
        refineDisabledTitle="Add or generate user stories before refining"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Split into Sprint 1, 2, and 3 with clear acceptance stories')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          <button
            type="button"
            onClick={addBacklogItem}
            disabled={isAiBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>Add Story</span>
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
                Review the generated product backlog before applying it to your project.
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
                Accept backlog
              </button>
            </div>
          </div>
          <BacklogTable
            items={suggestion}
            editingId={null}
            primaryActorOptions={primaryActorOptions}
            readOnly
            onEdit={() => {}}
            onDelete={() => {}}
            onMove={() => {}}
            onUpdate={() => {}}
          />
        </div>
      )}

      {/* Executive Compact Metrics Pill Ribbon */}
      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60">
          {/* Stories Metric */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <HugeiconsIcon icon="list-ordered" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-on-surface leading-none">{productBacklog.length}</span>
                <span className="text-xs font-semibold text-on-surface-variant">User Stories</span>
              </div>
              <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">{highPriorityCount} marked High Priority</span>
            </div>
          </div>

          {/* Planned Duration Metric */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
              <HugeiconsIcon icon="speed" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-on-surface leading-none">{totalDuration}d</span>
                <span className="text-xs font-semibold text-on-surface-variant">Planned Effort</span>
              </div>
              <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
                {targetDurationDays ? `Target: ~${targetDurationDays} days` : "Duration unset in onboarding"}
              </span>
            </div>
          </div>

          {/* Duration Progress / Fit */}
          <div className="flex flex-col justify-center px-2 sm:px-4 py-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-on-surface-variant flex items-center gap-1.5">
                <HugeiconsIcon icon="timeline" size={13} strokeWidth={1.8} className="text-primary" />
                Schedule Fit
              </span>
              <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border", Math.abs(durationGap) <= 10 || !targetDurationDays ? "text-secondary bg-secondary/10 border-secondary/20" : "text-error bg-error/10 border-error/20")}>
                {targetDurationDays ? `${durationGap > 0 ? "+" : ""}${durationGap}d balance` : "Optimal"}
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${targetDurationDays ? durationRatio : 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xs">
        {/* Filter bar & Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-outline-variant/70 bg-surface-container-low/40 shrink-0 min-w-0">
          <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
            <div className="flex min-w-max items-center gap-1.5 pr-2">
              {epics.map((epic) => {
                const isActive = activeEpic === epic.toLowerCase();
                return (
                  <button
                    key={epic}
                    type="button"
                    onClick={() => setActiveEpic(epic.toLowerCase())}
                    className={cn(
                      "inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap border cursor-pointer",
                      isActive
                        ? "bg-primary text-on-primary border-primary shadow-2xs"
                        : "bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-outline-variant/70"
                    )}
                  >
                    {epic}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="px-3 py-1.5 bg-surface border border-outline-variant/80 rounded-lg text-xs text-on-surface outline-none focus:border-primary cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All priorities</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority} Priority
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-60">
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
                placeholder="Search backlog..."
                className="pl-8.5 pr-3 py-1.5 bg-surface border border-outline-variant/80 rounded-lg text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
              />
            </div>
          </div>
        </div>

        {/* Empty State or Table */}
        {productBacklog.length === 0 ? (
          <button
            onClick={addBacklogItem}
            disabled={isAiBusy}
            className="m-6 rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:bg-surface-container-low/40 transition-all py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/80 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-200">
              <HugeiconsIcon icon="add" size={22} strokeWidth={2} />
            </div>
            <span className="font-semibold text-sm text-on-surface">Add First User Story</span>
            <span className="text-xs text-on-surface-variant/70">Or click "Generate with AI" to construct a complete agile breakdown</span>
          </button>
        ) : (
          <BacklogTable
            items={filteredBacklog}
            editingId={editingId}
            primaryActorOptions={primaryActorOptions}
            onEdit={setEditingId}
            onDelete={deleteBacklogItem}
            onMove={moveBacklogItem}
            onUpdate={updateBacklogItem}
          />
        )}
      </div>
    </div>
  );
}

function BacklogTable({
  items,
  editingId,
  primaryActorOptions,
  readOnly = false,
  onEdit,
  onDelete,
  onMove,
  onUpdate,
}: {
  items: ProductBacklogItem[];
  editingId: string | null;
  primaryActorOptions: string[];
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onUpdate: (id: string, updates: Partial<ProductBacklogItem>) => void;
}) {
  const getEpicRowSpan = (index: number) => {
    const epic = items[index]?.epic;
    if (!epic || items[index - 1]?.epic === epic) return 0;

    let span = 1;
    while (items[index + span]?.epic === epic) {
      span += 1;
    }

    return span;
  };

  const toggleActor = (item: ProductBacklogItem, actor: string) => {
    const hasActor = item.actors.includes(actor);
    const actors = hasActor
      ? item.actors.filter((itemActor) => itemActor !== actor)
      : [...item.actors, actor];

    return actors.length ? actors : [actor];
  };

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full min-w-[940px] text-left border-collapse">
        <thead className="bg-surface-container-low/60 sticky top-0 z-10">
          <tr>
            <th className="w-[180px] px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Epic</th>
            <th className="w-[80px] px-4 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">ID</th>
            <th className="w-[180px] px-4 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">As a</th>
            <th className="px-5 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">I want (User Story)</th>
            <th className="w-[120px] px-4 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Sprint</th>
            <th className="w-[120px] px-4 py-2.5 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
            <th className="w-[120px] px-4 py-2.5 border-b border-outline-variant/60 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-xs text-on-surface-variant/70">
                No matching backlog stories found.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const id = getBacklogKey(item);
              const isEditing = editingId === id;
              const epicRowSpan = getEpicRowSpan(index);

              return (
                <tr
                  key={id}
                  className={cn(
                    "transition-colors group align-top",
                    isEditing ? "bg-primary/5" : "hover:bg-surface-container-low/30"
                  )}
                >
                  {/* Epic */}
                  {epicRowSpan > 0 && (
                    <td rowSpan={epicRowSpan} className="px-5 py-3.5 border-r border-outline-variant/40 align-top bg-surface-container-lowest/50">
                      {isEditing ? (
                        <input
                          value={item.epic}
                          onChange={(event) => onUpdate(id, { epic: event.target.value })}
                          className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface outline-none focus:border-primary"
                          placeholder="Epic"
                        />
                      ) : (
                        <span className="text-xs font-bold text-on-surface block tracking-tight">{item.epic}</span>
                      )}
                    </td>
                  )}

                  {/* ID */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md inline-flex">
                      {item.code}
                    </span>
                  </td>

                  {/* Actors */}
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      primaryActorOptions.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {primaryActorOptions.map((actor) => (
                            <label key={actor} className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.actors.includes(actor)}
                                onChange={() => onUpdate(id, { actors: toggleActor(item, actor) })}
                                className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                              />
                              {actor}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={item.actors.join("\n")}
                          onChange={(event) =>
                            onUpdate(id, {
                              actors: event.target.value.split(/\r?\n/).map((a) => a.trim()).filter(Boolean),
                            })
                          }
                          className="w-full min-h-[70px] bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface outline-none focus:border-primary resize-y"
                          placeholder="Primary actor"
                        />
                      )
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.actors.map((actor) => (
                          <span key={actor} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/60 text-on-surface-variant">
                            {actor}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* User Story Task & Notes */}
                  <td className="px-5 py-3.5 min-w-[320px]">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={item.task}
                          onChange={(event) => onUpdate(id, { task: event.target.value })}
                          className="w-full min-h-[70px] bg-surface border border-outline-variant/80 rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary resize-y font-medium"
                          placeholder="Create an account."
                          autoFocus
                        />
                        <input
                          value={item.notes}
                          onChange={(event) => onUpdate(id, { notes: event.target.value })}
                          className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                          placeholder="Optional acceptance criteria / notes"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium leading-relaxed text-on-surface">
                          {item.task || "Untitled user story"}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2 pr-6">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Sprint */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        value={item.sprint}
                        onChange={(event) => onUpdate(id, { sprint: event.target.value })}
                        className="w-24 bg-surface border border-outline-variant/80 rounded-lg px-2 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder="Sprint 1"
                      />
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/60 text-on-surface-variant inline-flex items-center">
                        {item.sprint || "Sprint 1"}
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={item.priority}
                        onChange={(event) => onUpdate(id, { priority: event.target.value as BacklogPriority })}
                        className="w-28 bg-surface border border-outline-variant/80 rounded-lg px-2 py-1 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex", priorityStyles[item.priority])}>
                        {item.priority}
                      </span>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
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
                          disabled={index === items.length - 1}
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
                          title={isEditing ? "Save edit" : "Edit user story"}
                        >
                          <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                          title="Delete user story"
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

function getBacklogKey(item: ProductBacklogItem) {
  return item._id || item.localId || item.code;
}

