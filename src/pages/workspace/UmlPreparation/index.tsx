import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  UmlClass,
  UmlPreparation as UmlPreparationType,
  UmlRelationship,
  buildActivityMarkup,
  buildClassDiagramPlantUml,
  buildClassPlantUml,
  buildSequenceMarkup,
  buildUseCaseMarkup,
  getLanguageLabel,
  useUmlPreparation,
} from "./hooks/useUmlPreparation";
import PlantUmlRenderer from "@/components/ui/PlantUmlRenderer";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const diagrams = [
  { id: "usecase", name: "Use Case Diagram", icon: "person-play" },
  { id: "class", name: "Class Diagram", icon: "schema" },
  { id: "sequence", name: "Sequence Diagram", icon: "sync-alt" },
  { id: "activity", name: "Activity Diagram", icon: "workflow" },
];

const createEmptyClass = (): UmlClass => ({
  localId: `class-${Date.now()}`,
  name: "NewClass",
  type: "Class",
  description: "",
  attributes: [],
  methods: [],
});

export default function UmlPreparation() {
  const {
    umlPreparation,
    setUmlPreparation,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveUmlPreparation,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    umlPreparationLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useUmlPreparation();

  const [activeDiagram, setActiveDiagram] = useState("class");
  const [activeView, setActiveView] = useState("diagram");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    umlPreparation.classes.length > 0 &&
    umlPreparationLanguage !== projectLanguage
  );

  const updatePreparation = (updater: (current: UmlPreparationType) => UmlPreparationType) => {
    setUmlPreparation((current) => updater(current));
    markUnsaved();
  };

  const addClass = () => {
    const umlClass = createEmptyClass();
    updatePreparation((current) => ({ ...current, classes: [...current.classes, umlClass] }));
    setEditingClassId(getClassKey(umlClass));
  };

  const currentInfo = getDiagramInfo(activeDiagram, umlPreparation);
  const activeDiagramObj = diagrams.find((d) => d.id === activeDiagram);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">Loading UML preparation...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1520px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Architecture Modeling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            UML Preparation
            <InfoTooltip
              label="UML Architecture"
              tooltip="Generate, refine, and edit Use Case, Class, Sequence, and Activity diagrams rendered directly with PlantUML."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Design and generate system architecture models with interactive PlantUML rendering and entity editing.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveUmlPreparation(umlPreparation)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="UML Preparation"
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={() => generateWithAi(activeDiagram)}
        onRefine={(instructions) => refineWithAi(instructions, activeDiagram)}
        onTranslate={translateWithAi}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canRefine={true}
        refinePlaceholder={`Tell AI what you'd like to refine in the ${activeDiagramObj?.name || "diagram"} (e.g. 'Add JWT Auth middleware and RefreshToken entity')...`}
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          activeDiagram === "class" && activeView === "elements" ? (
            <button
              type="button"
              onClick={addClass}
              disabled={isAiBusy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
            >
              <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
              <span>Add Class</span>
            </button>
          ) : undefined
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

      {/* AI Suggestion Panel */}
      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon="ai-spark" size={18} strokeWidth={1.8} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">AI suggestion ready for {activeDiagramObj?.name}</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">Review and accept the generated diagram model.</p>
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
                Accept suggestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Fixed Left Nav + Full Width Right Diagram Panel */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Fixed Diagram Navigation Sidebar */}
        <div className="w-full lg:w-60 flex flex-col gap-2 shrink-0">
          <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 px-1.5">Diagrams</h3>
          {diagrams.map((diag) => {
            const isActive = activeDiagram === diag.id;
            return (
              <button
                key={diag.id}
                type="button"
                onClick={() => setActiveDiagram(diag.id)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 w-full text-left cursor-pointer border",
                  isActive
                    ? "bg-primary text-on-primary border-primary shadow-2xs"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/70 hover:bg-surface-container hover:text-on-surface"
                )}
              >
                <HugeiconsIcon icon={diag.icon} size={18} strokeWidth={1.8} />
                <span>{diag.name}</span>
              </button>
            );
          })}

          <div className="mt-3 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/70">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
              <HugeiconsIcon icon="ai-spark" size={16} strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold text-on-surface mb-1">Architectural Precision</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Each diagram is generated and refined independently with synced PlantUML rendering.
            </p>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl flex flex-col overflow-hidden shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border-b border-outline-variant/70 bg-surface-container-low/40 gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <HugeiconsIcon icon={activeDiagramObj?.icon || "schema"} size={18} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-on-surface truncate tracking-tight">{activeDiagramObj?.name}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary font-semibold">
                  <HugeiconsIcon icon="check-circle" size={13} strokeWidth={1.8} />
                  Synced with Requirements
                </span>
              </div>
            </div>

            {/* View Mode Toggle Pill */}
            <div className="flex bg-surface border border-outline-variant/80 rounded-lg p-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView("diagram")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === "diagram"
                    ? "bg-primary text-on-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <HugeiconsIcon icon="visibility" size={14} strokeWidth={1.8} />
                Diagram
              </button>
              <button
                type="button"
                onClick={() => setActiveView("elements")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === "elements"
                    ? "bg-primary text-on-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <HugeiconsIcon icon="edit" size={14} strokeWidth={1.8} />
                Entities
              </button>
              <button
                type="button"
                onClick={() => setActiveView("code")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                  activeView === "code"
                    ? "bg-primary text-on-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <HugeiconsIcon icon="code" size={14} strokeWidth={1.8} />
                Markup
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-surface-container-low/20 relative">
            {activeView === "diagram" ? (
              <PlantUmlRenderer markup={currentInfo.markup} diagramName={`${activeDiagram}-diagram`} />
            ) : activeView === "elements" ? (
              <div className="flex flex-col gap-6">
                {activeDiagram === "class" && (
                  <ClassElements
                    umlPreparation={umlPreparation}
                    editingClassId={editingClassId}
                    setEditingClassId={setEditingClassId}
                    updatePreparation={updatePreparation}
                    addClass={addClass}
                  />
                )}
                {activeDiagram === "usecase" && (
                  <UseCaseElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />
                )}
                {activeDiagram === "sequence" && (
                  <SequenceElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />
                )}
                {activeDiagram === "activity" && (
                  <ActivityElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />
                )}
              </div>
            ) : (
              <MarkupPanel title={currentInfo.markupTitle} markup={currentInfo.markup} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassElements({ umlPreparation, editingClassId, setEditingClassId, updatePreparation, addClass }: { umlPreparation: UmlPreparationType; editingClassId: string | null; setEditingClassId: (id: string | null) => void; updatePreparation: (updater: (current: UmlPreparationType) => UmlPreparationType) => void; addClass: () => void; }) {
  const updateClass = (id: string, updates: Partial<UmlClass>) => updatePreparation((current) => ({ ...current, classes: current.classes.map((umlClass) => getClassKey(umlClass) === id ? { ...umlClass, ...updates } : umlClass) }));
  const deleteClass = (id: string) => updatePreparation((current) => {
    const deleted = current.classes.find((umlClass) => getClassKey(umlClass) === id)?.name;
    return { ...current, classes: current.classes.filter((umlClass) => getClassKey(umlClass) !== id), relationships: current.relationships.filter((rel) => rel.source !== deleted && rel.target !== deleted) };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {umlPreparation.classes.map((umlClass) => {
        const id = getClassKey(umlClass);
        const isEditing = editingClassId === id;
        return (
          <div key={id} className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[18px]">data_object</span>
                {isEditing ? <input value={umlClass.name} onChange={(event) => updateClass(id, { name: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 outline-none focus:border-primary font-bold min-w-0" /> : <span className="font-bold text-on-surface">{umlClass.name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? <input value={umlClass.type} onChange={(event) => updateClass(id, { type: event.target.value })} className="w-32 bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs outline-none focus:border-primary" /> : <span className="text-[10px] uppercase font-bold text-outline-variant tracking-wider bg-surface-container px-2 py-0.5 rounded">{umlClass.type}</span>}
                <button onClick={() => setEditingClassId(isEditing ? null : id)} className="text-outline-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span></button>
                <button onClick={() => deleteClass(id)} className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {isEditing && <textarea value={umlClass.description} onChange={(event) => updateClass(id, { description: event.target.value })} className="w-full min-h-[70px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder="Class responsibility" />}
              <EditableList title="Attributes" icon="remove" items={umlClass.attributes} isEditing={isEditing} onChange={(attributes) => updateClass(id, { attributes })} />
              <EditableList title="Methods" icon="function" items={umlClass.methods} isEditing={isEditing} onChange={(methods) => updateClass(id, { methods })} />
              <details className="border-t border-outline-variant/50 pt-3">
                <summary className="text-xs font-bold text-primary cursor-pointer">PlantUML for this class</summary>
                <pre className="mt-2 bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-3 overflow-x-auto text-xs">{buildClassPlantUml(umlClass, umlPreparation.relationships)}</pre>
              </details>
            </div>
          </div>
        );
      })}
      <button onClick={addClass} className="min-h-[200px] border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors bg-surface/50">
        <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container-lowest"><span className="material-symbols-outlined">add</span></div>
        <span className="text-sm font-medium">Add New Class</span>
      </button>
      <RelationshipEditor umlPreparation={umlPreparation} updatePreparation={updatePreparation} />
    </div>
  );
}

function EditableList({ title, icon, items, isEditing, onChange }: { title: string; icon: string; items: string[]; isEditing: boolean; onChange: (items: string[]) => void }) {
  return (
    <div className="border-t border-outline-variant/50 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{icon}</span>{title}</h4>
      {isEditing ? <textarea value={items.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} className="w-full min-h-[90px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm font-mono" placeholder="One item per line" /> : (
        <ul className="flex flex-col gap-1 text-sm font-mono text-on-surface">{(items.length ? items : ["No items yet."]).map((item, index) => <li key={`${item}-${index}`} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-outline"></span>{item}</li>)}</ul>
      )}
    </div>
  );
}

function RelationshipEditor({ umlPreparation, updatePreparation }: { umlPreparation: UmlPreparationType; updatePreparation: (updater: (current: UmlPreparationType) => UmlPreparationType) => void }) {
  const addRelationship = () => {
    const first = umlPreparation.classes[0]?.name || "";
    const second = umlPreparation.classes[1]?.name || first;
    updatePreparation((current) => ({ ...current, relationships: [...current.relationships, { localId: `rel-${Date.now()}`, source: first, target: second, type: "association", label: "", sourceMultiplicity: "", targetMultiplicity: "" }] }));
  };
  const updateRelationship = (id: string, updates: Partial<UmlRelationship>) => updatePreparation((current) => ({ ...current, relationships: current.relationships.map((relationship) => getRelKey(relationship) === id ? { ...relationship, ...updates } : relationship) }));

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col lg:col-span-2">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between"><span className="font-bold text-on-surface">Relationships</span><button onClick={addRelationship} className="text-primary text-sm font-bold">Add</button></div>
      <div className="p-4 flex flex-col gap-2">
        {umlPreparation.relationships.map((relationship) => {
          const id = getRelKey(relationship);
          return <div key={id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_1fr_auto] gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
            <select value={relationship.source} onChange={(event) => updateRelationship(id, { source: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm">{umlPreparation.classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
            <select value={relationship.type} onChange={(event) => updateRelationship(id, { type: event.target.value as UmlRelationship["type"] })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm"><option value="association">association</option><option value="inheritance">inheritance</option><option value="composition">composition</option><option value="aggregation">aggregation</option><option value="dependency">dependency</option></select>
            <select value={relationship.target} onChange={(event) => updateRelationship(id, { target: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm">{umlPreparation.classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
            <input value={relationship.label} onChange={(event) => updateRelationship(id, { label: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm" placeholder="label" />
            <button onClick={() => updatePreparation((current) => ({ ...current, relationships: current.relationships.filter((rel) => getRelKey(rel) !== id) }))} className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
          </div>;
        })}
      </div>
    </div>
  );
}

function UseCaseElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  const useCase = umlPreparation.useCase;

  const updateUseCase = (updates: Partial<typeof useCase>) => {
    updatePreparation((current) => ({
      ...current,
      useCase: { ...current.useCase, ...updates },
    }));
  };

  const addRelation = () => {
    const src = useCase.useCases[0] || "UseCase1";
    const tgt = useCase.useCases[1] || src;
    updateUseCase({
      useCaseRelations: [
        ...(useCase.useCaseRelations || []),
        { source: src, target: tgt, type: "include" },
      ],
    });
  };

  const updateRelation = (index: number, updates: Partial<{ source: string; target: string; type: "include" | "extend" }>) => {
    const list = [...(useCase.useCaseRelations || [])];
    list[index] = { ...list[index], ...updates };
    updateUseCase({ useCaseRelations: list });
  };

  const removeRelation = (index: number) => {
    updateUseCase({
      useCaseRelations: (useCase.useCaseRelations || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* System Boundary Configuration */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">System Boundary Name</label>
          <input
            value={useCase.systemName || ""}
            onChange={(e) => updateUseCase({ systemName: e.target.value })}
            placeholder="e.g. Smart PFE Platform"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full sm:w-80"
          />
        </div>
        <p className="text-xs text-on-surface-variant max-w-sm">
          Use cases are enclosed inside this boundary box. Primary actors appear on the left, secondary external services on the right.
        </p>
      </div>

      {/* Actors & Use Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SimpleList
          title="Primary Actors (Left)"
          items={useCase.primaryActors || []}
          onChange={(primaryActors) => updateUseCase({ primaryActors, actors: Array.from(new Set([...primaryActors, ...(useCase.secondaryActors || [])])) })}
          placeholder="e.g. Student&#10;Mentor&#10;Admin"
        />
        <SimpleList
          title="Secondary Actors (Right)"
          items={useCase.secondaryActors || []}
          onChange={(secondaryActors) => updateUseCase({ secondaryActors, actors: Array.from(new Set([...(useCase.primaryActors || []), ...secondaryActors])) })}
          placeholder="e.g. PaymentGateway&#10;NotificationService&#10;AIService"
        />
        <SimpleList
          title="Use Cases (Inside Box)"
          items={useCase.useCases || []}
          onChange={(useCases) => updateUseCase({ useCases })}
          placeholder="e.g. Sign In&#10;Submit PFE Topic&#10;Review Proposal&#10;Process Payment"
        />
      </div>

      {/* Include & Extend Relationships */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            <span className="font-bold text-on-surface text-sm">Use Case Relationships (&lt;&lt;include&gt;&gt; &amp; &lt;&lt;extend&gt;&gt;)</span>
          </div>
          <button onClick={addRelation} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Relation
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {(useCase.useCaseRelations || []).length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-2">No include/extend relations defined. Click "Add Relation" to connect use cases.</p>
          ) : (
            (useCase.useCaseRelations || []).map((rel, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_130px_1fr_auto] gap-2 p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/50 items-center">
                <select
                  value={rel.source}
                  onChange={(e) => updateRelation(i, { source: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs"
                >
                  {(useCase.useCases || []).map((uc) => (
                    <option key={uc} value={uc}>{uc}</option>
                  ))}
                </select>
                <select
                  value={rel.type}
                  onChange={(e) => updateRelation(i, { type: e.target.value as "include" | "extend" })}
                  className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs font-semibold text-primary"
                >
                  <option value="include">&lt;&lt;include&gt;&gt;</option>
                  <option value="extend">&lt;&lt;extend&gt;&gt;</option>
                </select>
                <select
                  value={rel.target}
                  onChange={(e) => updateRelation(i, { target: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs"
                >
                  {(useCase.useCases || []).map((uc) => (
                    <option key={uc} value={uc}>{uc}</option>
                  ))}
                </select>
                <button onClick={() => removeRelation(i)} className="text-outline-variant hover:text-error p-1">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SequenceElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  const seq = umlPreparation.sequence;

  const updateSeq = (updates: Partial<typeof seq>) => {
    updatePreparation((current) => ({
      ...current,
      sequence: { ...current.sequence, ...updates },
    }));
  };

  const participantNames = (seq.participants || []).map((p) => (typeof p === "string" ? p : p.name));

  const addMessage = () => {
    const s = participantNames[0] || "User";
    const t = participantNames[1] || s;
    updateSeq({
      messages: [...(seq.messages || []), { source: s, target: t, message: "Action request", response: false, type: "sync" }],
    });
  };

  const updateMessage = (index: number, updates: Partial<typeof seq.messages[0]>) => {
    const list = [...(seq.messages || [])];
    list[index] = { ...list[index], ...updates };
    updateSeq({ messages: list });
  };

  const removeMessage = (index: number) => {
    updateSeq({ messages: (seq.messages || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Scenario Title */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">Scenario Title</label>
        <input
          value={seq.scenario || ""}
          onChange={(e) => updateSeq({ scenario: e.target.value })}
          placeholder="e.g. Core Authentication & Project Submission Flow"
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full"
        />
      </div>

      {/* Participants & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        {/* Participants */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface text-sm">
            Architectural Participants
          </div>
          <div className="p-4">
            <textarea
              value={(seq.participants || []).map((p) => (typeof p === "string" ? p : `${p.name} (${p.type || "participant"})`)).join("\n")}
              onChange={(e) => {
                const list = e.target.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                  const match = line.match(/^(.+?)\s*\((actor|boundary|control|entity|database|participant)\)$/i);
                  if (match) return { name: match[1].trim(), type: match[2].toLowerCase() };
                  return { name: line, type: "participant" };
                });
                updateSeq({ participants: list });
              }}
              className="w-full min-h-[260px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-xs font-mono"
              placeholder={"User (actor)\nFrontend (boundary)\nAuthController (control)\nDatabase (database)"}
            />
            <p className="text-[11px] text-on-surface-variant mt-2">
              Tip: Format as <code>Name (type)</code> where type can be: actor, boundary, control, entity, database.
            </p>
          </div>
        </div>

        {/* Message Sequence */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
            <span className="font-bold text-on-surface text-sm">Sequential Message Flow</span>
            <button onClick={addMessage} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Message
            </button>
          </div>
          <div className="p-4 flex flex-col gap-2 max-h-[350px] overflow-y-auto">
            {(seq.messages || []).map((msg, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-xs">
                <span className="font-mono text-outline-variant text-[11px] w-5 text-center">{i + 1}</span>
                <input
                  value={msg.source}
                  onChange={(e) => updateMessage(i, { source: e.target.value })}
                  className="w-24 bg-surface border border-outline-variant rounded px-1.5 py-1 font-semibold"
                  placeholder="Source"
                />
                <span className="material-symbols-outlined text-[14px] text-outline-variant">arrow_forward</span>
                <input
                  value={msg.target}
                  onChange={(e) => updateMessage(i, { target: e.target.value })}
                  className="w-24 bg-surface border border-outline-variant rounded px-1.5 py-1 font-semibold"
                  placeholder="Target"
                />
                <input
                  value={msg.message}
                  onChange={(e) => updateMessage(i, { message: e.target.value })}
                  className="flex-1 bg-surface border border-outline-variant rounded px-2 py-1 font-mono"
                  placeholder="Message / Method Call"
                />
                <label className="flex items-center gap-1 text-[11px] text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(msg.response)}
                    onChange={(e) => updateMessage(i, { response: e.target.checked })}
                    className="rounded"
                  />
                  Return
                </label>
                <button onClick={() => removeMessage(i)} className="text-outline-variant hover:text-error p-1">
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alternative / Error Flow */}
      {seq.altFlow && (
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline-variant mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            Alternative &amp; Error Handling Branch (alt / else)
          </h4>
          <input
            value={seq.altFlow.condition || ""}
            onChange={(e) => updateSeq({ altFlow: { ...seq.altFlow!, condition: e.target.value } })}
            placeholder="e.g. Invalid credentials or validation failure"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary mb-2 font-medium"
          />
        </div>
      )}
    </div>
  );
}

function ActivityElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  const activity = umlPreparation.activity;

  const updateActivity = (updates: Partial<typeof activity>) => {
    updatePreparation((current) => ({
      ...current,
      activity: { ...current.activity, ...updates },
    }));
  };

  const addActionStep = () => {
    updateActivity({
      steps: [...(activity.steps || []), { type: "action", label: "New action step" }],
    });
  };

  const addDecisionStep = () => {
    updateActivity({
      steps: [
        ...(activity.steps || []),
        {
          type: "decision",
          condition: "Condition check?",
          thenBranch: "Success action",
          elseBranch: "Error / Retry action",
        },
      ],
    });
  };

  const updateStep = (index: number, updates: Partial<typeof activity.steps[0]>) => {
    const list = [...(activity.steps || [])];
    list[index] = { ...list[index], ...updates };
    updateActivity({ steps: list });
  };

  const removeStep = (index: number) => {
    updateActivity({ steps: (activity.steps || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Workflow Title */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">Workflow Title</label>
        <input
          value={activity.workflowTitle || ""}
          onChange={(e) => updateActivity({ workflowTitle: e.target.value })}
          placeholder="e.g. Proposal Validation & Milestone Review Process"
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full"
        />
      </div>

      {/* Steps List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">schema</span>
            <span className="font-bold text-on-surface text-sm">Workflow Steps &amp; Decision Points</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addActionStep} className="px-3 py-1 bg-surface border border-outline-variant rounded text-xs font-bold hover:bg-surface-container flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">add</span> Add Action
            </button>
            <button onClick={addDecisionStep} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold hover:bg-primary/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">alt_route</span> Add Decision (if/else)
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {(activity.steps || []).length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-2">No structured steps defined yet. Click "Add Action" or "Add Decision".</p>
          ) : (
            (activity.steps || []).map((step, i) => (
              <div key={i} className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-outline-variant">{i + 1}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${step.type === "decision" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-surface-container text-on-surface-variant"}`}>
                      {step.type === "decision" ? "Decision Point" : "Action Step"}
                    </span>
                  </div>
                  <button onClick={() => removeStep(i)} className="text-outline-variant hover:text-error p-1">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                {step.type === "action" ? (
                  <input
                    value={step.label || ""}
                    onChange={(e) => updateStep(i, { label: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                    placeholder="Describe action..."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block mb-1">Condition</span>
                      <input
                        value={step.condition || ""}
                        onChange={(e) => updateStep(i, { condition: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary font-medium"
                        placeholder="e.g. Validation successful?"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">Yes / Then Branch</span>
                      <input
                        value={step.thenBranch || ""}
                        onChange={(e) => updateStep(i, { thenBranch: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder="e.g. Proceed to generation"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-error uppercase tracking-wider block mb-1">No / Else Branch</span>
                      <input
                        value={step.elseBranch || ""}
                        onChange={(e) => updateStep(i, { elseBranch: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder="e.g. Return error message"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type SimpleElementsProps = { umlPreparation: UmlPreparationType; updatePreparation: (updater: (current: UmlPreparationType) => UmlPreparationType) => void };

function SimpleList({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface text-sm">{title}</div>
      <div className="p-4">
        <textarea
          value={items.join("\n")}
          onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
          className="w-full min-h-[160px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-xs font-mono"
          placeholder={placeholder || "One item per line"}
        />
      </div>
    </div>
  );
}

function MarkupPanel({ title, markup }: { title: string; markup: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(markup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-on-surface">{title}</span>
        <span className="text-on-surface-variant">Generated from your entities</span>
      </div>
      <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-outline-variant p-4 overflow-hidden relative group font-mono text-sm">
        <pre className="text-[#d4d4d4] h-full overflow-y-auto">{markup}</pre>
        <button
          onClick={copy}
          className={cn(
            "absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200",
            copied
              ? "bg-green-500/20 text-green-400"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          )}
        >
          <span className="material-symbols-outlined text-[16px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function getDiagramInfo(activeDiagram: string, umlPreparation: UmlPreparationType) {
  if (activeDiagram === "usecase") return { description: "Define the system boundary, primary/secondary actors, and actions with <<include>> and <<extend>> relations.", markupTitle: "PlantUML Markup", markup: buildUseCaseMarkup(umlPreparation) };
  if (activeDiagram === "sequence") return { description: "Define multi-tier architectural participants, message flows, activations, and alternative paths.", markupTitle: "PlantUML Markup", markup: buildSequenceMarkup(umlPreparation) };
  if (activeDiagram === "activity") return { description: "Map core business workflows with decision diamonds (if/else), actions, and terminal endpoints.", markupTitle: "PlantUML Markup", markup: buildActivityMarkup(umlPreparation) };
  return { description: "Define domain entities with attributes, typed methods, and standard UML relationships.", markupTitle: "PlantUML Markup", markup: buildClassDiagramPlantUml(umlPreparation) };
}

function getClassKey(umlClass: UmlClass) {
  return umlClass._id || umlClass.localId || umlClass.name;
}

function getRelKey(relationship: UmlRelationship) {
  return relationship._id || relationship.localId || `${relationship.source}-${relationship.target}-${relationship.type}`;
}

