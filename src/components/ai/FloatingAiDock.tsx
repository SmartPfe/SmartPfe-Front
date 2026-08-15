import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAiGeneration } from "@/context/AiGenerationContext";
import { cn } from "@/lib/utils";

export default function FloatingAiDock() {
  const { tasks, completedTasksList, activeRouteState, dismissTask, cancelTask, jumpToTask } = useAiGeneration();
  const location = useLocation();

  // Auto-dismiss completed or errored tasks after 8 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    completedTasksList.forEach((task) => {
      if (task.completedAt) {
        const elapsed = Date.now() - task.completedAt;
        if (elapsed > 8000) {
          dismissTask(task.id);
        } else {
          const timer = setTimeout(() => {
            dismissTask(task.id);
          }, 8000 - elapsed);
          timers.push(timer);
        }
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [completedTasksList, dismissTask]);

  const allTasks = Object.values(tasks);
  if (allTasks.length === 0) return null;

  return (
    <div
      aria-label="Active Generations"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-32px)] pointer-events-auto"
    >
      <style>{`
        @keyframes ai-dock-shimmer-linear {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      {allTasks.map((task) => {
        const isRunning = task.status !== "completed" && task.status !== "error";
        const isCompleted = task.status === "completed";
        const isError = task.status === "error";

        // Evaluate if user is currently on the exact page AND looking at this exact section
        const isCurrentPage = location.pathname === task.pageRoute;
        const taskTargetSection = task.navigationState?.activeSectionId || task.targetId;
        const isCurrentSection = !taskTargetSection || activeRouteState.sectionId === taskTargetSection;
        const isCurrentTarget = isCurrentPage && isCurrentSection;

        return (
          <div
            key={task.id}
            className={cn(
              "w-full rounded-xl border bg-surface-container-lowest/95 backdrop-blur-md p-3.5 shadow-xl transition-all duration-200 flex flex-col gap-2.5",
              isCompleted
                ? "border-secondary/40"
                : isError
                ? "border-error/40"
                : "border-outline-variant/90 ring-1 ring-primary/20"
            )}
          >
            {/* Header: Status Icon, Title, and Action Controls */}
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Status Indicator */}
                {isRunning ? (
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : isCompleted ? (
                  <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-error shrink-0">
                    error
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-on-surface truncate">
                    {task.title || "AI Generation"}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 font-medium leading-tight">
                    {isCompleted
                      ? "Ready to view"
                      : task.subTitle || (isError ? task.error || "Generation failed" : "Generating in background...")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!isCurrentTarget && task.pageRoute && (
                  <button
                    type="button"
                    onClick={() => jumpToTask(task)}
                    className="h-7 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    title="Jump to this section"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}

                {isRunning ? (
                  <button
                    type="button"
                    onClick={() => cancelTask(task.id)}
                    className="h-7 px-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer shrink-0"
                    title="Stop and cancel this generation"
                  >
                    <span className="material-symbols-outlined text-[15px]">cancel</span>
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => dismissTask(task.id)}
                    className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Close notification"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Task Progress Bar */}
            {isRunning && (
              <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: "45%",
                    animation: "ai-dock-shimmer-linear 1.4s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
