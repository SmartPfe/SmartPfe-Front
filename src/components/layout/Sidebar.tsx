import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/context/WorkflowContext";
import HugeiconsIcon, { Mortarboard02Icon } from "@/components/ui/HugeiconsIcon";
import { useTheme } from "@/lib/theme";
import { useMemo, useState, useEffect } from "react";

interface MethodologyStep {
  stepNumber: number;
  path: string;
  label: string;
  icon: string;
  group: "Specification" | "Engineering" | "Delivery";
}

const METHODOLOGY_GROUPS: { group: "Specification" | "Engineering" | "Delivery"; title: string }[] = [
  { group: "Specification", title: "Specification" },
  { group: "Engineering", title: "Engineering & Backlog" },
  { group: "Delivery", title: "Academic Delivery" },
];

const METHODOLOGY_STEPS: MethodologyStep[] = [
  { stepNumber: 1, path: "/workspace/problem-statement", label: "Problem Statement", icon: "document", group: "Specification" },
  { stepNumber: 2, path: "/workspace/actors", label: "Actors & Stakeholders", icon: "group", group: "Specification" },
  { stepNumber: 3, path: "/workspace/solutions", label: "Existing Solutions", icon: "search", group: "Specification" },

  { stepNumber: 4, path: "/workspace/functional-requirements", label: "Functional Req.", icon: "tune", group: "Engineering" },
  { stepNumber: 5, path: "/workspace/non-functional-requirements", label: "Non-Functional Req.", icon: "shield", group: "Engineering" },
  { stepNumber: 6, path: "/workspace/backlog", label: "Product Backlog", icon: "list-ordered", group: "Engineering" },
  { stepNumber: 7, path: "/workspace/uml-preparation", label: "UML Architecture", icon: "account-tree", group: "Engineering" },

  { stepNumber: 8, path: "/workspace/report-structure", label: "Report Structure", icon: "schema", group: "Delivery" },
  { stepNumber: 9, path: "/workspace/report-builder", label: "Report Builder", icon: "book-open", group: "Delivery" },
  { stepNumber: 10, path: "/workspace/presentation", label: "Presentation Deck", icon: "presentation", group: "Delivery" },
  { stepNumber: 11, path: "/workspace/pitch", label: "Pitch Speech", icon: "mic", group: "Delivery" },
  { stepNumber: 12, path: "/workspace/jury-simulation", label: "Jury Simulation", icon: "groups", group: "Delivery" },
];

interface SidebarProps {
  isOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsSidebarOpen }: SidebarProps) {
  const { steps } = useWorkflow();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  // Calculate 12-step methodology progress (Overview excluded)
  const { completedCount, totalCount, progressPercent } = useMemo(() => {
    const total = METHODOLOGY_STEPS.length;
    const completed = METHODOLOGY_STEPS.filter((p) => steps[p.path]?.status === "Completed").length;
    const percent = Math.round((completed / total) * 100);
    return { completedCount: completed, totalCount: total, progressPercent: percent };
  }, [steps]);

  const isOverviewActive = location.pathname === "/workspace/overview";

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Main Sidebar Container */}
      <aside
        className={cn(
          "bg-surface-container-low text-on-surface w-[min(265px,85vw)] h-full fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-outline-variant/60 transition-transform duration-300 ease-in-out font-sans select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Brand Logo Header */}
        <div className="h-14 px-4 border-b border-outline-variant/60 flex items-center justify-between shrink-0">
          <Link
            to="/workspace/overview"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={Mortarboard02Icon} size={19} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-on-surface leading-tight">
                SmartPFE
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium tracking-wider uppercase">
                Thesis Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Dedicated Overview Main Hub Link */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <NavLink
            to="/workspace/overview"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group",
              isOverviewActive
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface hover:bg-surface-container-high/70 bg-surface border border-outline-variant/50 shadow-2xs"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <HugeiconsIcon
                icon="dashboard"
                size={16}
                strokeWidth={1.8}
                className={isOverviewActive ? "text-on-primary" : "text-primary"}
              />
              <span className="truncate">Project Overview</span>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono shrink-0",
                isOverviewActive
                  ? "bg-white/20 text-white"
                  : "bg-surface-container text-on-surface-variant"
              )}
            >
              Hub
            </span>
          </NavLink>
        </div>

        {/* Methodology Roadmap Progress Pill */}
        <div className="px-3 pb-2 shrink-0">
          <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/60 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface mb-1.5">
              <span className="text-on-surface-variant font-medium">Roadmap Progress</span>
              <span className="font-mono text-primary font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium mt-1.5">
              <span>{completedCount} of {totalCount} steps done</span>
            </div>
          </div>
        </div>

        {/* Scrollable 12-Step Methodology Pipeline */}
        <div className="flex-1 overflow-y-auto py-1 px-3 space-y-4 custom-scrollbar">
          {METHODOLOGY_GROUPS.map((group) => {
            const groupSteps = METHODOLOGY_STEPS.filter((p) => p.group === group.group);

            return (
              <div key={group.group} className="space-y-1">
                <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 font-mono">
                  {group.title}
                </div>

                <nav className="space-y-0.5">
                  {groupSteps.map((step) => {
                    const stepState = steps[step.path] || { status: "Locked", isCompleted: false };
                    const isLocked = stepState.status === "Locked";
                    const isCompleted = stepState.status === "Completed";

                    return (
                      <NavLink
                        key={step.path}
                        to={isLocked ? "#" : step.path}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                          } else if (window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group",
                            isLocked
                              ? "opacity-50 cursor-not-allowed text-on-surface-variant/70"
                              : isActive
                              ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[10px] font-mono text-outline-variant/80 shrink-0 w-3.5 text-right">
                                {step.stepNumber}
                              </span>
                              <HugeiconsIcon
                                icon={step.icon}
                                size={15}
                                strokeWidth={isActive ? 2 : 1.75}
                                className={cn(
                                  "shrink-0 transition-colors",
                                  isActive
                                    ? "text-primary"
                                    : "text-on-surface-variant group-hover:text-on-surface"
                                )}
                              />
                              <span className="truncate">{step.label}</span>
                            </div>

                            {/* Status Icon Badge */}
                            <div className="shrink-0 ml-1.5 flex items-center">
                              {isCompleted ? (
                                <span className="w-5 h-5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                                  <HugeiconsIcon
                                    icon="checkmark-circle-02"
                                    size={12}
                                    strokeWidth={2.5}
                                  />
                                </span>
                              ) : isLocked ? (
                                <HugeiconsIcon
                                  icon="lock"
                                  size={13}
                                  strokeWidth={1.5}
                                  className="text-on-surface-variant/40"
                                />
                              ) : isActive ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              ) : (
                                <HugeiconsIcon
                                  icon="lock-open"
                                  size={12}
                                  strokeWidth={1.5}
                                  className="text-outline-variant/60 group-hover:text-on-surface-variant transition-colors"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation & Synchronized Theme Switcher */}
        <div className="mt-auto border-t border-outline-variant/60 p-2.5 space-y-1 bg-surface-container-lowest/50 shrink-0">
          {/* Dark / Light Mode Switch Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 rounded-lg transition-colors font-medium cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={isDarkMode ? "moon" : "sun"}
                size={15}
                className="text-on-surface-variant group-hover:text-primary transition-colors"
                strokeWidth={1.75}
              />
              <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <div
              className={cn(
                "w-7 h-4 rounded-full p-0.5 transition-colors relative flex items-center",
                isDarkMode ? "bg-primary" : "bg-outline-variant/80"
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full bg-white transition-transform transform shadow-xs",
                  isDarkMode ? "translate-x-3" : "translate-x-0"
                )}
              />
            </div>
          </button>

          {/* Settings Link */}
          <Link
            to="/workspace/settings"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 rounded-lg transition-colors font-medium group"
          >
            <HugeiconsIcon
              icon="settings-02"
              size={15}
              className="text-on-surface-variant group-hover:text-primary transition-colors"
              strokeWidth={1.75}
            />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}


