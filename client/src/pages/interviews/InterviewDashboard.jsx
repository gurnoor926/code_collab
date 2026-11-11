
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  Code2,
  Plus,
  RefreshCw,
  Search,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";
import AppLayout from "../../components/layout/AppLayout";
import InterviewStats from "../../components/interviews/InterviewStats";
import InterviewCard from "../../components/interviews/InterviewCard";
import InterviewEmptyState from "../../components/interviews/InterviewEmptyState";
import interviewService from "../../services/interviewService";

function InterviewDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role || "candidate";
  const isInterviewer = ["interviewer", "admin"].includes(role);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    active: 0,
  });

  // Fetch all interviews
  const fetchInterviews = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      // The backend allows a maximum limit of 50.
      const firstResponse = await interviewService.getMyInterviews({
        page: 1,
        limit: 50,
      });

      const firstPage = firstResponse?.data || [];
      const totalPages = firstResponse?.pagination?.totalPages || 1;

      let allInterviews = [...firstPage];

      // Retrieve remaining pages so statistics use all records.
      if (totalPages > 1) {
        const remainingResponses = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            interviewService.getMyInterviews({
              page: index + 2,
              limit: 50,
            })
          )
        );

        remainingResponses.forEach((response) => {
          allInterviews.push(...(response?.data || []));
        });
      }

      setInterviews(allInterviews);

      setStats({
        total: firstResponse?.pagination?.total ?? allInterviews.length,

        upcoming: allInterviews.filter((item) =>
          ["scheduled", "waiting"].includes(
            item.status?.toLowerCase()
          )
        ).length,

        completed: allInterviews.filter(
          (item) => item.status?.toLowerCase() === "completed"
        ).length,

        active: allInterviews.filter(
          (item) => item.status?.toLowerCase() === "active"
        ).length,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load your interviews.";

      setError(message);
      setInterviews([]);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterviews();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchInterviews]);

  // Search and status filtering
  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch =
        interview.title?.toLowerCase().includes(search.toLowerCase()) ||
        interview.description?.toLowerCase().includes(search.toLowerCase()) ||
        interview.roomCode?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        interview.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, search, statusFilter]);

  // Refresh interviews
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  // Navigate to create interview
  const handleCreateInterview = () => {
    navigate("/interviews/create");
  };

  // Open interview details
  const handleOpenInterview = (interview) => {
    if (!interview?._id) {
      toast.error("Invalid interview ID.");
      return;
    }

    navigate(`/interviews/${interview._id}`);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d1b36] via-[#151522] to-[#11111b] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-indigo-400">
                <Video size={19} />
                <span className="text-sm font-medium">
                  CodeCollab Interviews
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Interview Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                {isInterviewer
                  ? "Create and manage technical interviews, track candidates, and monitor interview progress."
                  : "Manage your interview sessions, prepare for upcoming interviews, and track your progress."}
              </p>
            </div>

            {isInterviewer && (
              <button
                onClick={handleCreateInterview}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"
              >
                <Plus size={18} />
                Create Interview
              </button>
            )}
          </div>

          <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2.5 text-indigo-400">
                <Code2 size={19} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Collaborative Coding
                </p>
                <p className="text-xs text-zinc-500">
                  Solve problems together
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2.5 text-emerald-400">
                <CalendarPlus size={19} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Structured Sessions
                </p>
                <p className="text-xs text-zinc-500">
                  Manage interview schedules
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Interview Overview
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              A summary of your interview activity.
            </p>
          </div>

          <InterviewStats stats={stats} loading={loading} />
        </section>

        {/* Interview list */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Your Interviews
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                View and manage your interview sessions.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#14141d] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Search and status filters */}
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#14141d] px-4">
              <Search size={17} className="text-zinc-500" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, description or room code..."
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#14141d] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="waiting">Waiting</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#14141d]">
              <RefreshCw
                size={26}
                className="animate-spin text-indigo-400"
              />
              <p className="text-sm text-zinc-400">
                Loading your interviews...
              </p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-sm text-red-400">{error}</p>

              <button
                onClick={handleRefresh}
                className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
              >
                Try again
              </button>
            </div>
          ) : filteredInterviews.length === 0 ? (
            /* Empty state */
            search || statusFilter !== "all" ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#14141d] px-5 py-14 text-center">
                <Search
                  size={28}
                  className="mx-auto mb-3 text-zinc-500"
                />
                <h3 className="font-semibold text-white">
                  No matching interviews
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Try another search term or status filter.
                </p>
              </div>
            ) : (
              <InterviewEmptyState role={role} />
            )
          ) : (
            /* Interview cards */
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredInterviews.map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  onOpen={handleOpenInterview}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default InterviewDashboard;
