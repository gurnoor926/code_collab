
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Video,
  CalendarDays,
  MessageSquare,
  Info,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import notificationService from "../../services/notificationService";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

function getNotificationIcon(type) {
  switch (type) {
    case "interview_scheduled":
    case "interview_updated":
    case "interview_cancelled":
      return CalendarDays;

    case "interview_started":
    case "interview_completed":
      return Video;

    case "evaluation_published":
      return CheckCheck;

    case "system":
      return Info;

    default:
      return MessageSquare;
  }
}

function formatDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();

      setUnreadCount(response.data?.unreadcount ?? 0);
    } catch (error) {
      console.error("Unable to fetch unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 8,
      });

      setNotifications(response.data?.notifications ?? []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial count + periodic fallback refresh
 useEffect(() => {
  const timeout = setTimeout(() => {
    fetchUnreadCount();
  }, 0);

  const interval = setInterval(() => {
    fetchUnreadCount();
  }, 60000);

  return () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
}, [fetchUnreadCount]);
  // Real-time notifications
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (notification) => {
      setUnreadCount((count) => count + 1);

      toast(notification.title || "You have a new notification", {
        icon: "🔔",
      });

      if (open) {
        setNotifications((current) => [
          notification,
          ...current.filter(
            (item) => item._id !== notification._id
          ),
        ].slice(0, 8));
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Notification socket connection failed:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [open]);

  const handleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (notification) => {
    if (notification.isRead) return;

    try {
      await notificationService.markAsRead(notification._id);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to mark as read"
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update notifications"
      );
    }
  };

  const handleDelete = async (id) => {
    const notification = notifications.find(
      (item) => item._id === id
    );

    try {
      await notificationService.deleteNotification(id);

      setNotifications((current) =>
        current.filter((item) => item._id !== id)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete notification"
      );
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#09090f] bg-indigo-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#18181f] shadow-2xl shadow-black/50">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h3 className="font-semibold text-white">
                  Notifications
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-indigo-400"
                  >
                    <CheckCheck size={17} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-indigo-400"
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Bell size={26} className="mx-auto text-zinc-600" />
                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    You're all caught up
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    New notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);

                  return (
                    <div
                      key={notification._id}
                      className={`group border-b border-white/[0.06] p-4 transition hover:bg-white/[0.03] ${
                        !notification.isRead ? "bg-indigo-500/[0.04]" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Icon size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-200">
                              {notification.title}
                            </p>

                            {!notification.isRead && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            {notification.message}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[11px] text-zinc-500">
                              {formatDate(notification.createdAt)}
                            </span>

                            <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                              {!notification.isRead && (
                                <button
                                  type="button"
                                  title="Mark as read"
                                  onClick={() => handleMarkRead(notification)}
                                  className="rounded-md p-1.5 text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-400"
                                >
                                  <Check size={14} />
                                </button>
                              )}

                              <button
                                type="button"
                                title="Delete notification"
                                onClick={() => handleDelete(notification._id)}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/10 p-3 text-center">
              <p className="text-xs text-zinc-500">
                Showing your latest 8 notifications
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
