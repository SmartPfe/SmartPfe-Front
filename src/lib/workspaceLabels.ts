const SIDEBAR_LABEL_IDS: Record<string, string> = {
  overview: "projectOverview",
  "problem-statement": "problemStatement",
  actors: "actorsStakeholders",
  solutions: "existingSolutions",
  "functional-requirements": "functionalRequirementsShort",
  "non-functional-requirements": "nonFunctionalRequirementsShort",
  backlog: "productBacklog",
  "uml-preparation": "umlArchitecture",
  "report-structure": "reportStructure",
  "report-builder": "reportBuilder",
  presentation: "presentationDeck",
  pitch: "pitchSpeech",
  "jury-simulation": "jurySimulation",
  settings: "settings",
};

const TOPBAR_LABEL_IDS: Record<string, string> = {
  overview: "overview",
  "problem-statement": "problem",
  actors: "actors",
  solutions: "solutions",
  "functional-requirements": "functionalRequirementsShort",
  "non-functional-requirements": "nonFunctionalRequirementsShort",
  backlog: "backlog",
  "uml-preparation": "uml",
  "report-structure": "structure",
  "report-builder": "report",
  presentation: "presentation",
  pitch: "pitch",
  "jury-simulation": "jurySimulationShort",
  settings: "settings",
  account: "account",
  "credit-history": "creditHistory",
};

const TOOLTIP_IDS: Record<string, string> = {
  overview: "overview",
  "problem-statement": "problemStatement",
  actors: "actors",
  solutions: "solutions",
  "functional-requirements": "functionalRequirements",
  "non-functional-requirements": "nonFunctionalRequirements",
  backlog: "backlog",
  "uml-preparation": "umlPreparation",
  "report-structure": "reportStructure",
  "report-builder": "reportBuilder",
  presentation: "presentation",
  pitch: "pitch",
  "jury-simulation": "jurySimulation",
};

export function sidebarPhaseLabelKey(id: string) {
  return `navigation.sidebarLabels.${SIDEBAR_LABEL_IDS[id] || "projectOverview"}`;
}

export function topbarPhaseLabelKey(id: string) {
  return `navigation.topbarLabels.${TOPBAR_LABEL_IDS[id] || "overview"}`;
}

export function workspaceTooltipKey(id: string) {
  const tooltipId = TOOLTIP_IDS[id];
  return tooltipId ? `navigation.tooltips.${tooltipId}` : undefined;
}

export function workspaceGroupKey(group: string) {
  const groupIds: Record<string, string> = {
    Specification: "specification",
    Engineering: "engineering",
    Delivery: "delivery",
  };
  return `navigation.groups.${groupIds[group] || "specification"}`;
}
