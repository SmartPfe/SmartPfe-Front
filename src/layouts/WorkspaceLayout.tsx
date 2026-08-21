import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { WorkflowProvider, useWorkflow } from "@/context/WorkflowContext";
import { AiGenerationProvider } from "@/context/AiGenerationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import FloatingAiDock from "@/components/ai/FloatingAiDock";

const WORKFLOW_METHODOLOGY_PATHS = [
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

function WorkspaceRouteGuard({ isFullWidthPage }: { isFullWidthPage: boolean }) {
  const { steps, loading } = useWorkflow();
  const location = useLocation();

  const isWorkflowRoute = WORKFLOW_METHODOLOGY_PATHS.includes(location.pathname);
  const stepState = steps[location.pathname];
  const isLocked = isWorkflowRoute && (stepState ? stepState.status === "Locked" : true);

  // If this is a methodology workflow route, do not render Outlet while loading or evaluating
  if (isWorkflowRoute && (loading || !stepState)) {
    return (
      <div className="flex flex-col min-h-[55vh] items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-on-surface-variant font-medium">Verifying methodology access...</p>
      </div>
    );
  }

  // If this is a workflow route and is locked, immediately redirect to overview (no outlet rendered)
  if (isWorkflowRoute && isLocked) {
    return <Navigate to="/workspace/overview" replace />;
  }

  return (
    <div className={cn(
      "w-full min-w-0 min-h-full flex flex-col",
      isFullWidthPage ? "max-w-none px-0" : "max-w-6xl mx-auto"
    )}>
      <Outlet />
    </div>
  );
}

export default function WorkspaceLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const isFullWidthPage = location.pathname.includes("/workspace/report-builder") || location.pathname.includes("/workspace/presentation");

  // Close sidebar by default on mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <NotificationProvider>
      <OnboardingProvider>
        <WorkflowProvider>
          <AiGenerationProvider>
            <div className="flex h-dvh min-h-dvh bg-surface overflow-hidden">
              <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
              <div className={cn(
                "flex-1 flex flex-col h-dvh min-w-0 transition-all duration-300 ease-in-out",
                isSidebarOpen ? "md:ml-[280px]" : "ml-0"
              )}>
                <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className={cn(
                  "flex-1 overflow-y-auto overflow-x-hidden relative bg-surface-container-lowest",
                  isFullWidthPage ? "p-4 sm:p-6" : "p-4 sm:p-6 md:p-8"
                )}>
                  <WorkspaceRouteGuard isFullWidthPage={isFullWidthPage} />
                </main>
              </div>
              <FloatingAiDock />
            </div>
          </AiGenerationProvider>
        </WorkflowProvider>
      </OnboardingProvider>
    </NotificationProvider>
  );
}
