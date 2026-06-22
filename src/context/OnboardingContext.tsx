import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultOnboardingData,
  ONBOARDING_STORAGE_KEY,
  type OnboardingSection,
  type ProjectOnboarding,
} from "@/types/onboarding";

type OnboardingContextValue = {
  data: ProjectOnboarding;
  updateSection: <Section extends OnboardingSection>(
    section: Section,
    values: Partial<ProjectOnboarding[Section]>
  ) => void;
  resetOnboarding: () => void;
  isStepValid: (step: number) => boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

function mergeOnboardingData(saved: Partial<ProjectOnboarding>): ProjectOnboarding {
  return {
    basics: { ...defaultOnboardingData.basics, ...saved.basics },
    description: { ...defaultOnboardingData.description, ...saved.description },
    technicalContext: { ...defaultOnboardingData.technicalContext, ...saved.technicalContext },
  };
}

function loadInitialData() {
  if (typeof window === "undefined") return defaultOnboardingData;

  try {
    const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? mergeOnboardingData(JSON.parse(stored)) : defaultOnboardingData;
  } catch {
    return defaultOnboardingData;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProjectOnboarding>(loadInitialData);

  useEffect(() => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateSection: OnboardingContextValue["updateSection"] = (section, values) => {
    setData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...values,
      },
    }));
  };

  const resetOnboarding = () => {
    setData(defaultOnboardingData);
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return Boolean(data.basics.title.trim() && data.basics.domain.trim());
      case 2:
        return Boolean(data.description.problemStatement.trim() && data.description.objective.trim());
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const value = useMemo(
    () => ({ data, updateSection, resetOnboarding, isStepValid }),
    [data]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return context;
}
