import { useState } from "react";
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
  useUmlPreparation,
} from "./hooks/useUmlPreparation";

const diagrams = [
  { id: "usecase", name: "Use Case Diagram", icon: "person_play" },
  { id: "class", name: "Class Diagram", icon: "account_tree" },
  { id: "sequence", name: "Sequence Diagram", icon: "sync_alt" },
  { id: "activity", name: "Activity Diagram", icon: "schema" },
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
    suggestion,
    error,
    markUnsaved,
    saveUmlPreparation,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useUmlPreparation();

  const [activeDiagram, setActiveDiagram] = useState("class");
  const [activeView, setActiveView] = useState("elements");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading UML preparation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            UML Preparation
            <InfoTooltip label="UML" tooltip="Design the system architecture using Unified Modeling Language diagrams." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Prepare your system models. Define entities, map relationships, and generate diagram code (Mermaid/PlantUML) based on your project's requirements.
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
          <button onClick={() => saveUmlPreparation(umlPreparation)} disabled={saveStatus === "saving" || aiState === "generating"} className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            Save now
          </button>
          <button onClick={generateWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready"} className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            {aiState === "generating" ? "Generating..." : "Generate"}
          </button>
          <button onClick={refineWithAi} disabled={aiState === "generating" || aiState === "suggestion_ready" || umlPreparation.classes.length === 0} className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Refine
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-label-md font-bold text-on-surface">AI suggestion ready</h3>
              <p className="text-body-md text-on-surface-variant">Review and accept the generated UML preparation model.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={discardSuggestion} className="px-4 py-2 rounded-md border border-outline-variant bg-surface text-on-surface text-label-sm hover:bg-surface-container-low">Discard</button>
              <button onClick={acceptSuggestion} className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-sm hover:opacity-90">Accept UML model</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 pb-8">
        <div className="w-full xl:w-64 flex flex-col gap-2 shrink-0">
          <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-2 px-2">Diagrams</h3>
          {diagrams.map((diag) => (
            <button key={diag.id} onClick={() => setActiveDiagram(diag.id)} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left", activeDiagram === diag.id ? "bg-primary-container text-on-primary-container shadow-sm border border-primary/20" : "bg-surface text-on-surface-variant border border-transparent hover:bg-surface-container hover:border-outline-variant")}>
              <span className="material-symbols-outlined text-[20px]">{diag.icon}</span>
              {diag.name}
            </button>
          ))}
          <div className="mt-4 p-4 rounded-xl bg-surface border border-outline-variant border-dashed">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <p className="text-xs font-medium text-on-surface mb-1">AI synchronized</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">Generated from your actors, requirements, and project context.</p>
          </div>
        </div>

        <div className="flex-1 bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-outline-variant bg-surface-container-lowest gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">{diagrams.find((d) => d.id === activeDiagram)?.icon}</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-on-surface">{diagrams.find((d) => d.id === activeDiagram)?.name}</h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Synced with Requirements
                  </span>
                </div>
              </div>
            </div>

            <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1 shrink-0">
              <button onClick={() => setActiveView("elements")} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", activeView === "elements" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface")}>
                Entities Preview
              </button>
              <button onClick={() => setActiveView("code")} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5", activeView === "code" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface")}>
                <span className="material-symbols-outlined text-[16px]">code</span>
                Markup
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-surface-container-low/30">
            {activeView === "elements" ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between bg-secondary-container/20 p-4 rounded-xl border border-secondary/10">
                  <p className="text-sm text-on-surface-variant flex gap-3 items-start">
                    <span className="material-symbols-outlined text-secondary mt-0.5 text-[20px]">lightbulb</span>
                    <span>{currentInfo.description}</span>
                  </p>
                  <button onClick={refineWithAi} disabled={aiState === "generating" || umlPreparation.classes.length === 0} className="flex items-center gap-2 px-3 py-1.5 bg-surface text-on-surface border border-outline-variant rounded text-xs font-bold hover:bg-surface-container transition-colors shrink-0 whitespace-nowrap disabled:opacity-40">
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    AI Suggest
                  </button>
                </div>

                {activeDiagram === "class" && <ClassElements umlPreparation={umlPreparation} editingClassId={editingClassId} setEditingClassId={setEditingClassId} updatePreparation={updatePreparation} addClass={addClass} />}
                {activeDiagram === "usecase" && <UseCaseElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />}
                {activeDiagram === "sequence" && <SequenceElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />}
                {activeDiagram === "activity" && <ActivityElements umlPreparation={umlPreparation} updatePreparation={updatePreparation} />}
              </div>
            ) : (
              <MarkupPanel title={currentInfo.markupTitle} markup={currentInfo.markup} />
            )}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center justify-between shrink-0">
            <span className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              You can import this markup directly into PlantUML, draw.io, Notion, or Github.
            </span>
            <button onClick={() => saveUmlPreparation(umlPreparation)} className="px-5 py-2 bg-primary text-on-primary rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Validate Diagram</button>
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
  return <TwoColumnList leftTitle="Actors" rightTitle="Use Cases" left={umlPreparation.useCase.actors} right={umlPreparation.useCase.useCases} onLeftChange={(actors) => updatePreparation((current) => ({ ...current, useCase: { ...current.useCase, actors } }))} onRightChange={(useCases) => updatePreparation((current) => ({ ...current, useCase: { ...current.useCase, useCases, links: current.useCase.links.length ? current.useCase.links : actorsToLinks(current.useCase.actors, useCases) } }))} />;
}

function SequenceElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  return <TwoColumnList leftTitle="Participants" rightTitle="Messages" left={umlPreparation.sequence.participants} right={umlPreparation.sequence.messages.map((m) => `${m.source} -> ${m.target}: ${m.message}`)} onLeftChange={(participants) => updatePreparation((current) => ({ ...current, sequence: { ...current.sequence, participants } }))} onRightChange={(items) => updatePreparation((current) => ({ ...current, sequence: { ...current.sequence, messages: items.map(parseMessage) } }))} />;
}

function ActivityElements({ umlPreparation, updatePreparation }: SimpleElementsProps) {
  return <TwoColumnList leftTitle="States" rightTitle="Transitions" left={Array.from(new Set(umlPreparation.activity.transitions.flatMap((t) => [t.from, t.to])))} right={umlPreparation.activity.transitions.map((t) => `${t.from} -> ${t.to}${t.label ? `: ${t.label}` : ""}`)} onLeftChange={() => {}} onRightChange={(items) => updatePreparation((current) => ({ ...current, activity: { ...current.activity, transitions: items.map(parseTransition) } }))} />;
}

type SimpleElementsProps = { umlPreparation: UmlPreparationType; updatePreparation: (updater: (current: UmlPreparationType) => UmlPreparationType) => void };

function TwoColumnList({ leftTitle, rightTitle, left, right, onLeftChange, onRightChange }: { leftTitle: string; rightTitle: string; left: string[]; right: string[]; onLeftChange: (items: string[]) => void; onRightChange: (items: string[]) => void }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><SimpleList title={leftTitle} items={left} onChange={onLeftChange} /><SimpleList title={rightTitle} items={right} onChange={onRightChange} /></div>;
}

function SimpleList({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  return <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col"><div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest font-bold text-on-surface">{title}</div><div className="p-4"><textarea value={items.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} className="w-full min-h-[220px] bg-surface border border-outline-variant rounded-md px-3 py-2 outline-none focus:border-primary resize-y text-sm" placeholder="One item per line" /></div></div>;
}

function MarkupPanel({ title, markup }: { title: string; markup: string }) {
  const copy = () => navigator.clipboard?.writeText(markup);
  return <div className="h-full flex flex-col gap-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><span className="font-bold text-on-surface">{title}</span><span className="text-on-surface-variant">Generated from your entities</span></div><button onClick={copy} className="text-primary text-sm font-medium hover:underline">Copy Code</button></div><div className="flex-1 bg-[#1e1e1e] rounded-xl border border-outline-variant p-4 overflow-hidden relative group font-mono text-sm"><pre className="text-[#d4d4d4] h-full overflow-y-auto">{markup}</pre><button onClick={copy} className="absolute top-4 right-4 w-8 h-8 rounded bg-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"><span className="material-symbols-outlined text-[18px]">content_copy</span></button></div></div>;
}

function getDiagramInfo(activeDiagram: string, umlPreparation: UmlPreparationType) {
  if (activeDiagram === "usecase") return { description: "Define the actors and the specific actions they can perform in the system.", markupTitle: "Mermaid.js Markup", markup: buildUseCaseMarkup(umlPreparation) };
  if (activeDiagram === "sequence") return { description: "Define the objects participating in the interaction and the messages exchanged between them.", markupTitle: "Mermaid.js Markup", markup: buildSequenceMarkup(umlPreparation) };
  if (activeDiagram === "activity") return { description: "Map the flow of control or data through the system's operations and workflows.", markupTitle: "Mermaid.js Markup", markup: buildActivityMarkup(umlPreparation) };
  return { description: "Define the structural entities before generating the diagram. PlantUML updates from your classes and relationships.", markupTitle: "PlantUML Markup", markup: buildClassDiagramPlantUml(umlPreparation) };
}

function actorsToLinks(actors: string[], useCases: string[]) {
  return actors.flatMap((actor) => useCases.slice(0, 3).map((useCase) => ({ actor, useCase })));
}

function parseMessage(item: string) {
  const [path, message = "message"] = item.split(":");
  const [source = "User", target = "System"] = path.split("->").map((part) => part.trim());
  return { source, target, message: message.trim(), response: false };
}

function parseTransition(item: string) {
  const [path, label = ""] = item.split(":");
  const [from = "[*]", to = "End"] = path.split("->").map((part) => part.trim());
  return { from, to, label: label.trim() };
}

function getClassKey(umlClass: UmlClass) {
  return umlClass._id || umlClass.localId || umlClass.name;
}

function getRelKey(relationship: UmlRelationship) {
  return relationship._id || relationship.localId || `${relationship.source}-${relationship.target}-${relationship.type}`;
}
