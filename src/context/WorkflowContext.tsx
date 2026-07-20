import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchApi } from "@/lib/api";
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

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<Record<string, WorkflowStep>>({});
  const location = useLocation();

  const fetchProjectAndEvaluate = async () => {
    try {
      const data = await fetchApi("/projects/my-project");
      setProject(data);
      evaluateWorkflow(data);
    } catch (error) {
      console.error("Failed to fetch project for workflow:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndEvaluate();
  }, []);

  // Refetch when location changes to ensure the workflow is up to date if the user saved something
  useEffect(() => {
    if (project) {
      fetchProjectAndEvaluate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
      // Since these don't have backend storage yet, they will evaluate to false unless we add explicit completion triggers
      "/workspace/report-builder": false,
      "/workspace/presentation": false,
      "/workspace/pitch": false,
      "/workspace/jury-simulation": false,
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
