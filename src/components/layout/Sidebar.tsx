import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { icon: "info", label: "Project Overview", path: "/workspace/overview", tooltip: "Define the core premise, goals, and domain of your project." },
  { icon: "description", label: "Problem Statement", path: "/workspace/problem-statement", tooltip: "Clearly articulate the issue your project aims to solve." },
  { icon: "groups", label: "Actors", path: "/workspace/actors", tooltip: "Identify all users and systems interacting with your application." },
  { icon: "search", label: "Existing Solutions", path: "/workspace/solutions", tooltip: "Outline the technical and functional solutions to the problem." },
  { icon: "settings_suggest", label: "Functional Requirements", path: "/workspace/functional-requirements", tooltip: "Specify the exact behaviors and features the system must support." },
  { icon: "verified_user", label: "Non Functional Requirements", path: "/workspace/non-functional-requirements", tooltip: "Define system attributes like performance, security, and scalability." },
  { icon: "format_list_bulleted", label: "Product Backlog", path: "/workspace/backlog", tooltip: "Organize and prioritize all pending tasks and features." },

  { icon: "account_tree", label: "UML Preparation", path: "/workspace/uml-preparation", tooltip: "Design the system architecture using Unified Modeling Language diagrams." },
  { icon: "account_tree", label: "Report Structure", path: "/workspace/report-structure", tooltip: "Outline the chapters and sections of your final PFE report." },
  { icon: "auto_stories", label: "Report Builder", path: "/workspace/report-builder", tooltip: "Draft and assemble the content for your final report." },
  { icon: "present_to_all", label: "Presentation", path: "/workspace/presentation", tooltip: "Prepare the slides and material for your project defense." },
  { icon: "campaign", label: "Pitch", path: "/workspace/pitch", tooltip: "Craft a concise and compelling summary of your project." },
  { icon: "groups_3", label: "Jury Simulation", path: "/workspace/jury-simulation", tooltip: "Simulate a real oral defense with AI jury members." },
];

interface SidebarProps {
  isOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsSidebarOpen }: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains('dark') || 
             (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={cn(
        "bg-surface-container-low text-on-surface w-[min(280px,85vw)] h-full fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-outline-variant transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="p-xl border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold">
            P
          </div>
          <span className="font-bold text-lg tracking-tight text-on-surface truncate">PFE Guidance</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pt-lg pb-md px-md">
        <nav className="flex flex-col gap-1">
          <div className="text-[10px] uppercase font-bold text-outline tracking-wider mb-2 px-3">Methodology Phases</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors text-sm",
                  isActive
                    ? "text-primary bg-surface border border-outline-variant shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", isActive ? "border-primary" : "border-outline")}>
                    {isActive && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                  </div>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-outline-variant py-md flex flex-col">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center justify-between px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-medium text-sm group"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">
              {isDarkMode ? "dark_mode" : "light_mode"}
            </span>
            <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <div className={cn(
            "w-8 h-4 rounded-full p-0.5 transition-colors relative flex items-center",
            isDarkMode ? "bg-primary" : "bg-outline-variant"
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full bg-white transition-transform transform shadow-sm",
              isDarkMode ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </button>
        <Link to="/workspace/settings" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-medium text-sm group">
          <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">settings</span>
          <span>Settings</span>
        </Link>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-medium text-sm group">
          <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">help</span>
          <span>Help Center</span>
        </a>
      </div>
    </aside>
    </>
  );
}
