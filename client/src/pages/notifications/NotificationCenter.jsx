import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  CalendarDays,
  Video,
  Info,
  MessageSquare,
  Search,
  ArrowUpRight,
  LoaderCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

import notificationService from "../../services/notificationService";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../../components/layout/Navbar";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const getNotificationIcon = (type) => {
  switch (type) {
    case "interview_scheduled":
    case "interview_updated":
    case "interview_cancelled":
      return CalendarDays;
    case "interview_started":
    case "interview_completed":
    case "interview_joined":
      return Video;
    case "evaluation_published":
      return CheckCheck;
    case "system":
      return Info;
    default:
      return MessageSquare;
  }
};

const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

function NotificationCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("all"); // "all" | "unread"
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res?.success) {
        setUnreadCount(res.data?.unreadcount ?? 0);
      }
    } catch (e) {
      console.warn("Unread count fetch error:", e.message);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({
        page: 1,
        limit: 50,
        unreadOnly: filterMode === "unread",
      });
      if (res?.success) {
        setNotifications(res.data?.notifications || []);
      }
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [filterMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications, fetchUnreadCount]);

  // Authenticated real-time Socket.IO listener for live notification:new
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(() => (
        <div className="flex items-start gap-2">
          <Bell size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-white">{newNotif.title}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{newNotif.message}</p>
          </div>
        </div>
      ));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to mark as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
      toast.success("Notification deleted.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }

    if (item.relatedInterview) {
      const interviewId =
        typeof item.relatedInterview === "object"
          ? item.relatedInterview._id
          : item.relatedInterview;

      if (item.type === "evaluation_published") {
        if (user?.role === "candidate") {
          navigate(`/interviews/${interviewId}/scorecard`);
        } else {
          navigate(`/interviews/${interviewId}/evaluation`);
        }
      } else if (item.type === "interview_started") {
        navigate(`/interviews/${interviewId}/room`);
      } else {
        navigate(`/interviews/${interviewId}`);
      }
    }
  };

  // Filtered by search query
  const filteredNotifications = notifications.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Notification Center
                </h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time updates on scheduled interviews, evaluations, and room activity.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <CheckCheck size={16} className="text-indigo-400" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12121a] p-1">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterMode === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("unread")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterMode === "unread"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <LoaderCircle className="animate-spin text-indigo-500" size={32} />
              <p className="text-xs text-zinc-400 font-medium">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#12121a] p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-500 mb-3">
                <Bell size={26} />
              </div>
              <h3 className="text-base font-semibold text-white">
                No notifications found
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                {filterMode === "unread"
                  ? "You have no unread notifications right now."
                  : "You're all caught up! When interview invitations or events occur, they will appear here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const Icon = getNotificationIcon(item.type);
              const isUnread = !item.isRead;

              return (
                <div
                  key={item._id}
                  className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition ${
                    isUnread
                      ? "border-indigo-500/30 bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08]"
                      : "border-white/5 bg-[#12121a] hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isUnread
                        ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                        : "border-white/5 bg-white/5 text-zinc-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Body Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(item)}
                  >
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isUnread ? "text-white" : "text-zinc-300"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      {item.message}
                    </p>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={12} />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(item.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.relatedInterview && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-indigo-400 group-hover:underline">
                            View details <ArrowUpRight size={12} />
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item._id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default NotificationCenter;
