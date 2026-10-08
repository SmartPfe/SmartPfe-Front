import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { displayApiMessage } from "@/lib/apiMessage";
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
  { id: "usecase", icon: "person-play" },
  { id: "class", icon: "schema" },
  { id: "sequence", icon: "sync-alt" },
  { id: "activity", icon: "workflow" },
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
  const { t } = useTranslation("design");
  const {
    umlPreparation,
    setUmlPreparation,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    errorKey,
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

  const currentInfo = getDiagramInfo(activeDiagram, umlPreparation, t);
  const activeDiagramObj = diagrams.find((d) => d.id === activeDiagram);
  const activeDiagramName = t(`uml.diagrams.${activeDiagram}`);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">{t("uml.loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1520px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("uml.eyebrow")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            {t("uml.title")}
            <InfoTooltip
              label={t("uml.tooltipLabel")}
              tooltip={t("uml.tooltip")}
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            {t("uml.description")}
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
        moduleName={t("uml.title")}
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
        refinePlaceholder={t("uml.ai.refinePlaceholder", { diagram: activeDiagramName })}
        showTranslate={shouldShowTranslate}
        translateLabel={t("uml.ai.translate", { language: getLanguageLabel(projectLanguage) })}
        primaryAction={
          activeDiagram === "class" && activeView === "elements" ? (
            <button
              type="button"
              onClick={addClass}
              disabled={isAiBusy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
            >
              <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
              <span>{t("uml.addClass")}</span>
            </button>
          ) : undefined
        }
      />

      {(error || errorKey) && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{errorKey ? t(errorKey) : error ? displayApiMessage(error) : ""}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            {t("uml.dismiss")}
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
                <h3 className="text-sm font-bold text-on-surface">{t("uml.suggestionTitle", { diagram: activeDiagramName })}</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{t("uml.suggestionDescription")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={discardSuggestion}
                className="h-8 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                {t("uml.discard")}
              </button>
              <button
                onClick={acceptSuggestion}
                className="h-8 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs cursor-pointer"
              >
                {t("uml.acceptSuggestion")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Fixed Left Nav + Full Width Right Diagram Panel */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Fixed Diagram Navigation Sidebar */}
        <div className="w-full lg:w-60 flex flex-col gap-2 shrink-0">
          <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 px-1.5">{t("uml.diagramsHeading")}</h3>
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
                <span>{t(`uml.diagrams.${diag.id}`)}</span>
              </button>
            );
          })}

          <div className="mt-3 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/70">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
              <HugeiconsIcon icon="ai-spark" size={16} strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold text-on-surface mb-1">{t("uml.architecturalPrecision")}</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {t("uml.diagramSyncDescription")}
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
                <h2 className="font-bold text-sm text-on-surface truncate tracking-tight">{activeDiagramName}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary font-semibold">
                  <HugeiconsIcon icon="check-circle" size={13} strokeWidth={1.8} />
                  {t("uml.syncedWithRequirements")}
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
                {t("uml.views.diagram")}
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
                {t("uml.views.elements")}
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
                {t("uml.views.code")}
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
  const { t } = useTranslation("design");
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
                {isEditing ? <input aria-label={t("uml.class.name")} value={umlClass.name} onChange={(event) => updateClass(id, { name: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 outline-none focus:border-primary font-bold min-w-0" /> : <span className="font-bold text-on-surface">{umlClass.name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? <input aria-label={t("uml.class.type")} value={umlClass.type} onChange={(event) => updateClass(id, { type: event.target.value })} className="w-32 bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs outline-none focus:border-primary" /> : <span className="text-[10px] uppercase font-bold text-outline-variant tracking-wider bg-surface-container px-2 py-0.5 rounded">{umlClass.type}</span>}
                <button aria-label={t(isEditing ? "uml.class.finishEditing" : "uml.class.edit")} onClick={() => setEditingClassId(isEditing ? null : id)} className="text-outline-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">{isEditing ? "check" : "edit"}</span></button>
                <button aria-label={t("uml.class.delete")} onClick={() => deleteClass(id)} className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {isEditing && <textarea aria-label={t("uml.class.responsibility")} value={umlClass.description} onChange={(event) => updateClass(id, { description: event.target.value })} className="w-full min-h-[70px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder={t("uml.class.responsibility")} />}
              <EditableList title={t("uml.class.attributes")} icon="remove" items={umlClass.attributes} isEditing={isEditing} onChange={(attributes) => updateClass(id, { attributes })} />
              <EditableList title={t("uml.class.methods")} icon="function" items={umlClass.methods} isEditing={isEditing} onChange={(methods) => updateClass(id, { methods })} />
              <details className="border-t border-outline-variant/50 pt-3">
                <summary className="text-xs font-bold text-primary cursor-pointer">{t("uml.class.plantUml")}</summary>
                <pre className="mt-2 bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-3 overflow-x-auto text-xs">{buildClassPlantUml(umlClass, umlPreparation.relationships)}</pre>
              </details>
            </div>
          </div>
        );
      })}
      <button onClick={addClass} className="min-h-[200px] border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors bg-surface/50">
        <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container-lowest"><span className="material-symbols-outlined">add</span></div>
        <span className="text-sm font-medium">{t("uml.class.addNew")}</span>
      </button>
      <RelationshipEditor umlPreparation={umlPreparation} updatePreparation={updatePreparation} />
    </div>
  );
}

function EditableList({ title, icon, items, isEditing, onChange }: { title: string; icon: string; items: string[]; isEditing: boolean; onChange: (items: string[]) => void }) {
  const { t } = useTranslation("design");
  return (
    <div className="border-t border-outline-variant/50 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{icon}</span>{title}</h4>
      {isEditing ? <textarea value={items.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} className="w-full min-h-[90px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm font-mono" placeholder={t("uml.class.onePerLine")} /> : (
        <ul className="flex flex-col gap-1 text-sm font-mono text-on-surface">{(items.length ? items : [t("uml.class.noItems")]).map((item, index) => <li key={`${item}-${index}`} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-outline"></span>{item}</li>)}</ul>
      )}
    </div>
  );
}

function RelationshipEditor({ umlPreparation, updatePreparation }: { umlPreparation: UmlPreparationType; updatePreparation: (updater: (current: UmlPreparationType) => UmlPreparationType) => void }) {
  const { t } = useTranslation("design");
  const addRelationship = () => {
    const first = umlPreparation.classes[0]?.name || "";
    const second = umlPreparation.classes[1]?.name || first;
    updatePreparation((current) => ({ ...current, relationships: [...current.relationships, { localId: `rel-${Date.now()}`, source: first, target: second, type: "association", label: "", sourceMultiplicity: "", targetMultiplicity: "" }] }));
  };
  const updateRelationship = (id: string, updates: Partial<UmlRelationship>) => updatePreparation((current) => ({ ...current, relationships: current.relationships.map((relationship) => getRelKey(relationship) === id ? { ...relationship, ...updates } : relationship) }));

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col lg:col-span-2">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between"><span className="font-bold text-on-surface">{t("uml.class.relationships")}</span><button onClick={addRelationship} className="text-primary text-sm font-bold">{t("uml.class.add")}</button></div>
      <div className="p-4 flex flex-col gap-2">
        {umlPreparation.relationships.map((relationship) => {
          const id = getRelKey(relationship);
          return <div key={id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_1fr_auto] gap-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
            <select aria-label={t("uml.class.source")} value={relationship.source} onChange={(event) => updateRelationship(id, { source: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm">{umlPreparation.classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
            <select aria-label={t("uml.class.relationshipType")} value={relationship.type} onChange={(event) => updateRelationship(id, { type: event.target.value as UmlRelationship["type"] })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm">{(["association", "inheritance", "composition", "aggregation", "dependency"] as const).map((type) => <option key={type} value={type}>{t(`uml.class.types.${type}`)}</option>)}</select>
            <select aria-label={t("uml.class.target")} value={relationship.target} onChange={(event) => updateRelationship(id, { target: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm">{umlPreparation.classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
            <input aria-label={t("uml.class.relationshipLabel")} value={relationship.label} onChange={(event) => updateRelationship(id, { label: event.target.value })} className="bg-surface border border-outline-variant rounded-md px-2 py-1 text-sm" placeholder={t("uml.class.relationshipLabel")} />
            <button aria-label={t("uml.class.deleteRelationship")} onClick={() => updatePreparation((current) => ({ ...current, relationships: current.relationships.filter((rel) => getRelKey(rel) !== id) }))} className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
          </div>;
        })}
      </div>
    </div>
  );
}

function UseCaseElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  const { t } = useTranslation("design");
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
          <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">{t("uml.useCase.systemBoundary")}</label>
          <input
            value={useCase.systemName || ""}
            onChange={(e) => updateUseCase({ systemName: e.target.value })}
            placeholder={t("uml.useCase.systemPlaceholder")}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full sm:w-80"
          />
        </div>
        <p className="text-xs text-on-surface-variant max-w-sm">
          {t("uml.useCase.systemHelp")}
        </p>
      </div>

      {/* Actors & Use Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SimpleList
          title={t("uml.useCase.primaryActors")}
          items={useCase.primaryActors || []}
          onChange={(primaryActors) => updateUseCase({ primaryActors, actors: Array.from(new Set([...primaryActors, ...(useCase.secondaryActors || [])])) })}
          placeholder={t("uml.useCase.primaryActorsPlaceholder")}
        />
        <SimpleList
          title={t("uml.useCase.secondaryActors")}
          items={useCase.secondaryActors || []}
          onChange={(secondaryActors) => updateUseCase({ secondaryActors, actors: Array.from(new Set([...(useCase.primaryActors || []), ...secondaryActors])) })}
          placeholder={t("uml.useCase.secondaryActorsPlaceholder")}
        />
        <SimpleList
          title={t("uml.useCase.useCases")}
          items={useCase.useCases || []}
          onChange={(useCases) => updateUseCase({ useCases })}
          placeholder={t("uml.useCase.useCasesPlaceholder")}
        />
      </div>

      {/* Include & Extend Relationships */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
            <span className="font-bold text-on-surface text-sm">{t("uml.useCase.relationships")}</span>
          </div>
          <button onClick={addRelation} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span> {t("uml.useCase.addRelation")}
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {(useCase.useCaseRelations || []).length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-2">{t("uml.useCase.noRelations")}</p>
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
                <button aria-label={t("uml.useCase.deleteRelation")} onClick={() => removeRelation(i)} className="text-outline-variant hover:text-error p-1">
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
  const { t } = useTranslation("design");
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
        <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">{t("uml.sequence.scenarioTitle")}</label>
        <input
          value={seq.scenario || ""}
          onChange={(e) => updateSeq({ scenario: e.target.value })}
          placeholder={t("uml.sequence.scenarioPlaceholder")}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full"
        />
      </div>

      {/* Participants & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        {/* Participants */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface text-sm">
            {t("uml.sequence.participants")}
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
              placeholder={t("uml.sequence.participantsPlaceholder")}
            />
            <p className="text-[11px] text-on-surface-variant mt-2">
              {t("uml.sequence.participantsTip")} <code>Name (type)</code> {t("uml.sequence.participantsTipSuffix")}
            </p>
          </div>
        </div>

        {/* Message Sequence */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
            <span className="font-bold text-on-surface text-sm">{t("uml.sequence.messageFlow")}</span>
            <button onClick={addMessage} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">add</span> {t("uml.sequence.addMessage")}
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
                  placeholder={t("uml.sequence.source")}
                />
                <span className="material-symbols-outlined text-[14px] text-outline-variant">arrow_forward</span>
                <input
                  value={msg.target}
                  onChange={(e) => updateMessage(i, { target: e.target.value })}
                  className="w-24 bg-surface border border-outline-variant rounded px-1.5 py-1 font-semibold"
                  placeholder={t("uml.sequence.target")}
                />
                <input
                  value={msg.message}
                  onChange={(e) => updateMessage(i, { message: e.target.value })}
                  className="flex-1 bg-surface border border-outline-variant rounded px-2 py-1 font-mono"
                  placeholder={t("uml.sequence.messageMethod")}
                />
                <label className="flex items-center gap-1 text-[11px] text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(msg.response)}
                    onChange={(e) => updateMessage(i, { response: e.target.checked })}
                    className="rounded"
                  />
                  {t("uml.sequence.return")}
                </label>
                <button aria-label={t("uml.sequence.deleteMessage")} onClick={() => removeMessage(i)} className="text-outline-variant hover:text-error p-1">
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
            {t("uml.sequence.altFlow")}
          </h4>
          <input
            value={seq.altFlow.condition || ""}
            onChange={(e) => updateSeq({ altFlow: { ...seq.altFlow!, condition: e.target.value } })}
            placeholder={t("uml.sequence.altFlowPlaceholder")}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary mb-2 font-medium"
          />
        </div>
      )}
    </div>
  );
}

function ActivityElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  const { t } = useTranslation("design");
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
        <label className="text-xs font-bold uppercase tracking-wider text-outline-variant block mb-1">{t("uml.activity.workflowTitle")}</label>
        <input
          value={activity.workflowTitle || ""}
          onChange={(e) => updateActivity({ workflowTitle: e.target.value })}
          placeholder={t("uml.activity.workflowPlaceholder")}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary w-full"
        />
      </div>

      {/* Steps List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">schema</span>
            <span className="font-bold text-on-surface text-sm">{t("uml.activity.steps")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addActionStep} className="px-3 py-1 bg-surface border border-outline-variant rounded text-xs font-bold hover:bg-surface-container flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">add</span> {t("uml.activity.addAction")}
            </button>
            <button onClick={addDecisionStep} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold hover:bg-primary/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">alt_route</span> {t("uml.activity.addDecision")}
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {(activity.steps || []).length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-2">{t("uml.activity.noSteps")}</p>
          ) : (
            (activity.steps || []).map((step, i) => (
              <div key={i} className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-outline-variant">{i + 1}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${step.type === "decision" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-surface-container text-on-surface-variant"}`}>
                      {step.type === "decision" ? t("uml.activity.decisionPoint") : t("uml.activity.actionStep")}
                    </span>
                  </div>
                  <button aria-label={t("uml.activity.deleteStep")} onClick={() => removeStep(i)} className="text-outline-variant hover:text-error p-1">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                {step.type === "action" ? (
                  <input
                    value={step.label || ""}
                    onChange={(e) => updateStep(i, { label: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-md px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                    placeholder={t("uml.activity.actionPlaceholder")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider block mb-1">{t("uml.activity.condition")}</span>
                      <input
                        value={step.condition || ""}
                        onChange={(e) => updateStep(i, { condition: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary font-medium"
                        placeholder={t("uml.activity.conditionPlaceholder")}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">{t("uml.activity.yesBranch")}</span>
                      <input
                        value={step.thenBranch || ""}
                        onChange={(e) => updateStep(i, { thenBranch: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder={t("uml.activity.yesPlaceholder")}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-error uppercase tracking-wider block mb-1">{t("uml.activity.noBranch")}</span>
                      <input
                        value={step.elseBranch || ""}
                        onChange={(e) => updateStep(i, { elseBranch: e.target.value })}
                        className="w-full bg-surface border border-outline-variant rounded-md px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
                        placeholder={t("uml.activity.noPlaceholder")}
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
  const { t } = useTranslation("design");
  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface text-sm">{title}</div>
      <div className="p-4">
        <textarea
          value={items.join("\n")}
          onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
          className="w-full min-h-[160px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-xs font-mono"
          placeholder={placeholder || t("uml.class.onePerLine")}
        />
      </div>
    </div>
  );
}

function MarkupPanel({ title, markup }: { title: string; markup: string }) {
  const { t } = useTranslation("design");
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
        <span className="text-on-surface-variant">{t("uml.markup.generatedFromEntities")}</span>
      </div>
      <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-outline-variant p-4 overflow-hidden relative group font-mono text-sm">
        <pre className="text-[#d4d4d4] h-full overflow-y-auto">{markup}</pre>
        <button
          onClick={copy}
          aria-label={t(copied ? "uml.markup.copied" : "uml.markup.copy")}
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
          {copied ? t("uml.markup.copied") : t("uml.markup.copy")}
        </button>
      </div>
    </div>
  );
}

function getDiagramInfo(activeDiagram: string, umlPreparation: UmlPreparationType, t: (key: string) => string) {
  if (activeDiagram === "usecase") return { description: t("uml.descriptions.usecase"), markupTitle: t("uml.markup.title"), markup: buildUseCaseMarkup(umlPreparation) };
  if (activeDiagram === "sequence") return { description: t("uml.descriptions.sequence"), markupTitle: t("uml.markup.title"), markup: buildSequenceMarkup(umlPreparation) };
  if (activeDiagram === "activity") return { description: t("uml.descriptions.activity"), markupTitle: t("uml.markup.title"), markup: buildActivityMarkup(umlPreparation) };
  return { description: t("uml.descriptions.class"), markupTitle: t("uml.markup.title"), markup: buildClassDiagramPlantUml(umlPreparation) };
}

function getClassKey(umlClass: UmlClass) {
  return umlClass._id || umlClass.localId || umlClass.name;
}

function getRelKey(relationship: UmlRelationship) {
  return relationship._id || relationship.localId || `${relationship.source}-${relationship.target}-${relationship.type}`;
}

