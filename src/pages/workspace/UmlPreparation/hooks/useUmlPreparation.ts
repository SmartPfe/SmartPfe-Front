import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchApi } from "@/lib/api";

export type UmlClass = {
  _id?: string;
  localId?: string;
  name: string;
  type: string;
  description: string;
  attributes: string[];
  methods: string[];
};

export type UmlRelationship = {
  _id?: string;
  localId?: string;
  source: string;
  target: string;
  type: "association" | "inheritance" | "composition" | "aggregation" | "dependency";
  label: string;
  sourceMultiplicity: string;
  targetMultiplicity: string;
};

export type UmlPreparation = {
  classes: UmlClass[];
  relationships: UmlRelationship[];
  useCase: {
    actors: string[];
    useCases: string[];
    links: { actor: string; useCase: string }[];
  };
  sequence: {
    participants: string[];
    messages: { source: string; target: string; message: string; response: boolean }[];
  };
  activity: {
    transitions: { from: string; to: string; label: string }[];
  };
};

export type AiState = "idle" | "generating" | "refining" | "translating" | "suggestion_ready";
export type SaveStatus = "unsaved" | "saving" | "saved";

const LANGUAGE_CODES: Record<string, string> = {
  english: "en",
  french: "fr",
  arabic: "ar",
  en: "en",
  fr: "fr",
  ar: "ar",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
};

export function normalizeLanguage(language?: string | null) {
  const value = String(language || "").trim();
  if (!value) return "";
  return LANGUAGE_CODES[value.toLowerCase()] || value.toLowerCase();
}

export function getLanguageLabel(language?: string | null) {
  const normalized = normalizeLanguage(language);
  return LANGUAGE_LABELS[normalized] || language || "current language";
}

export const emptyUmlPreparation: UmlPreparation = {
  classes: [],
  relationships: [],
  useCase: { actors: [], useCases: [], links: [] },
  sequence: { participants: [], messages: [] },
  activity: { transitions: [] },
};

const normalizeList = (items: string[] = []) => items.map((item) => item || "").filter((item) => item.trim().length > 0);

export const normalizeUmlPreparation = (value: Partial<UmlPreparation> = {}): UmlPreparation => ({
  classes: (value.classes || []).map((umlClass) => ({
    ...umlClass,
    name: umlClass.name || "Class",
    type: umlClass.type || "Class",
    description: umlClass.description || "",
    attributes: normalizeList(umlClass.attributes || []),
    methods: normalizeList(umlClass.methods || []),
  })),
  relationships: (value.relationships || []).map((relationship) => ({
    ...relationship,
    source: relationship.source || "",
    target: relationship.target || "",
    type: relationship.type || "association",
    label: relationship.label || "",
    sourceMultiplicity: relationship.sourceMultiplicity || "",
    targetMultiplicity: relationship.targetMultiplicity || "",
  })),
  useCase: {
    actors: normalizeList(value.useCase?.actors || []),
    useCases: normalizeList(value.useCase?.useCases || []),
    links: value.useCase?.links || [],
  },
  sequence: {
    participants: normalizeList(value.sequence?.participants || []),
    messages: value.sequence?.messages || [],
  },
  activity: {
    transitions: value.activity?.transitions || [],
  },
});

export const buildClassPlantUml = (umlClass: UmlClass, relationships: UmlRelationship[] = []) => {
  const stereotype = umlClass.type.toLowerCase().includes("abstract") ? " <<Abstract>>" : "";
  const lines = [`class ${umlClass.name}${stereotype} {`];
  umlClass.attributes.forEach((attribute) => lines.push(`  +${attribute}`));
  if (umlClass.attributes.length && umlClass.methods.length) lines.push("  --");
  umlClass.methods.forEach((method) => lines.push(`  +${method}`));
  lines.push("}");

  relationships
    .filter((relationship) => relationship.source === umlClass.name || relationship.target === umlClass.name)
    .forEach((relationship) => lines.push(formatRelationship(relationship)));

  return `@startuml\n${lines.join("\n")}\n@enduml`;
};

export const buildClassDiagramPlantUml = (umlPreparation: UmlPreparation) => {
  const lines = ["@startuml"];
  umlPreparation.classes.forEach((umlClass) => {
    const stereotype = umlClass.type.toLowerCase().includes("abstract") ? " <<Abstract>>" : "";
    lines.push(`class ${umlClass.name}${stereotype} {`);
    umlClass.attributes.forEach((attribute) => lines.push(`  +${attribute}`));
    if (umlClass.attributes.length && umlClass.methods.length) lines.push("  --");
    umlClass.methods.forEach((method) => lines.push(`  +${method}`));
    lines.push("}");
  });
  umlPreparation.relationships.forEach((relationship) => lines.push(formatRelationship(relationship)));
  lines.push("@enduml");
  return lines.join("\n");
};

export const buildUseCaseMarkup = (umlPreparation: UmlPreparation) => {
  const lines = ["flowchart LR"];
  umlPreparation.useCase.links.forEach((link) => lines.push(`    ${safeNode(link.actor)} --> (${link.useCase})`));
  return lines.length > 1 ? lines.join("\n") : "flowchart LR\n    Actor --> (Use Case)";
};

export const buildSequenceMarkup = (umlPreparation: UmlPreparation) => {
  const lines = ["sequenceDiagram"];
  umlPreparation.sequence.participants.forEach((participant) => lines.push(`    participant ${safeNode(participant)}`));
  umlPreparation.sequence.messages.forEach((message) => {
    lines.push(`    ${safeNode(message.source)}${message.response ? "-->>" : "->>"}${safeNode(message.target)}: ${message.message}`);
  });
  return lines.length > 1 ? lines.join("\n") : "sequenceDiagram\n    participant User\n    participant System";
};

export const buildActivityMarkup = (umlPreparation: UmlPreparation) => {
  const lines = ["stateDiagram-v2"];
  umlPreparation.activity.transitions.forEach((transition) => {
    const label = transition.label ? ` : ${transition.label}` : "";
    lines.push(`    ${transition.from} --> ${transition.to}${label}`);
  });
  return lines.length > 1 ? lines.join("\n") : "stateDiagram-v2\n    [*] --> Start";
};

const safeNode = (value: string) => String(value || "Node").replace(/[^a-zA-Z0-9_]/g, "");

const formatRelationship = (relationship: UmlRelationship) => {
  const operators = {
    association: "--",
    inheritance: "<|--",
    composition: "*--",
    aggregation: "o--",
    dependency: "..>",
  };
  const left = relationship.sourceMultiplicity ? `"${relationship.sourceMultiplicity}" ` : "";
  const right = relationship.targetMultiplicity ? ` "${relationship.targetMultiplicity}"` : "";
  const label = relationship.label ? ` : ${relationship.label}` : "";
  return `${relationship.source} ${left}${operators[relationship.type] || "--"}${right} ${relationship.target}${label}`;
};

export function useUmlPreparation() {
  const location = useLocation();
  const [project, setProject] = useState<any>(null);
  const [currentProjectLanguage, setCurrentProjectLanguage] = useState("");
  const [umlPreparation, setUmlPreparation] = useState<UmlPreparation>(emptyUmlPreparation);
  const [suggestion, setSuggestion] = useState<UmlPreparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const umlRef = useRef<UmlPreparation>(emptyUmlPreparation);

  useEffect(() => {
    umlRef.current = umlPreparation;
  }, [umlPreparation]);

  useEffect(() => {
    const fetchUmlPreparation = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject(projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));
        const data = await fetchApi(`/projects/${projectData._id}/uml-preparation`);
        setUmlPreparation(normalizeUmlPreparation(data.umlPreparation || {}));
      } catch (err: any) {
        setError(err.message || "Failed to load UML preparation. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchUmlPreparation();
  }, []);

  useEffect(() => {
    const refreshProjectLanguage = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject((current: any) => current ? { ...current, basics: projectData.basics || current.basics } : projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));
      } catch {
        // Keep the loaded project value if a background refresh fails.
      }
    };

    window.addEventListener("focus", refreshProjectLanguage);
    return () => window.removeEventListener("focus", refreshProjectLanguage);
  }, []);

  useEffect(() => {
    const refreshProjectLanguage = async () => {
      try {
        const projectData = await fetchApi("/projects/my-project");
        setProject((current: any) => current ? { ...current, basics: projectData.basics || current.basics } : projectData);
        setCurrentProjectLanguage(normalizeLanguage(projectData?.basics?.language || projectData?.language));
      } catch {
        // Keep the loaded project value if a route refresh fails.
      }
    };

    refreshProjectLanguage();
  }, [location.key]);

  const markUnsaved = useCallback(() => setSaveStatus("unsaved"), []);

  const saveUmlPreparation = useCallback(async (nextPreparation = umlPreparation, language?: string) => {
    if (!project?._id) {
      setError("Project is not ready yet. Please refresh the page.");
      return;
    }

    const normalized = normalizeUmlPreparation(nextPreparation);
    setSaveStatus("saving");
    setError(null);

    try {
      const payload = language
        ? { umlPreparation: normalized, language }
        : { umlPreparation: normalized };
      const res = await fetchApi(`/projects/${project._id}/uml-preparation`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (JSON.stringify(umlRef.current) === JSON.stringify(normalized)) {
        setUmlPreparation(normalizeUmlPreparation(res.umlPreparation || {}));
        setProject((current: any) => current ? {
          ...current,
          umlPreparationLanguage: res.language ?? current.umlPreparationLanguage ?? "",
        } : current);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save UML preparation. Please try again.");
      setSaveStatus("unsaved");
    }
  }, [project?._id, umlPreparation]);

  useEffect(() => {
    if (saveStatus !== "unsaved" || !project?._id || aiState !== "idle") return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => saveUmlPreparation(umlPreparation), 1200);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [aiState, project?._id, saveStatus, saveUmlPreparation, umlPreparation]);

  const generateWithAi = async () => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/uml-preparation/generate", { method: "POST" });
      setSuggestion(normalizeUmlPreparation(res.umlPreparation || {}));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const projectLanguage = currentProjectLanguage || normalizeLanguage(project?.basics?.language || project?.language);
  const umlPreparationLanguage = normalizeLanguage(project?.umlPreparationLanguage);

  const refineWithAi = async (instructions = "") => {
    if (umlPreparation.classes.length === 0) {
      setError("Add or generate UML classes before asking AI to refine them.");
      return;
    }
    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = trimmedInstructions
        ? { umlPreparation, instructions: trimmedInstructions }
        : { umlPreparation };
      const res = await fetchApi("/ai/uml-preparation/refine", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuggestion(normalizeUmlPreparation(res.umlPreparation || {}));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI refinement failed. Please try again.");
      setAiState("idle");
    }
  };

  const translateWithAi = async () => {
    if (umlPreparation.classes.length === 0) {
      setError("Add or generate UML classes before asking AI to translate them.");
      return;
    }

    setAiState("translating");
    setError(null);
    try {
      const res = await fetchApi("/ai/uml-preparation/translate", {
        method: "POST",
        body: JSON.stringify({ umlPreparation }),
      });
      const translatedPreparation = normalizeUmlPreparation(res.umlPreparation || {});
      umlRef.current = translatedPreparation;
      setUmlPreparation(translatedPreparation);
      await saveUmlPreparation(translatedPreparation, projectLanguage || undefined);
      setAiState("idle");
    } catch (err: any) {
      setError(err.message || "AI UML preparation translation failed. Please try again.");
      setAiState("idle");
    }
  };

  const acceptSuggestion = useCallback(async () => {
    if (suggestion) {
      umlRef.current = suggestion;
      setUmlPreparation(suggestion);
      setSuggestion(null);
      setAiState("idle");
      await saveUmlPreparation(suggestion, projectLanguage || undefined);
      return;
    }
    setSuggestion(null);
    setAiState("idle");
  }, [projectLanguage, saveUmlPreparation, suggestion]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setAiState("idle");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
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
    translateWithAi,
    projectLanguage,
    umlPreparationLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  };
}
