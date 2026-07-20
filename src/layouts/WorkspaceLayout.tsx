import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { WorkflowProvider } from "@/context/WorkflowContext";

export default function WorkspaceLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar by default on mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <OnboardingProvider>
      <WorkflowProvider>
        <div className="flex h-dvh min-h-dvh bg-surface overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          <div className={cn(
            "flex-1 flex flex-col h-dvh min-w-0 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "md:ml-[280px]" : "ml-0"
          )}>
            <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 relative bg-surface-container-lowest">
              <div className="max-w-6xl mx-auto w-full min-w-0 min-h-full flex flex-col">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </WorkflowProvider>
    </OnboardingProvider>
  );
}
