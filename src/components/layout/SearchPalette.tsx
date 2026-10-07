import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { useWorkflow } from "@/context/WorkflowContext";
import { cn } from "@/lib/utils";

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  label: string;
  category: "phases" | "architecture" | "deliverables" | "actions";
  categoryLabel: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  path?: string;
  action?: () => void;
  keywords: string[];
}

const CATEGORY_TABS = ["all", "phases", "architecture", "deliverables", "actions"];

export default function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
  const { t } = useTranslation("shell");
  const { steps } = useWorkflow();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Define searchable catalog with categories and Hugeicons
  const searchItems: SearchItem[] = useMemo(() => [
    // Core Phases
    {
      id: "overview",
      label: t("search.items.overview.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.overview.description"),
      icon: "dashboard",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      path: "/workspace/overview",
      keywords: ["overview", "project", "setup", "basics", "domain", "university", "goals", "projet", "université", "objectifs"],
    },
    {
      id: "problem-statement",
      label: t("search.items.problemStatement.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.problemStatement.description"),
      icon: "document",
      iconBg: "bg-blue-500/10 dark:bg-blue-400/15",
      iconColor: "text-blue-600 dark:text-blue-400",
      path: "/workspace/problem-statement",
      keywords: ["problem", "statement", "issue", "context", "objectives", "challenge", "problème", "problématique", "contexte", "objectifs"],
    },
    {
      id: "actors",
      label: t("search.items.actors.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.actors.description"),
      icon: "group",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-400/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      path: "/workspace/actors",
      keywords: ["actors", "users", "personas", "stakeholders", "roles", "systems", "acteurs", "parties prenantes", "utilisateurs", "systèmes"],
    },
    {
      id: "solutions",
      label: t("search.items.solutions.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.solutions.description"),
      icon: "search",
      iconBg: "bg-amber-500/10 dark:bg-amber-400/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      path: "/workspace/solutions",
      keywords: ["solutions", "state of the art", "sota", "benchmark", "competitors", "market", "état de l'art", "état de l’art", "comparaison", "marché"],
    },
    {
      id: "functional-requirements",
      label: t("search.items.functionalRequirements.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.functionalRequirements.description"),
      icon: "tune",
      iconBg: "bg-purple-500/10 dark:bg-purple-400/15",
      iconColor: "text-purple-600 dark:text-purple-400",
      path: "/workspace/functional-requirements",
      keywords: ["functional", "requirements", "rf", "features", "behaviors", "specs", "exigences fonctionnelles", "fonctionnalités", "comportements"],
    },
    {
      id: "non-functional-requirements",
      label: t("search.items.nonFunctionalRequirements.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.nonFunctionalRequirements.description"),
      icon: "shield",
      iconBg: "bg-rose-500/10 dark:bg-rose-400/15",
      iconColor: "text-rose-600 dark:text-rose-400",
      path: "/workspace/non-functional-requirements",
      keywords: ["non-functional", "nfr", "rnf", "security", "performance", "scalability", "exigences non fonctionnelles", "sécurité", "performances", "évolutivité"],
    },
    {
      id: "backlog",
      label: t("search.items.backlog.label"),
      category: "phases",
      categoryLabel: t("search.categories.phases"),
      description: t("search.items.backlog.description"),
      icon: "list-ordered",
      iconBg: "bg-cyan-500/10 dark:bg-cyan-400/15",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      path: "/workspace/backlog",
      keywords: ["backlog", "user stories", "sprint", "agile", "scrum", "tasks", "priority", "récit utilisateur", "récits utilisateurs", "tâches", "priorités"],
    },

    // Architecture & UML
    {
      id: "uml-preparation",
      label: t("search.items.uml.label"),
      category: "architecture",
      categoryLabel: t("search.categories.architecture"),
      description: t("search.items.uml.description"),
      icon: "account-tree",
      iconBg: "bg-teal-500/10 dark:bg-teal-400/15",
      iconColor: "text-teal-600 dark:text-teal-400",
      path: "/workspace/uml-preparation",
      keywords: ["uml", "diagrams", "plantuml", "class diagram", "sequence diagram", "use case", "architecture", "diagrammes", "diagramme de classes", "séquence", "cas d'utilisation"],
    },

    // Deliverables & Defense
    {
      id: "report-structure",
      label: t("search.items.reportStructure.label"),
      category: "deliverables",
      categoryLabel: t("search.categories.reportsStudio"),
      description: t("search.items.reportStructure.description"),
      icon: "schema",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      path: "/workspace/report-structure",
      keywords: ["structure", "table of contents", "outline", "chapters", "thesis", "report", "table des matières", "sommaire", "chapitres", "mémoire", "rapport"],
    },
    {
      id: "report-builder",
      label: t("search.items.reportBuilder.label"),
      category: "deliverables",
      categoryLabel: t("search.categories.reportsStudio"),
      description: t("search.items.reportBuilder.description"),
      icon: "book-open",
      iconBg: "bg-violet-500/10 dark:bg-violet-400/15",
      iconColor: "text-violet-600 dark:text-violet-400",
      path: "/workspace/report-builder",
      keywords: ["report builder", "studio", "editor", "thesis writing", "export pdf", "markdown", "latex", "rédaction", "éditeur", "mémoire", "rapport", "exporter pdf"],
    },
    {
      id: "presentation",
      label: t("search.items.presentation.label"),
      category: "deliverables",
      categoryLabel: t("search.categories.defensePreparation"),
      description: t("search.items.presentation.description"),
      icon: "presentation",
      iconBg: "bg-orange-500/10 dark:bg-orange-400/15",
      iconColor: "text-orange-600 dark:text-orange-400",
      path: "/workspace/presentation",
      keywords: ["presentation", "slides", "keynote", "defense", "soutenance", "powerpoint", "présentation", "diapositives", "défense"],
    },
    {
      id: "pitch",
      label: t("search.items.pitch.label"),
      category: "deliverables",
      categoryLabel: t("search.categories.defensePreparation"),
      description: t("search.items.pitch.description"),
      icon: "mic",
      iconBg: "bg-amber-500/10 dark:bg-amber-400/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      path: "/workspace/pitch",
      keywords: ["pitch", "speech", "oral defense", "timer", "script", "presentation", "discours", "chronométré", "soutenance orale"],
    },
    {
      id: "jury-simulation",
      label: t("search.items.jurySimulation.label"),
      category: "deliverables",
      categoryLabel: t("search.categories.defensePreparation"),
      description: t("search.items.jurySimulation.description"),
      icon: "groups",
      iconBg: "bg-red-500/10 dark:bg-red-400/15",
      iconColor: "text-red-600 dark:text-red-400",
      path: "/workspace/jury-simulation",
      keywords: ["jury", "simulation", "questions", "defense practice", "oral exam", "mock defense", "questions-réponses", "soutenance", "oral", "entraînement"],
    },

    // Quick Actions
    {
      id: "action-settings",
      label: t("search.items.settings.label"),
      category: "actions",
      categoryLabel: t("search.categories.preferences"),
      description: t("search.items.settings.description"),
      icon: "settings-02",
      iconBg: "bg-slate-500/10 dark:bg-slate-400/15",
      iconColor: "text-slate-600 dark:text-slate-400",
      path: "/workspace/settings",
      keywords: ["settings", "preferences", "config", "api key", "language", "theme", "paramètres", "préférences", "clé api", "langue", "thème"],
    },
    {
      id: "action-account",
      label: t("search.items.account.label"),
      category: "actions",
      categoryLabel: t("search.categories.userAccount"),
      description: t("search.items.account.description"),
      icon: "user-circle",
      iconBg: "bg-sky-500/10 dark:bg-sky-400/15",
      iconColor: "text-sky-600 dark:text-sky-400",
      path: "/workspace/account",
      keywords: ["account", "profile", "user", "email", "avatar", "password", "compte", "profil", "utilisateur", "mot de passe"],
    },
  ], [t]);

  // Filter items by query and active category tab
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchItems.filter((item) => {
      // Category filter
      if (activeTab !== "all" && item.category !== activeTab) {
        return false;
      }
      // Query filter
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.path || "").toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });
  }, [searchItems, query, activeTab]);

  // Reset selected index when query or tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    } else {
      setQuery("");
      setActiveTab("all");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          const isItemLocked = item.path ? steps[item.path]?.status === "Locked" : false;
          if (!isItemLocked) {
            if (item.path) {
              navigate(item.path);
            } else if (item.action) {
              item.action();
            }
            onClose();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose, steps]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[14vh] px-3 sm:px-4 font-sans animate-in fade-in duration-150">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notion-Style Floating Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-outline-variant/80 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label={t("search.dialogLabel")}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/60 bg-surface">
          <HugeiconsIcon
            icon="search"
            size={20}
            className="text-primary shrink-0"
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            type="text"
            aria-label={t("search.inputLabel")}
            className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 text-base sm:text-lg w-full min-w-0 font-medium"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              type="button"
              className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
              title={t("search.clearQuery")}
            >
              <HugeiconsIcon icon="close" size={14} strokeWidth={2} />
            </button>
          ) : null}
          <button
            onClick={onClose}
            type="button"
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/60 text-[11px] font-mono font-semibold text-on-surface-variant/80 hover:text-on-surface transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/50 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                )}
              >
                {t(`search.tabs.${tab}`)}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[52vh] sm:max-h-[58vh] overflow-y-auto p-2 space-y-1 divide-y divide-outline-variant/30"
        >
          {filteredItems.length > 0 ? (
            <div className="space-y-1 pt-1">
              {filteredItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                const isLocked = item.path ? steps[item.path]?.status === "Locked" : false;

                return (
                  <button
                    key={item.id}
                    data-index={index}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;
                      if (item.path) navigate(item.path);
                      else if (item.action) item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group select-none",
                      isLocked
                        ? "opacity-40 cursor-not-allowed bg-surface-container/20"
                        : isSelected
                        ? "bg-surface-container-high/90 shadow-xs text-on-surface cursor-pointer"
                        : "hover:bg-surface-container-low text-on-surface cursor-pointer"
                    )}
                  >
                    {/* Item Icon Badge */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                        item.iconBg,
                        item.iconColor,
                        isSelected && !isLocked ? "scale-105" : ""
                      )}
                    >
                      <HugeiconsIcon icon={isLocked ? "lock" : item.icon} size={18} strokeWidth={1.8} />
                    </div>

                    {/* Item Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold truncate transition-colors",
                          isLocked ? "text-on-surface-variant/80" : isSelected ? "text-primary" : "text-on-surface"
                        )}>
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/90 px-1.5 py-0.5 rounded-md bg-surface-container-high/80 shrink-0 font-mono">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Indicator / Return Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/60 text-on-surface-variant/70 text-[10px] font-mono font-medium">
                          <HugeiconsIcon icon="lock" size={11} strokeWidth={1.8} />
                          <span>{t("search.locked")}</span>
                        </span>
                      ) : isSelected ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono font-medium animate-in fade-in duration-100">
                          <span>{t("search.jump")}</span>
                          <span className="text-[12px]">↵</span>
                        </span>
                      ) : (
                        <HugeiconsIcon
                          icon="arrow-right-01"
                          size={14}
                          className="text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-3 text-on-surface-variant">
                <HugeiconsIcon icon="search" size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-on-surface">{t("search.noMatchingItems")}</p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                <Trans
                  ns="shell"
                  i18nKey="search.trySuggestions"
                  values={{ query }}
                  components={{
                    uml: <button type="button" onClick={() => setQuery(t("search.suggestions.uml"))} className="text-primary underline cursor-pointer" />,
                    report: <button type="button" onClick={() => setQuery(t("search.suggestions.report"))} className="text-primary underline cursor-pointer" />,
                    requirements: <button type="button" onClick={() => setQuery(t("search.suggestions.requirements"))} className="text-primary underline cursor-pointer" />,
                  }}
                />
              </p>
            </div>
          )}
        </div>

        {/* Minimalist Notion Footer */}
        <div className="px-4 py-2.5 bg-surface-container-lowest border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">↑↓</kbd>
              <span>{t("search.navigate")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">↵</kbd>
              <span>{t("search.open")}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">esc</kbd>
              <span>{t("search.dismiss")}</span>
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-outline-variant">
            <HugeiconsIcon icon="command" size={12} className="text-primary" />
            <span>{t("search.quickSwitcher")}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

