import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/context/WorkflowContext";
import HugeiconsIcon, { Mortarboard02Icon } from "@/components/ui/HugeiconsIcon";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { sidebarPhaseLabelKey, workspaceGroupKey } from "@/lib/workspaceLabels";

interface MethodologyStep {
  stepNumber: number;
  path: string;
  icon: string;
  group: "Specification" | "Engineering" | "Delivery";
}

const METHODOLOGY_GROUPS: { group: "Specification" | "Engineering" | "Delivery" }[] = [
  { group: "Specification" },
  { group: "Engineering" },
  { group: "Delivery" },
];

const METHODOLOGY_STEPS: MethodologyStep[] = [
  { stepNumber: 1, path: "/workspace/problem-statement", icon: "document", group: "Specification" },
  { stepNumber: 2, path: "/workspace/actors", icon: "group", group: "Specification" },
  { stepNumber: 3, path: "/workspace/solutions", icon: "search", group: "Specification" },

  { stepNumber: 4, path: "/workspace/functional-requirements", icon: "tune", group: "Engineering" },
  { stepNumber: 5, path: "/workspace/non-functional-requirements", icon: "shield", group: "Engineering" },
  { stepNumber: 6, path: "/workspace/backlog", icon: "list-ordered", group: "Engineering" },
  { stepNumber: 7, path: "/workspace/uml-preparation", icon: "account-tree", group: "Engineering" },

  { stepNumber: 8, path: "/workspace/report-structure", icon: "schema", group: "Delivery" },
  { stepNumber: 9, path: "/workspace/report-builder", icon: "book-open", group: "Delivery" },
  { stepNumber: 10, path: "/workspace/presentation", icon: "presentation", group: "Delivery" },
  { stepNumber: 11, path: "/workspace/pitch", icon: "mic", group: "Delivery" },
  { stepNumber: 12, path: "/workspace/jury-simulation", icon: "groups", group: "Delivery" },
];

interface SettingsNavItem {
  id: string;
  labelKey: string;
  path: string;
  icon: string;
  group: "workspace" | "personal";
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: "general", labelKey: "nav.general", path: "/workspace/settings", icon: "settings-02", group: "workspace" },
  { id: "project", labelKey: "nav.projectSpecifications", path: "/workspace/settings/onboarding", icon: "document", group: "workspace" },
  { id: "account", labelKey: "nav.accountSecurity", path: "/workspace/account", icon: "user-circle", group: "personal" },
  { id: "credits", labelKey: "nav.creditsBilling", path: "/workspace/settings/credits", icon: "wallet-02", group: "personal" },
];

interface SidebarProps {
  isOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsSidebarOpen }: SidebarProps) {
  const { t } = useTranslation(["shell", "settings"]);
  const { steps } = useWorkflow();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isSettingsMode = location.pathname.startsWith("/workspace/settings") || location.pathname === "/workspace/account";

  // Calculate 12-step methodology progress (Overview excluded)
  const { completedCount, totalCount, progressPercent } = useMemo(() => {
    const total = METHODOLOGY_STEPS.length;
    const completed = METHODOLOGY_STEPS.filter((p) => steps[p.path]?.status === "Completed").length;
    const percent = Math.round((completed / total) * 100);
    return { completedCount: completed, totalCount: total, progressPercent: percent };
  }, [steps]);

  const isOverviewActive = location.pathname === "/workspace/overview";

  // Filter settings nav items if user types in search
  const filteredSettings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SETTINGS_NAV_ITEMS;
    return SETTINGS_NAV_ITEMS.filter((item) => {
      const label = t(item.labelKey, { ns: "settings" }).toLowerCase();
      return label.includes(q) || item.id.includes(q);
    });
  }, [searchQuery, t]);

  const workspaceSettings = filteredSettings.filter((item) => item.group === "workspace");
  const personalSettings = filteredSettings.filter((item) => item.group === "personal");

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
      <aside data-tour="sections" data-tour-scroll
        className={cn(
          "bg-surface-container-low text-on-surface w-[min(265px,85vw)] h-full fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-outline-variant/60 transition-transform duration-300 ease-in-out font-sans select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {isSettingsMode ? (
          /* ========================================================= */
          /* SETTINGS MODE SIDEBAR                                     */
          /* ========================================================= */
          <>
            {/* Top Return to Project Header */}
            <div className="h-14 px-3 border-b border-outline-variant/60 flex items-center justify-between shrink-0">
              <Link
                to="/workspace/overview"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-container-high/60 group"
              >
                <HugeiconsIcon icon="arrow-left" size={15} className="group-hover:-translate-x-0.5 transition-transform text-primary" strokeWidth={2} />
                <span>{t("nav.backToWorkspace", { ns: "settings", defaultValue: "Back to Workspace" })}</span>
              </Link>
            </div>

            {/* Settings Title & Search Filter */}
            <div className="px-3 pt-3.5 pb-2 shrink-0">
              <h2 className="text-base font-bold text-on-surface px-1 tracking-tight">
                {t("workspace.title", { ns: "settings", defaultValue: "Settings" })}
              </h2>
              <div className="mt-2.5 relative flex items-center">
                <HugeiconsIcon icon="search" size={14} className="absolute left-2.5 text-on-surface-variant/70 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("nav.searchPlaceholder", { ns: "settings", defaultValue: "Search settings..." })}
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-surface border border-outline-variant/60 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-on-surface-variant hover:text-on-surface"
                  >
                    <HugeiconsIcon icon="close" size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Categorized Settings Navigation List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
              {workspaceSettings.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                    {t("nav.workspaceGroup", { ns: "settings", defaultValue: "Workspace" })}
                  </p>
                  <div className="space-y-1">
                    {workspaceSettings.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                          className={cn(
                            "group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                            isActive
                              ? "bg-surface text-on-surface shadow-2xs font-bold border border-outline-variant/50"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                          )}
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            size={16}
                            className={cn(
                              "shrink-0 transition-colors",
                              isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                            )}
                            strokeWidth={isActive ? 2 : 1.75}
                          />
                          <span className="truncate">{t(item.labelKey, { ns: "settings" })}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {personalSettings.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                    {t("nav.personalGroup", { ns: "settings", defaultValue: "Personal" })}
                  </p>
                  <div className="space-y-1">
                    {personalSettings.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                          className={cn(
                            "group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                            isActive
                              ? "bg-surface text-on-surface shadow-2xs font-bold border border-outline-variant/50"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                          )}
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            size={16}
                            className={cn(
                              "shrink-0 transition-colors",
                              isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                            )}
                            strokeWidth={isActive ? 2 : 1.75}
                          />
                          <span className="truncate">{t(item.labelKey, { ns: "settings" })}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* STANDARD WORKSPACE ROADMAP SIDEBAR                        */
          /* ========================================================= */
          <>
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
                    {t("navigation.thesisWorkspace")}
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
                  <span className="truncate">{t(sidebarPhaseLabelKey("overview"))}</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono shrink-0",
                    isOverviewActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  {t("navigation.hub")}
                </span>
              </NavLink>
            </div>

            {/* Methodology Roadmap Progress Pill */}
            <div className="px-3 pb-2 shrink-0">
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/60 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface mb-1.5">
                  <span className="text-on-surface-variant font-medium">{t("sidebar.roadmapProgress")}</span>
                  <span className="font-mono text-primary font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-on-surface-variant font-medium">
                  {t("sidebar.stepsCompleted", { completed: completedCount, total: totalCount })}
                </div>
              </div>
            </div>

            {/* Scrollable Methodology 12-Step Phases Nav */}
            <div data-tour-scroll className="flex-1 overflow-y-auto px-2 space-y-3.5 py-1">
              {METHODOLOGY_GROUPS.map(({ group }) => {
                const groupSteps = METHODOLOGY_STEPS.filter((s) => s.group === group);
                return (
                  <div key={group} className="space-y-1">
                    <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                      {t(workspaceGroupKey(group))}
                    </p>
                    <nav className="space-y-0.5" aria-label={t(workspaceGroupKey(group))}>
                      {groupSteps.map((step) => {
                        const stepState = steps[step.path];
                        const isCompleted = stepState?.status === "Completed";
                        const isLocked = stepState?.status === "Locked";
                        const isActive = location.pathname === step.path;

                        return (
                          <NavLink
                            key={step.path}
                            to={step.path}
                            onClick={(e) => {
                              if (isLocked) {
                                e.preventDefault();
                                return;
                              }
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            className={cn(
                              "group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                              isActive
                                ? "bg-surface-container-high text-on-surface shadow-2xs font-bold border border-outline-variant/50"
                                : isLocked
                                ? "text-outline-variant/70 opacity-50 cursor-not-allowed"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                            )}
                          >
                            {({ isActive: navActive }) => (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={cn(
                                      "w-4 text-[11px] font-mono font-medium text-center shrink-0",
                                      navActive
                                        ? "text-primary font-bold"
                                        : "text-outline-variant group-hover:text-on-surface-variant"
                                    )}
                                  >
                                    {step.stepNumber}
                                  </span>
                                  <HugeiconsIcon
                                    icon={step.icon}
                                    size={15}
                                    strokeWidth={navActive ? 2 : 1.75}
                                    className={cn(
                                      "shrink-0 transition-colors",
                                      navActive
                                        ? "text-primary"
                                        : "text-on-surface-variant group-hover:text-on-surface"
                                    )}
                                  />
                                  <span className="truncate">
                                    {t(sidebarPhaseLabelKey(step.path.replace("/workspace/", "")))}
                                  </span>
                                </div>

                                <div className="shrink-0 flex items-center ml-1">
                                  {isCompleted ? (
                                    <div className="w-4 h-4 rounded-full bg-secondary/15 flex items-center justify-center">
                                      <HugeiconsIcon
                                        icon="checkmark-circle-02"
                                        size={12}
                                        strokeWidth={2.5}
                                        className="text-secondary"
                                      />
                                    </div>
                                  ) : isLocked ? (
                                    <HugeiconsIcon
                                      icon="lock"
                                      size={12}
                                      strokeWidth={1.5}
                                      className="text-outline-variant/50"
                                    />
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

            {/* Footer Navigation */}
            <div className="mt-auto border-t border-outline-variant/60 p-2.5 bg-surface-container-lowest/50 shrink-0">
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
                <span>{t(sidebarPhaseLabelKey("settings"))}</span>
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
