import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAiGeneration } from "@/context/AiGenerationContext";
import { cn } from "@/lib/utils";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { useTranslation } from "react-i18next";
import { displayApiMessage } from "@/lib/apiMessage";

export default function FloatingAiDock() {
  const { t } = useTranslation("controls");
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

  const getTaskTitle = (task: (typeof allTasks)[number]) => {
    if (task.scope === "system" && task.id.startsWith("system:concurrency-limit-")) {
      return t("aiDock.concurrentTitle");
    }
    return task.uiTitleKey ? t(task.uiTitleKey) : task.title || t("aiDock.defaultTitle");
  };
  const getTaskMessage = (task: (typeof allTasks)[number], isCompleted: boolean, isError: boolean) => {
    if (task.scope === "system" && task.id.startsWith("system:concurrency-limit-")) {
      const rawError = task.error || "";
      const limit = task.subTitle?.match(/up to (\d+) sections in parallel/)?.[1]
        || rawError.match(/Limit reached: (\d+) tasks running/)?.[1]
        || "2";
      return t("aiDock.concurrentDescription", { count: Number(limit) });
    }
    if (isCompleted) return t("aiDock.readyToView");
    if (isError && task.errorMessage && typeof task.errorMessage !== "string") {
      return displayApiMessage(task.errorMessage);
    }
    if (task.subTitle === "Ready") return t("aiDock.ready");
    if (task.subTitle === "Failed") return t("aiDock.failed");
    if (!isError && task.uiSubTitleKey) {
      const values = { ...task.uiSubTitleValues };
      for (const [name, key] of Object.entries(task.uiSubTitleValueKeys || {})) values[name] = t(key);
      return t(task.uiSubTitleKey, values);
    }
    if (task.subTitle === "Generating content with AI...") return t("aiDock.generatingInBackground");
    if (task.subTitle) return task.subTitle;
    if (isError) {
      const rawError = task.error || "";
      return rawError === "Generation failed" ? t("aiDock.generationFailed") : task.errorMessage ? displayApiMessage(task.errorMessage) : rawError || t("aiDock.generationFailed");
    }
    return t("aiDock.generatingInBackground");
  };

  return (
    <div
      aria-label={t("aiDock.activeGenerations")}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-84 max-w-[calc(100vw-32px)] pointer-events-auto"
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
              "w-full rounded-2xl border bg-surface-container-lowest/95 backdrop-blur-md p-4 shadow-xl transition-all duration-300 ease-out flex flex-col gap-3 animate-in fade-in-50 slide-in-from-bottom-3",
              isCompleted
                ? "border-secondary/40 shadow-secondary/5"
                : isError
                ? "border-error/40 shadow-error/5"
                : "border-primary/30 ring-1 ring-primary/20 shadow-primary/5"
            )}
          >
            {/* Header: Status Icon, Title, and Action Controls */}
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status Indicator */}
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                  {isRunning ? (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : isCompleted ? (
                    <HugeiconsIcon icon="checkmark-circle-02" size={20} strokeWidth={2} className="text-secondary" />
                  ) : (
                    <HugeiconsIcon icon="cancel-circle" size={20} strokeWidth={2} className="text-error" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-on-surface truncate">
                      {getTaskTitle(task)}
                    </h4>
                    {isRunning && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 font-medium leading-tight">
                    {getTaskMessage(task, isCompleted, isError)}
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
                    title={t("aiDock.jumpToSection")}
                  >
                    <span>{t("aiDock.view")}</span>
                    <HugeiconsIcon icon="arrow-right-01" size={14} strokeWidth={2} />
                  </button>
                )}

                {isRunning ? (
                  <button
                    type="button"
                    onClick={() => cancelTask(task.id)}
                    className="h-7 px-2.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer shrink-0 border border-outline-variant/60"
                    title={t("aiDock.stopTooltip")}
                  >
                    <HugeiconsIcon icon="cancel-circle" size={14} strokeWidth={1.75} />
                    <span>{t("aiDock.stop")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => dismissTask(task.id)}
                    className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={t("aiDock.close")}
                  >
                    <HugeiconsIcon icon="close" size={16} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>

            {isRunning && task.scope !== "system" && <p className="px-3 pb-2 text-[10px] leading-relaxed text-on-surface-variant">{t("aiDock.billingNote")}</p>}
            {/* Active Task Progress Bar */}
            {isRunning && (
              <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/60 via-primary to-secondary rounded-full"
                  style={{
                    width: "45%",
                    animation: "ai-dock-shimmer-linear 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
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
