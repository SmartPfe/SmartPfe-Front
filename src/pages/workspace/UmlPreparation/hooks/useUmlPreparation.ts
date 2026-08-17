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

export type UmlUseCaseRelation = {
  source: string;
  target: string;
  type: "include" | "extend";
};

export type UmlUseCase = {
  systemName: string;
  primaryActors: string[];
  secondaryActors: string[];
  actors: string[];
  useCases: string[];
  links: { actor: string; useCase: string }[];
  useCaseRelations: UmlUseCaseRelation[];
};

export type UmlSequenceParticipant = {
  name: string;
  type: string;
};

export type UmlSequenceMessage = {
  source: string;
  target: string;
  message: string;
  response: boolean;
  type?: string;
};

export type UmlSequence = {
  scenario: string;
  participants: (string | UmlSequenceParticipant)[];
  messages: UmlSequenceMessage[];
  altFlow?: {
    condition: string;
    messages: { source: string; target: string; message: string; response?: boolean }[];
  };
};

export type UmlActivityStep = {
  type: "action" | "decision";
  label?: string;
  condition?: string;
  thenBranch?: string;
  elseBranch?: string;
};

export type UmlActivity = {
  workflowTitle: string;
  steps: UmlActivityStep[];
  transitions: { from: string; to: string; label: string }[];
};

export type UmlPreparation = {
  classes: UmlClass[];
  relationships: UmlRelationship[];
  useCase: UmlUseCase;
  sequence: UmlSequence;
  activity: UmlActivity;
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
  useCase: {
    systemName: "System Platform",
    primaryActors: [],
    secondaryActors: [],
    actors: [],
    useCases: [],
    links: [],
    useCaseRelations: [],
  },
  sequence: {
    scenario: "",
    participants: [],
    messages: [],
    altFlow: { condition: "", messages: [] },
  },
  activity: {
    workflowTitle: "",
    steps: [],
    transitions: [],
  },
};

const normalizeList = (items: string[] = []) => items.map((item) => item || "").filter((item) => item.trim().length > 0);

export const normalizeUmlPreparation = (value: Partial<UmlPreparation> = {}): UmlPreparation => {
  const primaryActors = normalizeList(value.useCase?.primaryActors?.length ? value.useCase.primaryActors : value.useCase?.actors || []);
  const secondaryActors = normalizeList(value.useCase?.secondaryActors || []);
  const allActors = Array.from(new Set([...primaryActors, ...secondaryActors, ...normalizeList(value.useCase?.actors || [])]));
  const useCases = normalizeList(value.useCase?.useCases || []);

  const rawLinks = Array.isArray(value.useCase?.links) ? value.useCase.links : [];
  const links = rawLinks.filter((link) => link.actor && link.useCase);

  const useCaseRelations = Array.isArray(value.useCase?.useCaseRelations)
    ? value.useCase.useCaseRelations.filter((rel) => rel.source && rel.target)
    : [];

  const rawParticipants = Array.isArray(value.sequence?.participants) ? value.sequence.participants : [];
  const participants = rawParticipants.map((p) => {
    if (typeof p === "string") return { name: p.trim(), type: "participant" };
    return { name: String(p?.name || "").trim(), type: String(p?.type || "participant").trim() };
  }).filter((p) => p.name);

  const messages = (value.sequence?.messages || []).filter((m) => m.source && m.target && m.message);

  const steps = Array.isArray(value.activity?.steps)
    ? value.activity.steps.filter((s) => (s.type === "action" && s.label) || (s.type === "decision" && s.condition))
    : [];

  return {
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
      systemName: value.useCase?.systemName || "System Platform",
      primaryActors: primaryActors.length ? primaryActors : (allActors.length ? allActors : []),
      secondaryActors,
      actors: allActors,
      useCases,
      links,
      useCaseRelations,
    },
    sequence: {
      scenario: value.sequence?.scenario || "",
      participants,
      messages,
      altFlow: value.sequence?.altFlow || { condition: "", messages: [] },
    },
    activity: {
      workflowTitle: value.activity?.workflowTitle || "",
      steps,
      transitions: value.activity?.transitions || [],
    },
  };
};

export const buildClassPlantUml = (umlClass: UmlClass, relationships: UmlRelationship[] = []) => {
  let stereotype = "";
  const typeLower = umlClass.type.toLowerCase();
  if (typeLower.includes("abstract")) stereotype = " <<Abstract>>";
  else if (typeLower.includes("interface")) stereotype = " <<Interface>>";
  else if (typeLower.includes("enum")) stereotype = " <<Enum>>";

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
  const lines = [
    "@startuml",
    "skinparam classAttributeIconSize 0",
    "skinparam shadowing false",
    "",
  ];
  umlPreparation.classes.forEach((umlClass) => {
    let stereotype = "";
    const typeLower = umlClass.type.toLowerCase();
    if (typeLower.includes("abstract")) stereotype = " <<Abstract>>";
    else if (typeLower.includes("interface")) stereotype = " <<Interface>>";
    else if (typeLower.includes("enum")) stereotype = " <<Enum>>";

    lines.push(`class ${umlClass.name}${stereotype} {`);
    umlClass.attributes.forEach((attribute) => lines.push(`  +${attribute}`));
    if (umlClass.attributes.length && umlClass.methods.length) lines.push("  --");
    umlClass.methods.forEach((method) => lines.push(`  +${method}`));
    lines.push("}");
    lines.push("");
  });
  umlPreparation.relationships.forEach((relationship) => lines.push(formatRelationship(relationship)));
  lines.push("@enduml");
  return lines.join("\n");
};

export const buildUseCaseMarkup = (umlPreparation: UmlPreparation) => {
  const useCase = umlPreparation.useCase;
  const primaryActors = useCase.primaryActors?.length ? useCase.primaryActors : useCase.actors;
  const secondaryActors = useCase.secondaryActors || [];
  const systemName = useCase.systemName || "System Platform";
  const useCases = useCase.useCases || [];
  const links = useCase.links || [];
  const useCaseRelations = useCase.useCaseRelations || [];

  const lines = [
    "@startuml",
    "left to right direction",
    "skinparam packageStyle rectangle",
    "skinparam shadowing false",
    "",
  ];

  // Primary actors (rendered on the left)
  if (primaryActors.length > 0) {
    primaryActors.forEach((actor) => {
      lines.push(`actor "${actor}" as ${safeNode(actor)}`);
    });
    lines.push("");
  }

  // System Boundary
  lines.push(`rectangle "${systemName}" {`);
  useCases.forEach((uc) => {
    lines.push(`  usecase "${uc}" as ${safeNode(uc)}`);
  });

  if (useCaseRelations.length > 0) {
    lines.push("");
    useCaseRelations.forEach((rel) => {
      const stereotype = rel.type === "extend" ? "<<extend>>" : "<<include>>";
      lines.push(`  ${safeNode(rel.source)} .> ${safeNode(rel.target)} : ${stereotype}`);
    });
  }
  lines.push("}");
  lines.push("");

  // Secondary actors (rendered on the right AFTER the rectangle)
  if (secondaryActors.length > 0) {
    secondaryActors.forEach((actor) => {
      lines.push(`actor "${actor}" as ${safeNode(actor)} <<Secondary>>`);
    });
    lines.push("");
  }

  // Links: Primary actors point TO use case, and use cases point TO secondary actors!
  links.forEach((link) => {
    const isActorSecondary = secondaryActors.includes(link.actor);
    const isUseCaseSecondary = secondaryActors.includes(link.useCase);
    if (isActorSecondary) {
      lines.push(`${safeNode(link.useCase)} --> ${safeNode(link.actor)}`);
    } else if (isUseCaseSecondary) {
      lines.push(`${safeNode(link.actor)} --> ${safeNode(link.useCase)}`);
    } else {
      lines.push(`${safeNode(link.actor)} --> ${safeNode(link.useCase)}`);
    }
  });

  lines.push("@enduml");
  return lines.length > 3 ? lines.join("\n") : "@startuml\nactor Actor\nusecase \"Use Case\" as UC1\nActor --> UC1\n@enduml";
};

export const buildSequenceMarkup = (umlPreparation: UmlPreparation) => {
  const seq = umlPreparation.sequence;
  const rawParticipants = seq.participants || [];
  const messages = seq.messages || [];

  const lines = [
    "@startuml",
    "autonumber",
    "skinparam responseMessageBelowArrow true",
    "skinparam shadowing false",
  ];

  if (seq.scenario) {
    lines.push(`title ${seq.scenario}`);
  }
  lines.push("");

  const validTypes = new Set(["actor", "boundary", "control", "entity", "database", "collections", "queue"]);

  rawParticipants.forEach((p) => {
    const name = typeof p === "string" ? p : p.name;
    const type = typeof p === "string" ? "participant" : p.type || "participant";
    const keyword = validTypes.has(type.toLowerCase()) ? type.toLowerCase() : "participant";
    lines.push(`${keyword} "${name}" as ${safeNode(name)}`);
  });
  lines.push("");

  messages.forEach((msg) => {
    const isReturn = msg.response || msg.type === "return";
    const arrow = isReturn ? "-->" : "->";
    lines.push(`${safeNode(msg.source)} ${arrow} ${safeNode(msg.target)}: ${escapePlantUml(msg.message)}`);
  });

  if (seq.altFlow && seq.altFlow.condition && seq.altFlow.messages?.length) {
    lines.push("");
    lines.push(`alt ${escapePlantUml(seq.altFlow.condition)}`);
    seq.altFlow.messages.forEach((msg) => {
      const isReturn = msg.response !== false;
      const arrow = isReturn ? "-->" : "->";
      lines.push(`  ${safeNode(msg.source)} ${arrow} ${safeNode(msg.target)}: ${escapePlantUml(msg.message)}`);
    });
    lines.push("end");
  }

  lines.push("@enduml");
  return lines.length > 3 ? lines.join("\n") : "@startuml\nparticipant User\nparticipant System\nUser -> System: Action\n@enduml";
};

export const buildActivityMarkup = (umlPreparation: UmlPreparation) => {
  const activity = umlPreparation.activity;
  const steps = activity.steps || [];

  if (steps.length > 0) {
    const lines = ["@startuml", "skinparam shadowing false"];
    if (activity.workflowTitle) {
      lines.push(`title ${activity.workflowTitle}`);
    }
    lines.push("start");

    steps.forEach((step) => {
      if (step.type === "decision" && step.condition) {
        lines.push(`if (${escapePlantUml(step.condition)}) then (yes)`);
        if (step.thenBranch) {
          lines.push(`  :${escapePlantUml(step.thenBranch)};`);
        }
        if (step.elseBranch) {
          lines.push(`else (no)`);
          lines.push(`  :${escapePlantUml(step.elseBranch)};`);
        }
        lines.push(`endif`);
      } else if (step.label) {
        lines.push(`:${escapePlantUml(step.label)};`);
      }
    });

    lines.push("stop");
    lines.push("@enduml");
    return lines.join("\n");
  }

  // Fallback to transitions
  const transitions = activity.transitions || [];
  if (transitions.length > 0) {
    const lines = ["@startuml", "skinparam shadowing false"];
    if (activity.workflowTitle) {
      lines.push(`title ${activity.workflowTitle}`);
    }
    lines.push("start");
    transitions.forEach((transition) => {
      const label = transition.label ? ` : ${transition.label}` : "";
      let from = transition.from.includes("[*]") ? "(*)" : `:${escapePlantUml(transition.from)};`;
      let to = transition.to.includes("[*]") ? "(*)" : `:${escapePlantUml(transition.to)};`;
      lines.push(`${from} --> ${to}${label}`);
    });
    lines.push("stop");
    lines.push("@enduml");
    return lines.join("\n");
  }

  return "@startuml\nstart\n:Initialize Process;\nstop\n@enduml";
};

const safeNode = (value: string) => {
  const str = String(value || "").trim();
  if (!str) return "Node_1";
  
  const asciiCleaned = str.replace(/[^a-zA-Z0-9_]/g, "");
  if (asciiCleaned && asciiCleaned.length >= 2 && /^[a-zA-Z]/.test(asciiCleaned)) {
    return asciiCleaned;
  }
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36);
  const prefix = asciiCleaned ? `N_${asciiCleaned.slice(0, 8)}_` : "N_";
  return `${prefix}${positiveHash}`;
};

const escapePlantUml = (text: string) =>
  String(text || "")
    .replace(/;/g, ",")
    .replace(/\n/g, " ")
    .replace(/"/g, "'");

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

  const generateWithAi = async (diagramType = "all") => {
    setAiState("generating");
    setError(null);
    try {
      const res = await fetchApi("/ai/uml-preparation/generate", {
        method: "POST",
        body: JSON.stringify({ diagramType, currentUmlPreparation: umlPreparation }),
      });
      setSuggestion(normalizeUmlPreparation(res.umlPreparation || {}));
      setAiState("suggestion_ready");
    } catch (err: any) {
      setError(err.message || "AI generation failed. Please try again.");
      setAiState("idle");
    }
  };

  const projectLanguage = currentProjectLanguage || normalizeLanguage(project?.basics?.language || project?.language);
  const umlPreparationLanguage = normalizeLanguage(project?.umlPreparationLanguage);

  const refineWithAi = async (instructions = "", diagramType = "all") => {
    setAiState("refining");
    setError(null);
    try {
      const trimmedInstructions = instructions.trim();
      const payload = {
        umlPreparation,
        instructions: trimmedInstructions,
        diagramType,
      };
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
