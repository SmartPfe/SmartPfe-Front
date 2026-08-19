import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HugeiconsIcon, { Folder01Icon } from "@/components/ui/HugeiconsIcon";
import { useOnboarding } from "@/context/OnboardingContext";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { data } = useOnboarding();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches));
    }
    return false;
  });

  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [isDarkMode]);

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smartpfe_project_config_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const projectTitle = data?.basics?.title?.trim() || "Untitled Project";
  const university = data?.basics?.university?.trim() || "Not specified";
  const methodology = data?.technicalContext?.methodology || "Scrum";
  const language = data?.basics?.language || "English";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col h-full pt-2 pb-24 font-sans">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Settings
        </h1>
      </div>

      {/* Active Project Ribbon */}
      <div className="mb-6 p-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <HugeiconsIcon icon={Folder01Icon} size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Active Project</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                <span className="text-[11px] font-mono text-secondary font-semibold">Synced</span>
              </div>
              <h2 className="text-sm font-bold text-on-surface truncate" title={projectTitle}>
                {projectTitle}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-outline-variant text-on-surface font-semibold">
              <span className="text-on-surface-variant font-normal mr-1">Uni:</span>{university}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-outline-variant text-on-surface font-semibold">
              <span className="text-on-surface-variant font-normal mr-1">Method:</span>{methodology}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-outline-variant text-on-surface font-semibold">
              <span className="text-on-surface-variant font-normal mr-1">Lang:</span>{language}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Card 1: Project Specifications */}
        <Link
          to="/workspace/settings/onboarding"
          className="group bg-surface-container-lowest border border-outline-variant/80 hover:border-primary/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer"
        >
          <div>
            {/* Header Row: Icon + Title + Badge */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <HugeiconsIcon icon="document" size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    Project Specifications
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono shrink-0">
                Context
              </span>
            </div>

            <p className="text-xs text-on-surface-variant font-normal leading-relaxed mb-4">
              Edit thesis title, domain, problem formulation, deliverables, methodology, and tech stack.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/50 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            <span className="text-on-surface-variant text-[11px] font-medium">Domain, Tech, Objectives</span>
            <div className="flex items-center gap-1">
              <span>Edit</span>
              <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} />
            </div>
          </div>
        </Link>

        {/* Card 2: User Account & Security */}
        <Link
          to="/workspace/account"
          className="group bg-surface-container-lowest border border-outline-variant/80 hover:border-primary/50 rounded-xl p-5 flex flex-col justify-between hover:shadow-xs transition-all cursor-pointer"
        >
          <div>
            {/* Header Row: Icon + Title + Badge */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                  <HugeiconsIcon icon="user-circle" size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    Account & Security
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono shrink-0">
                Profile
              </span>
            </div>

            <p className="text-xs text-on-surface-variant font-normal leading-relaxed mb-4">
              Manage personal credentials, university email address, and authentication password.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/50 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            <span className="text-on-surface-variant text-[11px] font-medium truncate max-w-[160px]">{user.fullName || "Student Account"}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span>Manage</span>
              <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} />
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Utilities Grid (2 clean cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Workspace Theme Toggle */}
        <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <HugeiconsIcon icon={isDarkMode ? "moon" : "sun"} size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-on-surface">Theme Mode</h3>
              <p className="text-[11px] text-on-surface-variant truncate">
                {isDarkMode ? "Dark theme active" : "Light theme active"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "w-10 h-5.5 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 cursor-pointer",
              isDarkMode ? "bg-primary" : "bg-outline-variant"
            )}
            aria-label="Toggle theme"
          >
            <div
              className={cn(
                "w-4.5 h-4.5 rounded-full bg-white transition-transform transform shadow-xs",
                isDarkMode ? "translate-x-4.5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Project JSON Backup */}
        <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <HugeiconsIcon icon="download" size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-on-surface">Export Config</h3>
              <p className="text-[11px] text-on-surface-variant truncate">
                Download project snapshot JSON
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {downloaded ? (
              <>
                <HugeiconsIcon icon="check-circle" size={13} className="text-secondary" />
                <span className="text-secondary">Saved!</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon="download" size={13} />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


