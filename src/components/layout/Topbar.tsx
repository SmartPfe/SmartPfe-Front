import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import SearchPalette from "./SearchPalette";
import RevisionHistoryDrawer from "./RevisionHistoryDrawer";
import NotificationBell from "./NotificationBell";
import HugeiconsIcon, { Folder01Icon } from "@/components/ui/HugeiconsIcon";
import { useOnboarding } from "@/context/OnboardingContext";
import { WORKSPACE_PHASES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TopbarProps {
  toggleSidebar: () => void;
}

const PHASE_ICONS: Record<string, string> = {
  "overview": "dashboard",
  "problem-statement": "document",
  "actors": "group",
  "solutions": "search",
  "functional-requirements": "tune",
  "non-functional-requirements": "shield",
  "backlog": "list-ordered",
  "uml-preparation": "account-tree",
  "report-structure": "schema",
  "report-builder": "book-open",
  "presentation": "presentation",
  "pitch": "mic",
  "jury-simulation": "groups",
  "settings": "settings-02",
  "account": "user-circle",
};

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [timeText, setTimeText] = useState("just now");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));

  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const projectTitle = onboarding?.data?.basics?.title?.trim() || "PFE Project";

  // Determine current active phase for breadcrumb
  const currentPhase = useMemo(() => {
    const path = location.pathname;
    const match = WORKSPACE_PHASES.find((p) => p.path === path);
    if (match) return match;
    if (path.includes("/workspace/settings")) return { id: "settings", label: "Settings", path };
    if (path.includes("/workspace/account")) return { id: "account", label: "Account", path };
    return { id: "overview", label: "Overview", path: "/workspace/overview" };
  }, [location.pathname]);

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const handleUserUpdated = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };

    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("storage", handleUserUpdated);
    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("storage", handleUserUpdated);
    };
  }, []);

  // Global shortcut: Ctrl+K / Cmd+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Periodic auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSaveState("saving");
      setTimeout(() => {
        setSaveState("saved");
        setTimeText("just now");
      }, 1400);
    }, 50000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (saveState === "saved" && timeText === "just now") {
      timeout = setTimeout(() => {
        setTimeText("1 min ago");
      }, 60000);
    }
    return () => clearTimeout(timeout);
  }, [saveState, timeText]);

  const activeIcon = PHASE_ICONS[currentPhase.id] || "document";

  return (
    <>
      <header className="sticky top-0 z-30 h-14 w-full shrink-0 border-b border-outline-variant/60 bg-surface/85 backdrop-blur-md transition-colors flex items-center justify-between px-3 sm:px-5 md:px-6">
        {/* Left: Sidebar Toggle & Notion-Style Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Notion Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/80 active:scale-95 transition-all cursor-pointer"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <HugeiconsIcon icon="sidebar-left" size={17} strokeWidth={1.75} />
          </button>

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm min-w-0">
            {/* Workspace Root */}
            <Link
              to="/workspace/overview"
              className="hidden sm:inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors font-medium"
            >
              <HugeiconsIcon icon={Folder01Icon} size={15} className="text-on-surface-variant shrink-0" strokeWidth={1.75} />
              <span>Workspace</span>
            </Link>

            <span className="hidden sm:inline text-outline-variant select-none">/</span>

            {/* Project Name (Truncated) */}
            <span
              className="hidden md:inline-block px-1.5 py-1 rounded-md text-on-surface-variant font-medium truncate max-w-[140px] lg:max-w-[200px]"
              title={projectTitle}
            >
              {projectTitle}
            </span>

            <span className="hidden md:inline text-outline-variant select-none">/</span>

            {/* Current Active Phase */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container-low/90 border border-outline-variant/50 text-on-surface font-semibold shadow-2xs min-w-0">
              <HugeiconsIcon icon={activeIcon} size={14} className="text-primary shrink-0" strokeWidth={1.75} />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">{currentPhase.label}</span>
            </div>
          </nav>

          {/* Notion-style Auto-Save Status Pill */}
          <div className="hidden lg:flex items-center ml-2">
            {saveState === "saving" ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 transition-all">
                <HugeiconsIcon icon="cloud-sync" size={12} className="animate-spin text-primary" strokeWidth={2} />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-on-surface-variant/80 hover:text-on-surface transition-colors" title={`Last synced ${timeText}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                <span>Saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Search, Revision History, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notion-Style Quick Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            type="button"
            className="group flex items-center gap-2.5 h-8 px-2.5 sm:px-3 rounded-md bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant transition-all cursor-pointer shadow-2xs"
            title="Search workspace (Ctrl+K)"
          >
            <HugeiconsIcon icon="search" size={15} className="text-outline group-hover:text-on-surface transition-colors shrink-0" strokeWidth={1.75} />
            <span className="hidden sm:inline text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
              Search...
            </span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-mono font-medium text-outline-variant group-hover:text-on-surface-variant group-hover:border-outline transition-colors">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </button>

          {/* Revision History Action */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/80 active:scale-95 transition-all cursor-pointer"
            title="Revision History & Versions"
            aria-label="Revision History"
          >
            <HugeiconsIcon icon="history" size={17} strokeWidth={1.75} />
          </button>

          {/* Notification Bell */}
          <NotificationBell label="Live workspace events" />

          {/* User Profile Avatar & Notion-Style Dropdown */}
          <div ref={profileRef} className="relative ml-1">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              type="button"
              title={user.fullName || "User Account"}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 hover:border-primary/40 flex items-center justify-center text-xs font-bold hover:shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 overflow-hidden"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName ? `${user.fullName} avatar` : "User avatar"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-primary font-bold text-[11px]">{initials}</span>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-xl border border-outline-variant/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                {/* User Profile Header */}
                <div className="px-3.5 py-2.5 border-b border-outline-variant/60">
                  <p className="text-xs font-semibold text-on-surface truncate">{user.fullName || "Student Account"}</p>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{user.email || "student@university.edu"}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold tracking-wide uppercase">
                    <HugeiconsIcon icon="school" size={12} strokeWidth={1.75} />
                    <span>PFE Candidate</span>
                  </div>
                </div>

                  {/* Nav Links */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/workspace/account");
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high/70 transition-colors text-left"
                    >
                      <HugeiconsIcon icon="user-circle" size={15} className="text-on-surface-variant" strokeWidth={1.75} />
                      <span>Account Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/workspace/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high/70 transition-colors text-left"
                    >
                      <HugeiconsIcon icon="settings-02" size={15} className="text-on-surface-variant" strokeWidth={1.75} />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high/70 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <HugeiconsIcon icon="command" size={15} className="text-on-surface-variant" strokeWidth={1.75} />
                        <span>Command Palette</span>
                      </div>
                      <kbd className="text-[10px] font-mono text-outline-variant bg-surface-container px-1 py-0.5 rounded border border-outline-variant/60">⌘K</kbd>
                    </button>
                  </div>

                  {/* Divider & Logout */}
                  <div className="border-t border-outline-variant/60 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-error hover:bg-error/10 transition-colors text-left font-medium"
                  >
                    <HugeiconsIcon icon="logout-01" size={15} className="text-error" strokeWidth={1.75} />
                    <span>Log Out</span>
                  </button>
                </div>
            )}
          </div>
        </div>
      </header>

      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <RevisionHistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </>
  );
}

