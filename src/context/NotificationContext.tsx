import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";

export type NotificationItem = {
  _id: string;
  projectId?: string;
  feature?: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error" | "generation_complete";
  link?: string;
  read: boolean;
  createdAt: string;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  markAllAsRead: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<NotificationItem | null>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);
const TOAST_DURATION_MS = 5200;

const sortNewestFirst = (items: NotificationItem[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const mergeNotification = (current: NotificationItem[], notification: NotificationItem) => {
  const exists = current.some((item) => item._id === notification._id);
  const merged = exists
    ? current.map((item) => (item._id === notification._id ? notification : item))
    : [notification, ...current];

  return sortNewestFirst(merged).slice(0, 20);
};

const isGenerationComplete = (notification: NotificationItem) =>
  notification.type === "generation_complete" || Boolean(notification.feature && notification.type === "success");

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const displayedToastIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutIdsRef = useRef<number[]>([]);

  const dismissToast = useCallback((notificationId: string) => {
    setToasts((current) => current.filter((toast) => toast._id !== notificationId));
  }, []);

  const showToast = useCallback((notification: NotificationItem) => {
    if (!isGenerationComplete(notification) || displayedToastIdsRef.current.has(notification._id)) return;

    displayedToastIdsRef.current.add(notification._id);
    setToasts((current) => mergeNotification(current, notification).slice(0, 4));

    const timeoutId = window.setTimeout(() => {
      dismissToast(notification._id);
      toastTimeoutIdsRef.current = toastTimeoutIdsRef.current.filter((item) => item !== timeoutId);
    }, TOAST_DURATION_MS);

    toastTimeoutIdsRef.current.push(timeoutId);
  }, [dismissToast]);

  const loadNotifications = useCallback(async (seedDisplayedIds = false, showNewToasts = false) => {
    const data = await fetchApi("/notifications");
    const nextNotifications = Array.isArray(data) ? data : [];
    setNotifications(sortNewestFirst(nextNotifications));

    if (seedDisplayedIds) {
      nextNotifications.forEach((notification) => displayedToastIdsRef.current.add(notification._id));
      return;
    }

    if (showNewToasts) {
      nextNotifications.forEach(showToast);
    }
  }, [showToast]);

  useEffect(() => {
    let eventSource: EventSource | undefined;
    let pollingId: number | undefined;
    let isMounted = true;

    const connectNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotifications([]);
        setToasts([]);
        return;
      }

      try {
        await loadNotifications(true);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }

      eventSource = new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
      eventSource.addEventListener("connected", () => isMounted && setIsConnected(true));
      eventSource.addEventListener("heartbeat", () => isMounted && setIsConnected(true));
      eventSource.addEventListener("notification", (event) => {
        if (!isMounted) return;

        setIsConnected(true);
        const notification = JSON.parse((event as MessageEvent).data) as NotificationItem;
        setNotifications((current) => mergeNotification(current, notification));
        showToast(notification);
      });
      eventSource.onerror = () => {
        if (isMounted) setIsConnected(false);
      };

      pollingId = window.setInterval(() => {
        loadNotifications(false, true).catch((error) => {
          console.error("Failed to refresh notifications:", error);
        });
      }, 15000);
    };

    connectNotifications();

    return () => {
      isMounted = false;
      setIsConnected(false);
      eventSource?.close();
      if (pollingId) window.clearInterval(pollingId);
      toastTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimeoutIdsRef.current = [];
    };
  }, [loadNotifications, showToast]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    await fetchApi("/notifications/read-all", { method: "PATCH" });
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    const existing = notifications.find((notification) => notification._id === notificationId) || null;
    setNotifications((current) =>
      current.map((notification) => notification._id === notificationId ? { ...notification, read: true } : notification)
    );

    try {
      return await fetchApi(`/notifications/${notificationId}/read`, { method: "PATCH" });
    } catch (error) {
      if (existing) {
        setNotifications((current) =>
          current.map((notification) => notification._id === notificationId ? existing : notification)
        );
      }
      throw error;
    }
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      isConnected,
      markAllAsRead,
      markNotificationAsRead,
    }),
    [isConnected, markAllAsRead, markNotificationAsRead, notifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast._id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-primary/15 bg-white p-4 text-[#172033] shadow-xl shadow-black/10"
            role="status"
            aria-live="polite"
          >
            <span className="material-symbols-outlined mt-0.5 text-[22px] text-primary">check_circle</span>
            <div className="min-w-0 flex-1">
              <p className="text-label-md font-semibold text-[#172033]">{toast.title}</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">{toast.message || "Generated successfully."}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast._id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }
  return context;
}
