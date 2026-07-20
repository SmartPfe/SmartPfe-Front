import { useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { Actor, ActorType, useActors } from "./Actors/hooks/useActors";

const actorTypeOptions: { value: ActorType; label: string }[] = [
  { value: "primary", label: "Acteur principal" },
  { value: "external", label: "Acteur externe" },
];

const iconOptions = [
  "person",
  "school",
  "admin_panel_settings",
  "supervisor_account",
  "business_center",
  "api",
  "devices",
  "database",
  "sensors",
  "smart_toy",
];

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

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
    suggestion,
    error,
    markUnsaved,
    saveActors,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useActors();

  const [editingId, setEditingId] = useState<string | null>(null);

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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading actors...</p>
      </div>
    );
  }

  const primaryActors = actors.filter((actor) => actor.type === "primary");
  const externalActors = actors.filter((actor) => actor.type === "external");

  return (
    <div className="max-w-[980px] mx-auto w-full pb-32">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 flex items-center">
            Actors & Stakeholders
            <InfoTooltip
              label="Actors"
              tooltip="Identify all users and systems interacting with your application."
            />
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[42rem]">Define the users, external systems, or roles that interact with your proposed solution. These actors will form the basis of your product backlog and use case diagrams.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className={`text-label-sm transition-colors ${
            saveStatus === "saving" ? "text-on-surface-variant" :
            saveStatus === "saved" ? "text-secondary" :
            "text-error"
          }`}>
            {saveStatus === "saving" ? "Autosaving..." :
             saveStatus === "saved" ? "All changes saved" :
             "Unsaved changes"}
          </span>
          <button
            onClick={() => saveActors(actors, true)}
            disabled={saveStatus === "saving" || aiState === "generating"}
            className="px-5 py-2 rounded-md bg-primary text-on-primary text-label-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Save now
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={generateWithAi}
            disabled={aiState === "generating" || aiState === "suggestion_ready"}
            className={aiButtonClass}
          >
            {aiState === "generating" ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate with AI"
            )}
          </button>
          <button
            onClick={refineWithAi}
            disabled={aiState === "generating" || aiState === "suggestion_ready" || actors.length === 0}
            className={aiButtonClass}
          >
            Refine with AI
          </button>
        </div>
        <div>
          <button
            onClick={handleAddActor}
            disabled={aiState === "generating"}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-md text-label-md font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Actor
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary-container/20 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-label-md font-bold text-on-surface">AI suggestion ready</h3>
              <p className="text-body-md text-on-surface-variant">Review the generated actors before applying them.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={discardSuggestion}
                className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low"
              >
                Discard
              </button>
              <button
                onClick={acceptSuggestion}
                className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90"
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

      <ActorSections
        actors={primaryActors}
        title="Primary Actors"
        subtitle="Acteurs principaux"
        editingId={editingId}
        onEdit={setEditingId}
        onDelete={handleDeleteActor}
        onUpdate={updateActor}
      />
      <div className="mt-6">
        <ActorSections
          actors={externalActors}
          title="External Actors"
          subtitle="Acteurs externes (Systèmes ou Matériel)"
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
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onUpdate,
}: {
  actors: Actor[];
  title?: string;
  subtitle?: string;
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Actor>) => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/60">
          <h3 className="font-label-md font-bold text-on-surface">{title}</h3>
          <p className="text-body-md text-on-surface-variant mt-1">{subtitle}</p>
        </div>
      )}
      <div className="hidden md:grid grid-cols-[1fr_2fr_120px_auto] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
        <div>Actor Name</div>
        <div>Description</div>
        <div>Type</div>
        <div className="w-24 text-right">Actions</div>
      </div>

      <div className="divide-y divide-outline-variant">
        {actors.length === 0 ? (
          <div className="px-6 py-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[28px] mb-2">groups</span>
            <p className="font-body-md">No actors in this category yet.</p>
          </div>
        ) : (
          actors.map((actor) => {
            const id = getActorKey(actor);
            const isEditing = editingId === id;

            return (
              <div key={id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_120px_auto] gap-4 px-6 py-4 items-start hover:bg-surface-container-low transition-colors group">
                <div className="font-body-md text-body-md font-medium text-on-surface flex items-start gap-3 pt-1">
                  <span className="material-symbols-outlined text-outline text-[20px] shrink-0">{actor.icon}</span>
                  {isEditing ? (
                    <div className="w-full space-y-2">
                      <input
                        value={actor.name}
                        onChange={(event) => onUpdate(id, { name: event.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary"
                        placeholder="Actor name"
                      />
                      <select
                        value={actor.icon}
                        onChange={(event) => onUpdate(id, { icon: event.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary text-label-sm"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span>{actor.name || "Untitled actor"}</span>
                  )}
                </div>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {isEditing ? (
                    <textarea
                      value={actor.description}
                      onChange={(event) => onUpdate(id, { description: event.target.value })}
                      className="w-full min-h-[80px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y"
                      placeholder="Describe this actor's role"
                    />
                  ) : (
                    actor.description || "No description yet."
                  )}
                </div>
                <div>
                  {isEditing ? (
                    <select
                      value={actor.type}
                      onChange={(event) => onUpdate(id, { type: event.target.value as ActorType })}
                      className="w-full bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary font-label-sm"
                    >
                      {actorTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn(
                      "inline-flex px-2.5 py-1 rounded-md border text-label-sm",
                      actor.type === "external"
                        ? "bg-secondary-container text-on-secondary-container border-secondary/20"
                        : "bg-surface-container text-on-surface-variant border-outline-variant"
                    )}>
                      {actor.type === "external" ? "External" : "Primary"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => onEdit(isEditing ? null : id)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-DEFAULT transition-colors"
                        title={isEditing ? "Done" : "Edit"}
                      >
                        <span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span>
                      </button>
                      <button
                        onClick={() => onDelete(id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
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
