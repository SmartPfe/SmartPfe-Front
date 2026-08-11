import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationItem, useNotifications } from "@/context/NotificationContext";

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
  const {
    notifications,
    unreadCount,
    isConnected,
    markAllAsRead,
    markNotificationAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

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
      ? "check_circle"
      : notification.type === "error"
        ? "error"
        : notification.type === "warning"
          ? "warning"
          : "info";

  const getNotificationColor = (notification: NotificationItem) =>
    notification.type === "generation_complete" || notification.type === "success"
      ? "text-secondary"
      : notification.type === "error"
        ? "text-error"
        : notification.type === "warning"
          ? "text-tertiary"
          : "text-primary";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="relative w-9 h-9 flex items-center justify-center text-outline hover:text-on-surface rounded-lg border border-transparent hover:border-outline-variant hover:bg-surface-container transition-colors"
        title="Notifications"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-outline-variant z-50 overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Notifications</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{label}</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="rounded-md px-2 py-1 text-label-sm font-medium text-primary hover:bg-primary/10"
                  >
                    Mark all as read
                  </button>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-secondary" : "bg-outline"}`}
                  title={isConnected ? "Realtime connected" : "Reconnecting"}
                ></span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-md py-lg text-center text-on-surface-variant font-body-md text-body-md">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-md py-sm text-left border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors ${
                      notification.read ? "" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-sm">
                      <span className={`material-symbols-outlined text-[18px] mt-base ${getNotificationColor(notification)}`}>
                        {getNotificationIcon(notification)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                          <p className="font-label-md text-label-md text-on-surface">{notification.title}</p>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">{notification.message}</p>
                        <p className="font-body-sm text-body-sm text-outline mt-xs">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
