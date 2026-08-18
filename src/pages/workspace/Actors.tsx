import { useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { Actor, ActorType, getLanguageLabel, useActors } from "./Actors/hooks/useActors";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const actorTypeOptions: { value: ActorType; label: string }[] = [
  { value: "primary", label: "Acteur principal" },
  { value: "external", label: "Acteur externe" },
];

const iconOptions = [
  "person",
  "school",
  "admin-panel-settings",
  "supervisor-account",
  "business-center",
  "api",
  "devices",
  "database",
  "sensors",
  "smart-toy",
];

const createEmptyActor = (): Actor => ({
  localId: `new-${Date.now()}`,
  name: "",
  description: "",
  type: "primary",
  icon: "person",
});

export default function Actors() {
  const {
    actors,
    setActors,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveActors,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    actorsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useActors();

  const [editingId, setEditingId] = useState<string | null>(null);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    actors.length > 0 &&
    actorsLanguage !== projectLanguage
  );

  const updateActor = (id: string, updates: Partial<Actor>) => {
    setActors((prev) =>
      prev.map((actor) =>
        getActorKey(actor) === id ? { ...actor, ...updates } : actor
      )
    );
    markUnsaved();
  };

  const handleAddActor = () => {
    const actor = createEmptyActor();
    setActors((prev) => [...prev, actor]);
    setEditingId(getActorKey(actor));
    markUnsaved();
  };

  const handleDeleteActor = (id: string) => {
    setActors((prev) => prev.filter((actor) => getActorKey(actor) !== id));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading actors...</p>
      </div>
    );
  }

  const primaryActors = actors.filter((actor) => actor.type === "primary");
  const externalActors = actors.filter((actor) => actor.type === "external");

  return (
    <div className="max-w-[1060px] mx-auto w-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Context & Scope</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Actors & Stakeholders
            <InfoTooltip
              label="Actors & Roles"
              tooltip="Identify all users and external systems interacting with your application. These actors will form the basis of your product backlog and use case diagrams."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Define the direct human users, external services, or automated hardware roles that interact with your system.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveActors(actors, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Actors & Stakeholders"
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
        canRefine={actors.length > 0}
        refineDisabledTitle="Add or generate actors before refining"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Add a System Admin and specify hardware sensors')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          <button
            type="button"
            onClick={handleAddActor}
            disabled={isAiBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>Add Actor</span>
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
              <p className="text-xs text-on-surface-variant mt-0.5">Review the generated actors before accepting and applying them.</p>
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
                Accept actors
              </button>
            </div>
          </div>
          <ActorSections
            actors={suggestion}
            editingId={null}
            readOnly
            onEdit={() => {}}
            onDelete={() => {}}
            onUpdate={() => {}}
          />
        </div>
      )}

      <div className="space-y-6">
        <ActorSections
          actors={primaryActors}
          title="Primary Actors"
          subtitle="Direct human end-users and primary stakeholders"
          badgeText="Human"
          editingId={editingId}
          onEdit={setEditingId}
          onDelete={handleDeleteActor}
          onUpdate={updateActor}
        />
        <ActorSections
          actors={externalActors}
          title="External Actors"
          subtitle="Third-party services, APIs, hardware sensors, or subsystems"
          badgeText="System / API"
          editingId={editingId}
          onEdit={setEditingId}
          onDelete={handleDeleteActor}
          onUpdate={updateActor}
        />
      </div>
    </div>
  );
}

function ActorSections({
  actors,
  title,
  subtitle,
  badgeText,
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onUpdate,
}: {
  actors: Actor[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Actor>) => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl overflow-hidden shadow-2xs">
      {title && (
        <div className="px-5 py-3.5 border-b border-outline-variant/70 bg-surface-container-low/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface tracking-tight">{title}</h3>
              {badgeText && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/60">
                  {badgeText}
                </span>
              )}
              <span className="text-xs font-mono font-semibold text-on-surface-variant/80 ml-1">
                ({actors.length})
              </span>
            </div>
            {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="hidden md:grid grid-cols-[220px_minmax(0,1fr)_130px_90px] gap-4 px-5 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
        <div>Actor Name & Icon</div>
        <div>Description</div>
        <div>Type</div>
        <div className="text-right">Actions</div>
      </div>

      <div className="divide-y divide-outline-variant/60">
        {actors.length === 0 ? (
          <div className="px-6 py-10 text-center text-on-surface-variant flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mb-2.5 text-on-surface-variant/70">
              <HugeiconsIcon icon="group" size={20} strokeWidth={1.6} />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">No actors in this category yet.</p>
            <p className="text-xs text-on-surface-variant/70 mt-0.5">Click "Add Actor" or "Generate with AI" to populate.</p>
          </div>
        ) : (
          actors.map((actor) => {
            const id = getActorKey(actor);
            const isEditing = editingId === id;

            return (
              <div
                key={id}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_130px_90px] gap-3 md:gap-4 px-5 py-3.5 items-start transition-colors group",
                  isEditing ? "bg-primary/5" : "hover:bg-surface-container-low/30"
                )}
              >
                {/* Actor Name & Icon */}
                <div className="flex items-start gap-3 pt-0.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 border border-outline-variant/60">
                    <HugeiconsIcon icon={actor.icon || "person"} size={16} strokeWidth={1.8} />
                  </div>
                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <input
                        value={actor.name}
                        onChange={(event) => onUpdate(id, { name: event.target.value })}
                        className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Actor name"
                        autoFocus
                      />
                      <select
                        value={actor.icon}
                        onChange={(event) => onUpdate(id, { icon: event.target.value })}
                        className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary capitalize cursor-pointer"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon.replace(/-/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="min-w-0 pt-1">
                      <span className="font-semibold text-sm text-on-surface block truncate">
                        {actor.name || "Untitled actor"}
                      </span>
                      <span className="text-[11px] text-on-surface-variant/70 block truncate capitalize">
                        {actor.icon?.replace(/-/g, " ") || "person"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="text-sm text-on-surface-variant leading-relaxed">
                  {isEditing ? (
                    <textarea
                      value={actor.description}
                      onChange={(event) => onUpdate(id, { description: event.target.value })}
                      className="w-full min-h-[72px] bg-surface border border-outline-variant/80 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                      placeholder="Describe this actor's roles, responsibilities, and permissions..."
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{actor.description || <span className="text-on-surface-variant/50 italic">No description provided.</span>}</p>
                  )}
                </div>

                {/* Type */}
                <div className="pt-0.5">
                  {isEditing ? (
                    <select
                      value={actor.type}
                      onChange={(event) => onUpdate(id, { type: event.target.value as ActorType })}
                      className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                    >
                      {actorTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border",
                      actor.type === "external"
                        ? "bg-secondary/10 text-secondary border-secondary/20"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/60"
                    )}>
                      <HugeiconsIcon icon={actor.type === "external" ? "api" : "person"} size={12} strokeWidth={1.8} />
                      {actor.type === "external" ? "External" : "Primary"}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(isEditing ? null : id)}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                          isEditing
                            ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                            : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                        )}
                        title={isEditing ? "Save edit" : "Edit actor"}
                      >
                        <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                        title="Delete actor"
                      >
                        <HugeiconsIcon icon="delete" size={16} strokeWidth={1.8} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getActorKey(actor: Actor) {
  return actor._id || actor.localId || `${actor.name}-${actor.type}`;
}
