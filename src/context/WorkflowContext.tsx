import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { fetchApi, PROJECT_DATA_UPDATED_EVENT } from "@/lib/api";
import { useLocation } from "react-router-dom";

export type StepStatus = "Locked" | "Available" | "Completed";

export interface WorkflowStep {
  path: string;
  status: StepStatus;
  isCompleted: boolean;
}

interface WorkflowContextValue {
  project: any;
  loading: boolean;
  steps: Record<string, WorkflowStep>;
  refreshWorkflow: () => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

const NAV_PATHS = [
  "/workspace/overview",
  "/workspace/problem-statement",
  "/workspace/actors",
  "/workspace/solutions",
  "/workspace/functional-requirements",
  "/workspace/non-functional-requirements",
  "/workspace/backlog",
  "/workspace/uml-preparation",
  "/workspace/report-structure",
  "/workspace/report-builder",
  "/workspace/presentation",
  "/workspace/pitch",
  "/workspace/jury-simulation",
];

const hasReportContent = (chapter: any) =>
  Boolean(
    String(chapter?.contentHtml || "").trim() ||
    String(chapter?.contentMarkdown || "").trim() ||
    String(chapter?.contentLatex || "").trim()
  );

const hasFinalReport = (finalReport: any) =>
  Boolean(
    String(finalReport?.contentHtml || "").trim() ||
    String(finalReport?.contentMarkdown || "").trim() ||
    String(finalReport?.contentLatex || "").trim()
  );

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<Record<string, WorkflowStep>>({});
  const hasLoadedProjectRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);
  const location = useLocation();

  const fetchProjectAndEvaluate = useCallback(async () => {
    try {
      const data = await fetchApi("/projects/my-project");
      setProject(data);
      hasLoadedProjectRef.current = true;
      evaluateWorkflow(data);
    } catch (error) {
      console.error("Failed to fetch project for workflow:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectAndEvaluate();
  }, [fetchProjectAndEvaluate]);

  useEffect(() => {
    const handleProjectDataUpdated = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        fetchProjectAndEvaluate();
      }, 120);
    };

    window.addEventListener(PROJECT_DATA_UPDATED_EVENT, handleProjectDataUpdated);

    return () => {
      window.removeEventListener(PROJECT_DATA_UPDATED_EVENT, handleProjectDataUpdated);
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchProjectAndEvaluate]);

  // Refetch when location changes to ensure the workflow is up to date if the user saved something
  useEffect(() => {
    if (hasLoadedProjectRef.current) {
      fetchProjectAndEvaluate();
    }
  }, [fetchProjectAndEvaluate, location.pathname]);

  const evaluateWorkflow = (data: any) => {
    if (!data) return;

    const completions: Record<string, boolean> = {
      "/workspace/overview": Boolean(data.basics?.title?.trim() && data.basics?.domain?.trim()),
      "/workspace/problem-statement": Boolean(data.description?.problemStatement?.trim()),
      "/workspace/actors": Boolean(data.actors && data.actors.length > 0),
      "/workspace/solutions": Boolean(data.existingSolutions && data.existingSolutions.length > 0),
      "/workspace/functional-requirements": Boolean(data.functionalRequirements && data.functionalRequirements.length > 0),
      "/workspace/non-functional-requirements": Boolean(data.nonFunctionalRequirements && data.nonFunctionalRequirements.length > 0),
      "/workspace/backlog": Boolean(data.productBacklog && data.productBacklog.length > 0),
      "/workspace/uml-preparation": Boolean(
        (data.umlPreparation?.classes && data.umlPreparation.classes.length > 0) ||
        (data.umlPreparation?.relationships && data.umlPreparation.relationships.length > 0) ||
        (data.umlPreparation?.useCase?.actors && data.umlPreparation.useCase.actors.length > 0) ||
        (data.umlPreparation?.sequence?.participants && data.umlPreparation.sequence.participants.length > 0)
      ),
      "/workspace/report-structure": Boolean(data.reportStructure && data.reportStructure.length > 0),
      "/workspace/report-builder": Boolean(
        hasFinalReport(data.finalReport) ||
        data.reportChapters?.some((chapter: any) => chapter?.status === "completed" || hasReportContent(chapter))
      ),
      "/workspace/presentation": Boolean(data.presentation?.slides && data.presentation.slides.length > 0),
      "/workspace/pitch": Boolean(data.pitch?.slides && data.pitch.slides.some((slide: any) => String(slide?.speech || "").trim())),
      "/workspace/jury-simulation": Boolean(
        data.jurySimulation?.attempts?.some((attempt: any) =>
          attempt?.status === "completed" &&
          Number(attempt.presentationVersion) === Number(data.presentation?.version || (data.presentation?.slides?.length ? 1 : 0)) &&
          Number(attempt.pitchVersion) === Number(data.pitch?.version || (data.pitch?.slides?.length ? 1 : 0))
        )
      ),
    };

    const newSteps: Record<string, WorkflowStep> = {};
    
    // Evaluate strict sequential logic up to report-structure (index 0 to 8)
    let isPreviousCompleted = true;
    for (let i = 0; i <= 8; i++) {
      const path = NAV_PATHS[i];
      const isCompleted = completions[path] || false;
      let status: StepStatus = "Locked";

      if (isCompleted) {
        status = "Completed";
      } else if (isPreviousCompleted) {
        status = "Available";
      }

      newSteps[path] = { path, status, isCompleted };
      isPreviousCompleted = isCompleted;
    }

    // Branching Logic After Report Structure
    const isReportStructureCompleted = completions["/workspace/report-structure"] || false;
    
    // Report Builder, Presentation, and Pitch unlock together
    const branchingPaths = [
      "/workspace/report-builder", 
      "/workspace/presentation", 
      "/workspace/pitch"
    ];
    
    branchingPaths.forEach((path) => {
      const isCompleted = completions[path] || false;
      let status: StepStatus = "Locked";
      
      if (isCompleted) {
        status = "Completed";
      } else if (isReportStructureCompleted) {
        status = "Available";
      }
      
      newSteps[path] = { path, status, isCompleted };
    });

    // Jury Simulation Logic
    const isPresentationCompleted = completions["/workspace/presentation"] || false;
    const isPitchCompleted = completions["/workspace/pitch"] || false;
    const isJurySimCompleted = completions["/workspace/jury-simulation"] || false;
    
    let jurySimStatus: StepStatus = "Locked";
    if (isJurySimCompleted) {
      jurySimStatus = "Completed";
    } else if (isPresentationCompleted && isPitchCompleted) {
      jurySimStatus = "Available";
    }
    
    newSteps["/workspace/jury-simulation"] = {
      path: "/workspace/jury-simulation",
      status: jurySimStatus,
      isCompleted: isJurySimCompleted
    };

    setSteps(newSteps);
  };

  return (
    <WorkflowContext.Provider value={{ project, loading, steps, refreshWorkflow: fetchProjectAndEvaluate }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
