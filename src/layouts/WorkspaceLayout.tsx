import { Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { OnboardingProvider } from "@/context/OnboardingContext";

import { WORKSPACE_PHASES } from "@/lib/constants";

function ProgressStepper() {
  const location = useLocation();
  const currentIndex = WORKSPACE_PHASES.findIndex(p => p.path === location.pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && currentIndex !== -1) {
      const activeEl = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentIndex]);

  if (currentIndex === -1) {
    return null;
  }

  return (
    <div className="bg-surface border-b border-outline-variant px-3 py-3 sm:px-6 sm:py-4 overflow-hidden shrink-0">
      <div className="max-w-6xl mx-auto w-full relative">
        <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {WORKSPACE_PHASES.map((phase, index) => {
            const isCompleted = currentIndex !== -1 && index < currentIndex;
            const isActive = index === currentIndex;
            const isPending = currentIndex !== -1 && index > currentIndex;

            return (
              <div key={phase.id} className="flex items-center shrink-0">
                <Link
                  to={phase.path}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[80px] p-2 rounded-lg transition-colors group",
                    isActive ? "bg-primary-container text-on-primary-container border border-primary/20" : "hover:bg-surface-container text-on-surface-variant"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center mb-1 border-2 transition-all duration-300",
                    isCompleted ? "bg-primary border-primary text-on-primary" : 
                    isActive ? "border-primary text-primary" : 
                    "border-outline bg-surface-container"
                  )}>
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    ) : (
                      <span className="text-[12px] font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-center whitespace-nowrap",
                    isActive ? "text-primary" : isCompleted ? "text-on-surface" : "text-outline-variant"
                  )}>
                    {phase.label}
                  </span>
                </Link>

                {index < WORKSPACE_PHASES.length - 1 && (
                  <div className={cn(
                    "w-8 h-[2px] mx-1 rounded transition-colors",
                    isCompleted ? "bg-primary" : "bg-outline-variant/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex h-dvh min-h-dvh bg-surface overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className={cn(
          "flex-1 flex flex-col h-dvh min-w-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-[280px]" : "ml-0"
        )}>
          <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <ProgressStepper />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 relative bg-surface-container-lowest">
            <div className="max-w-6xl mx-auto w-full min-w-0 min-h-full flex flex-col">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
