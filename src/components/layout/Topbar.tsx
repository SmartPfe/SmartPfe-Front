import { useState, useEffect } from "react";
import SearchPalette from "./SearchPalette";
import RevisionHistoryDrawer from "./RevisionHistoryDrawer";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, fetchApi } from "@/lib/api";

interface TopbarProps {
  toggleSidebar: () => void;
}

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  read: boolean;
  createdAt: string;
};

function formatNotificationTime(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(createdAt).toLocaleDateString();
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsConnected, setIsNotificationsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [timeText, setTimeText] = useState("just now");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));

  const navigate = useNavigate();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

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

  useEffect(() => {
    let eventSource: EventSource | undefined;

    const loadNotifications = async () => {
      try {
        const data = await fetchApi("/notifications");
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    const connectNotifications = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      eventSource = new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
      eventSource.addEventListener("connected", () => setIsNotificationsConnected(true));
      eventSource.addEventListener("heartbeat", () => setIsNotificationsConnected(true));
      eventSource.addEventListener("notification", (event) => {
        setIsNotificationsConnected(true);
        const notification = JSON.parse((event as MessageEvent).data) as NotificationItem;
        setNotifications((current) => [notification, ...current].slice(0, 20));
      });
      eventSource.onerror = () => {
        setIsNotificationsConnected(false);
      };
    };

    loadNotifications();
    connectNotifications();

    return () => {
      setIsNotificationsConnected(false);
      eventSource?.close();
    };
  }, []);

  const handleNotificationsToggle = async () => {
    const nextOpenState = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpenState);
    setIsProfileOpen(false);

    if (nextOpenState && unreadCount > 0) {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      try {
        await fetchApi("/notifications/read", { method: "PATCH" });
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Simulate auto-save events sporadically for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      setSaveState("saving");
      
      setTimeout(() => {
        setSaveState("saved");
        setTimeText("just now");
      }, 1500); // Save operation takes 1.5s
    }, 45000); // Trigger save every 45s

    return () => clearInterval(interval);
  }, []);

  // Update time text over time
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (saveState === "saved" && timeText === "just now") {
      timeout = setTimeout(() => {
        setTimeText("1 min ago");
      }, 60000);
    }
    
    return () => clearTimeout(timeout);
  }, [saveState, timeText]);
  

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface border-b border-outline-variant flex justify-between items-center px-8 h-16 w-full shrink-0">
        <div className="flex items-center text-sm font-body-md text-body-md">
          <div className="flex items-center gap-4 mr-6">
            <button 
              onClick={toggleSidebar}
              className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded hover:bg-surface-container-high text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-outline hidden sm:inline">Workspace</span>
            <span className="text-surface-container-highest hidden sm:inline">/</span>
            <span className="font-medium text-on-surface truncate">PFE Project</span>
          </div>
          
          <div className="hidden sm:flex items-center justify-center min-w-[120px] px-3 py-1.5 text-xs font-medium text-on-surface-variant rounded transition-colors bg-surface-container-low border border-outline-variant/50">
            {saveState === "saving" ? (
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-outline-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">cloud_done</span>
                Saved {timeText}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="group relative hidden lg:flex items-center mr-2 w-64 bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant rounded px-3 py-1.5"
          >
            <span className="material-symbols-outlined text-outline group-hover:text-on-surface transition-colors text-[18px] mr-2">search</span>
            <span className="text-sm text-outline group-hover:text-on-surface-variant transition-colors flex-1 text-left">Search project...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 font-sans text-[10px] font-medium text-outline-variant bg-surface px-1.5 py-0.5 rounded border border-outline-variant">
              <abbr title="Command" className="no-underline">⌘</abbr>K
            </kbd>
          </button>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-outline hover:text-on-surface rounded transition-colors"
            title="Revision History"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>

          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="relative w-8 h-8 flex items-center justify-center text-outline hover:text-on-surface rounded transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-outline-variant z-50 overflow-hidden">
                  <div className="px-md py-sm border-b border-outline-variant flex items-center justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Notifications</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Live workspace updates</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${isNotificationsConnected ? "bg-secondary" : "bg-outline"}`}
                      title={isNotificationsConnected ? "Realtime connected" : "Reconnecting"}
                    ></span>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-md py-lg text-center text-on-surface-variant font-body-md text-body-md">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="px-md py-sm border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-start gap-sm">
                            <span className={`material-symbols-outlined text-[18px] mt-base ${
                              notification.type === "success" ? "text-secondary" :
                              notification.type === "error" ? "text-error" :
                              "text-primary"
                            }`}>
                              {notification.type === "success" ? "check_circle" : notification.type === "error" ? "error" : "info"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-label-md text-label-md text-on-surface">{notification.title}</p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">{notification.message}</p>
                              <p className="font-body-sm text-body-sm text-outline mt-xs">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button className="px-4 py-2 text-xs font-semibold text-on-primary bg-primary rounded shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            Validate Step
          </button>
          <div className="relative ml-2">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
              }}
              title={user.fullName}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName ? `${user.fullName} avatar` : "User avatar"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                initials
              )}
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 border border-outline-variant z-50">
                  <div className="px-4 py-2 border-b border-outline-variant mb-1">
                    <p className="text-sm font-medium text-on-surface truncate">{user.fullName || "User"}</p>
                    <p className="text-xs text-outline-variant truncate">{user.email || ""}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileOpen(false); navigate("/workspace/account"); }}
                    className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Account
                  </button>
                  <button 
                    onClick={() => { setIsProfileOpen(false); navigate("/workspace/settings"); }}
                    className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Settings
                  </button>
                  <div className="border-t border-outline-variant my-1"></div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <RevisionHistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </>
  );
}
