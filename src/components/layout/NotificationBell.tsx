import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationItem, useNotifications } from "@/context/NotificationContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { cn } from "@/lib/utils";

function formatNotificationTime(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(createdAt).toLocaleDateString();
}

export default function NotificationBell({ label = "Live updates" }: { label?: string }) {
  const navigate = useNavigate();
  const bellRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isConnected,
    markAllAsRead,
    markNotificationAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Close notifications on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification._id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const getNotificationIcon = (notification: NotificationItem) =>
    notification.type === "generation_complete" || notification.type === "success"
      ? "checkmark-circle-02"
      : notification.type === "error"
        ? "cancel-circle"
        : notification.type === "warning"
          ? "alert-circle"
          : "information-circle";

  const getNotificationColor = (notification: NotificationItem) =>
    notification.type === "generation_complete" || notification.type === "success"
      ? "text-secondary"
      : notification.type === "error"
        ? "text-error"
        : notification.type === "warning"
          ? "text-tertiary"
          : "text-primary";

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="relative w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/80 active:scale-95 rounded-md transition-all cursor-pointer"
        title="Notifications"
        type="button"
        aria-label="Notifications"
      >
        <HugeiconsIcon icon="notification-02" size={17} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute 0 top-0.5 right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-surface rounded-xl shadow-xl border border-outline-variant/80 z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-100">
          {/* Popover Header */}
          <div className="px-3.5 py-2.5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
            <div>
              <p className="text-xs font-semibold text-on-surface">Notifications</p>
              <p className="text-[11px] text-on-surface-variant">{label}</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-secondary" : "bg-outline-variant"
                )}
                title={isConnected ? "Live sync active" : "Connecting..."}
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/30">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center">
                <HugeiconsIcon icon="notification-02" size={24} className="text-outline-variant mb-2" strokeWidth={1.5} />
                <span>No new notifications</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-left transition-colors cursor-pointer hover:bg-surface-container-high/60 flex items-start gap-2.5",
                    notification.read ? "" : "bg-primary/5"
                  )}
                >
                  <HugeiconsIcon
                    icon={getNotificationIcon(notification)}
                    size={16}
                    className={cn("mt-0.5 shrink-0", getNotificationColor(notification))}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <p className="text-xs font-semibold text-on-surface truncate">{notification.title}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{notification.message}</p>
                    <p className="text-[10px] text-outline-variant mt-1 font-mono">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


