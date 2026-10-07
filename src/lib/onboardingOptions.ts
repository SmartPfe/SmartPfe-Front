export type OnboardingOptionGroup =
  | "projectType"
  | "generationLanguage"
  | "domain"
  | "developmentType"
  | "methodology"
  | "complexity"
  | "technology";

export type DisplayOption = { value: string; label: string };

const OPTION_TRANSLATION_KEYS: Record<OnboardingOptionGroup, Record<string, string>> = {
  projectType: {
    "Academic Project": "options.projectType.academic",
    "Internship / Industrial Project": "options.projectType.internship",
    "Startup Project": "options.projectType.startup",
    "Research Project": "options.projectType.research",
  },
  generationLanguage: {
    English: "options.generationLanguage.english",
    French: "options.generationLanguage.french",
    Arabic: "options.generationLanguage.arabic",
  },
  domain: {
    "Software Engineering": "options.domain.softwareEngineering",
    "Artificial Intelligence": "options.domain.artificialIntelligence",
    "Data Science": "options.domain.dataScience",
    Cybersecurity: "options.domain.cybersecurity",
    "Cloud Computing": "options.domain.cloudComputing",
    "Business Intelligence": "options.domain.businessIntelligence",
    Other: "options.other",
  },
  developmentType: {
    "Web Application": "options.developmentType.webApplication",
    "Mobile Application": "options.developmentType.mobileApplication",
    "Desktop Application": "options.developmentType.desktopApplication",
    "AI / Machine Learning": "options.developmentType.aiMachineLearning",
    "Data Engineering": "options.developmentType.dataEngineering",
    "Data Analytics": "options.developmentType.dataAnalytics",
    "Cloud Platform": "options.developmentType.cloudPlatform",
    "IoT System": "options.developmentType.iotSystem",
    Other: "options.other",
  },
  methodology: {
    Waterfall: "options.methodology.waterfall",
    Hybrid: "options.methodology.hybrid",
    Agile: "options.methodology.agile",
    Lean: "options.methodology.lean",
    "Design Thinking": "options.methodology.designThinking",
  },
  complexity: {
    Low: "options.complexity.low",
    Medium: "options.complexity.medium",
    High: "options.complexity.high",
  },
  technology: { Other: "options.other" },
};

type Translate = (key: string) => string;

export function displayOptionLabel(value: string, group: OnboardingOptionGroup, t: Translate) {
  const key = OPTION_TRANSLATION_KEYS[group][value];
  return key ? t(key) : value;
}

export function displayOptions(values: readonly string[], group: OnboardingOptionGroup, t: Translate): DisplayOption[] {
  return values.map((value) => ({ value, label: displayOptionLabel(value, group, t) }));
}
