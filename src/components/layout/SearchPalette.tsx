import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { WORKSPACE_PHASES } from "@/lib/constants";
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

const CATEGORY_TABS = [
  { id: "all", label: "All Items" },
  { id: "phases", label: "Phases" },
  { id: "architecture", label: "Architecture" },
  { id: "deliverables", label: "Deliverables" },
  { id: "actions", label: "Quick Actions" },
];

export default function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
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
      label: "Project Overview",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Define core premise, academic domain, goals, and team members.",
      icon: "dashboard",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      path: "/workspace/overview",
      keywords: ["overview", "project", "setup", "basics", "domain", "university", "goals"],
    },
    {
      id: "problem-statement",
      label: "Problem Statement",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Articulate the exact problem, existing challenges, and objectives.",
      icon: "document",
      iconBg: "bg-blue-500/10 dark:bg-blue-400/15",
      iconColor: "text-blue-600 dark:text-blue-400",
      path: "/workspace/problem-statement",
      keywords: ["problem", "statement", "issue", "context", "objectives", "challenge"],
    },
    {
      id: "actors",
      label: "Actors & Personas",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Map primary, secondary, and external systems interacting with the solution.",
      icon: "group",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-400/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      path: "/workspace/actors",
      keywords: ["actors", "users", "personas", "stakeholders", "roles", "systems"],
    },
    {
      id: "solutions",
      label: "Existing Solutions (SOTA)",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "State-of-the-art comparative matrix of existing market alternatives.",
      icon: "search",
      iconBg: "bg-amber-500/10 dark:bg-amber-400/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      path: "/workspace/solutions",
      keywords: ["solutions", "state of the art", "sota", "benchmark", "competitors", "market"],
    },
    {
      id: "functional-requirements",
      label: "Functional Requirements",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Specify system behaviors (RF-01, RF-02...) and feature specifications.",
      icon: "tune",
      iconBg: "bg-purple-500/10 dark:bg-purple-400/15",
      iconColor: "text-purple-600 dark:text-purple-400",
      path: "/workspace/functional-requirements",
      keywords: ["functional", "requirements", "rf", "features", "behaviors", "specs"],
    },
    {
      id: "non-functional-requirements",
      label: "Non-Functional Requirements",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Define system performance, security, availability, and ISO quality attributes.",
      icon: "shield",
      iconBg: "bg-rose-500/10 dark:bg-rose-400/15",
      iconColor: "text-rose-600 dark:text-rose-400",
      path: "/workspace/non-functional-requirements",
      keywords: ["non-functional", "nfr", "rnf", "security", "performance", "scalability"],
    },
    {
      id: "backlog",
      label: "Product Backlog",
      category: "phases",
      categoryLabel: "Methodology Phase",
      description: "Sprint-ready user stories, story points, and priority backlog items.",
      icon: "list-ordered",
      iconBg: "bg-cyan-500/10 dark:bg-cyan-400/15",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      path: "/workspace/backlog",
      keywords: ["backlog", "user stories", "sprint", "agile", "scrum", "tasks", "priority"],
    },

    // Architecture & UML
    {
      id: "uml-preparation",
      label: "UML Architecture & Diagrams",
      category: "architecture",
      categoryLabel: "Architecture & Modeling",
      description: "Generate and edit PlantUML Class, Sequence, and Use Case diagrams.",
      icon: "account-tree",
      iconBg: "bg-teal-500/10 dark:bg-teal-400/15",
      iconColor: "text-teal-600 dark:text-teal-400",
      path: "/workspace/uml-preparation",
      keywords: ["uml", "diagrams", "plantuml", "class diagram", "sequence diagram", "use case", "architecture"],
    },

    // Deliverables & Defense
    {
      id: "report-structure",
      label: "Report Structure (Thesis Outline)",
      category: "deliverables",
      categoryLabel: "Reports & Studio",
      description: "Academic thesis table of contents compliant with university norms.",
      icon: "schema",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      path: "/workspace/report-structure",
      keywords: ["structure", "table of contents", "outline", "chapters", "thesis", "report"],
    },
    {
      id: "report-builder",
      label: "Report Studio (Editor & Generator)",
      category: "deliverables",
      categoryLabel: "Reports & Studio",
      description: "Rich academic editor with Corrective RAG section generation.",
      icon: "book-open",
      iconBg: "bg-violet-500/10 dark:bg-violet-400/15",
      iconColor: "text-violet-600 dark:text-violet-400",
      path: "/workspace/report-builder",
      keywords: ["report builder", "studio", "editor", "thesis writing", "export pdf", "markdown", "latex"],
    },
    {
      id: "presentation",
      label: "Defense Slides & Presentation",
      category: "deliverables",
      categoryLabel: "Defense Preparation",
      description: "Generate structured presentation slides and keynote bullet points.",
      icon: "presentation",
      iconBg: "bg-orange-500/10 dark:bg-orange-400/15",
      iconColor: "text-orange-600 dark:text-orange-400",
      path: "/workspace/presentation",
      keywords: ["presentation", "slides", "keynote", "defense", "soutenance", "powerpoint"],
    },
    {
      id: "pitch",
      label: "Elevator Pitch & Timed Speech",
      category: "deliverables",
      categoryLabel: "Defense Preparation",
      description: "Craft a high-impact 3-minute oral defense pitch script.",
      icon: "mic",
      iconBg: "bg-amber-500/10 dark:bg-amber-400/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      path: "/workspace/pitch",
      keywords: ["pitch", "speech", "oral defense", "timer", "script", "presentation"],
    },
    {
      id: "jury-simulation",
      label: "Jury Q&A Simulation",
      category: "deliverables",
      categoryLabel: "Defense Preparation",
      description: "Simulate a live oral defense with adversarial AI academic jury members.",
      icon: "groups",
      iconBg: "bg-red-500/10 dark:bg-red-400/15",
      iconColor: "text-red-600 dark:text-red-400",
      path: "/workspace/jury-simulation",
      keywords: ["jury", "simulation", "questions", "defense practice", "oral exam", "mock defense"],
    },

    // Quick Actions
    {
      id: "action-settings",
      label: "Workspace Settings",
      category: "actions",
      categoryLabel: "Preferences",
      description: "Configure project API keys, language, and workspace preferences.",
      icon: "settings-02",
      iconBg: "bg-slate-500/10 dark:bg-slate-400/15",
      iconColor: "text-slate-600 dark:text-slate-400",
      path: "/workspace/settings",
      keywords: ["settings", "preferences", "config", "api key", "language", "theme"],
    },
    {
      id: "action-account",
      label: "Account Profile",
      category: "actions",
      categoryLabel: "User Account",
      description: "Manage your user profile, avatar, and credentials.",
      icon: "user-circle",
      iconBg: "bg-sky-500/10 dark:bg-sky-400/15",
      iconColor: "text-sky-600 dark:text-sky-400",
      path: "/workspace/account",
      keywords: ["account", "profile", "user", "email", "avatar", "password"],
    },
  ], []);

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
          if (item.path) {
            navigate(item.path);
          } else if (item.action) {
            item.action();
          }
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

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
            className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 text-base sm:text-lg w-full min-w-0 font-medium"
            placeholder="Search workspace pages, documents, phases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              type="button"
              className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
              title="Clear query"
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
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                )}
              >
                {tab.label}
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
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    type="button"
                    onClick={() => {
                      if (item.path) navigate(item.path);
                      else if (item.action) item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer group",
                      isSelected
                        ? "bg-surface-container-high/90 shadow-xs text-on-surface"
                        : "hover:bg-surface-container-low text-on-surface"
                    )}
                  >
                    {/* Item Icon Badge */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                        item.iconBg,
                        item.iconColor,
                        isSelected ? "scale-105" : ""
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} />
                    </div>

                    {/* Item Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold truncate transition-colors",
                          isSelected ? "text-primary" : "text-on-surface"
                        )}>
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/90 px-1.5 py-0.5 rounded-md bg-surface-container-high/80 shrink-0">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Indicator / Return Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono font-medium animate-in fade-in duration-100">
                          <span>Jump</span>
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
              <p className="text-sm font-semibold text-on-surface">No matching workspace items</p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                No results found for &ldquo;{query}&rdquo;. Try searching for <button type="button" onClick={() => setQuery("UML")} className="text-primary underline cursor-pointer">UML</button>, <button type="button" onClick={() => setQuery("Report")} className="text-primary underline cursor-pointer">Report</button>, or <button type="button" onClick={() => setQuery("Requirements")} className="text-primary underline cursor-pointer">Requirements</button>.
              </p>
            </div>
          )}
        </div>

        {/* Minimalist Notion Footer */}
        <div className="px-4 py-2.5 bg-surface-container-lowest border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">↵</kbd>
              <span>open</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60 font-mono text-[10px]">esc</kbd>
              <span>dismiss</span>
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-outline-variant">
            <HugeiconsIcon icon="command" size={12} className="text-primary" />
            <span>SmartPFE Quick Switcher</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

