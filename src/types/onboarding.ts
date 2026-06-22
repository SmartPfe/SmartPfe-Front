export interface ProjectOnboarding {
  basics: {
    title: string;
    type: string;
    domain: string;
    language: string;
    academicYear: string;
    university: string;
  };
  description: {
    problemStatement: string;
    objective: string;
    detailedDescription: string;
    deliverables: string;
    company: string;
    industry: string;
    stakeholders: string;
  };
  technicalContext: {
    developmentTypes: string[];
    methodology: string;
    technologies: string[];
    otherTechnologies: string;
    targetUsers: string;
    complexity: string;
    teamSize: number;
    duration: number;
  };
}

export type OnboardingSection = keyof ProjectOnboarding;

export const defaultOnboardingData: ProjectOnboarding = {
  basics: {
    title: "",
    type: "Academic Project",
    domain: "",
    language: "English",
    academicYear: "2025-2026",
    university: "",
  },
  description: {
    problemStatement: "",
    objective: "",
    detailedDescription: "",
    deliverables: "",
    company: "",
    industry: "",
    stakeholders: "",
  },
  technicalContext: {
    developmentTypes: [],
    methodology: "Scrum",
    technologies: [],
    otherTechnologies: "",
    targetUsers: "",
    complexity: "Medium",
    teamSize: 1,
    duration: 4,
  },
};

export const ONBOARDING_STORAGE_KEY = "pfe:onboarding";
