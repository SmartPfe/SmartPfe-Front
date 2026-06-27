import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultOnboardingData,
  ONBOARDING_STORAGE_KEY,
  type OnboardingSection,
  type ProjectOnboarding,
} from "@/types/onboarding";
import { fetchApi } from "@/lib/api";

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

function toText(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function toStringList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function mergeOnboardingData(saved: Partial<ProjectOnboarding>): ProjectOnboarding {
  return {
    basics: {
      ...defaultOnboardingData.basics,
      ...saved.basics,
    },
    description: {
      ...defaultOnboardingData.description,
      ...saved.description,
      deliverables: toText(saved.description?.deliverables),
      stakeholders: toText(saved.description?.stakeholders),
    },
    technicalContext: {
      ...defaultOnboardingData.technicalContext,
      ...saved.technicalContext,
      developmentTypes: toStringList(saved.technicalContext?.developmentTypes),
      technologies: toStringList(saved.technicalContext?.technologies),
      targetUsers: toText(saved.technicalContext?.targetUsers),
      teamSize: toNumber(saved.technicalContext?.teamSize, defaultOnboardingData.technicalContext.teamSize),
      duration: toNumber(saved.technicalContext?.duration, defaultOnboardingData.technicalContext.duration),
    },
  };
}

function getCurrentUserStorageId() {
  if (typeof window === "undefined") return "";

  try {
    const user = JSON.parse(window.localStorage.getItem("user") || "{}");
    return String(user._id || user.id || user.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

function getUserOnboardingStorageKey() {
  const userId = getCurrentUserStorageId();
  return userId ? `${ONBOARDING_STORAGE_KEY}:${encodeURIComponent(userId)}` : "";
}

function loadInitialData(storageKey: string) {
  if (typeof window === "undefined") return defaultOnboardingData;
  if (!storageKey) return defaultOnboardingData;

  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    const stored = window.localStorage.getItem(storageKey);
    return stored ? mergeOnboardingData(JSON.parse(stored)) : defaultOnboardingData;
  } catch {
    return defaultOnboardingData;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const storageKey = useMemo(() => getUserOnboardingStorageKey(), []);
  const [data, setData] = useState<ProjectOnboarding>(() => loadInitialData(storageKey));

  useEffect(() => {
    let isMounted = true;

    const loadSavedProject = async () => {
      try {
        const project = await fetchApi("/projects/my-project");
        if (!isMounted) return;

        setData(mergeOnboardingData(project));
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message !== "Project not found for this user") {
          console.error("Failed to load project onboarding data:", error);
        }
      }
    };

    loadSavedProject();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    if (storageKey) {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, storageKey]);

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
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
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
