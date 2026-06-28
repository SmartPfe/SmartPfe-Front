import { useEffect, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";

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

export default function NotificationBell({ label = "Live updates" }: { label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

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
      eventSource.addEventListener("connected", () => setIsConnected(true));
      eventSource.addEventListener("heartbeat", () => setIsConnected(true));
      eventSource.addEventListener("notification", (event) => {
        setIsConnected(true);
        const notification = JSON.parse((event as MessageEvent).data) as NotificationItem;
        setNotifications((current) => [notification, ...current].slice(0, 20));
      });
      eventSource.onerror = () => {
        setIsConnected(false);
      };
    };

    loadNotifications();
    connectNotifications();

    return () => {
      setIsConnected(false);
      eventSource?.close();
    };
  }, []);

  const handleToggle = async () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);

    if (nextOpenState && unreadCount > 0) {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      try {
        await fetchApi("/notifications/read", { method: "PATCH" });
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
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
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-secondary" : "bg-outline"}`}
                title={isConnected ? "Realtime connected" : "Reconnecting"}
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
                      <span
                        className={`material-symbols-outlined text-[18px] mt-base ${
                          notification.type === "success"
                            ? "text-secondary"
                            : notification.type === "error"
                              ? "text-error"
                              : notification.type === "warning"
                                ? "text-tertiary"
                                : "text-primary"
                        }`}
                      >
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
  );
}
