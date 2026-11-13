
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Users,
  CalendarDays,
  ClipboardCheck,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import UserAvatar from "../../components/common/UserAvatar";
import AppLayout from "../../components/layout/AppLayout";
import interviewService from "../../services/interviewService";
import toast from "react-hot-toast";

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#18181f] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold text-white">
        {loading ? (
          <span className="inline-block h-7 w-14 animate-pulse rounded bg-white/10" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
      <CalendarDays size={25} className="mx-auto text-zinc-600" />

      <p className="mt-3 text-sm font-medium text-zinc-300">{title}</p>

      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function InterviewerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [totalInterviews, setTotalInterviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch all interviews belonging to the interviewer.
  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");

      const firstResponse = await interviewService.getMyInterviews({
        page: 1,
        limit: 50,
      });

      const firstPage = firstResponse?.data || [];
      const totalPages = firstResponse?.pagination?.totalPages || 1;

      let allInterviews = [...firstPage];

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

      setTotalInterviews(
        firstResponse?.pagination?.total ?? allInterviews.length
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load interview dashboard.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  // Upcoming scheduled interviews.
  const upcomingInterviews = useMemo(() => {
    const now = new Date();

    return interviews
      .filter((interview) => {
        const status = interview.status?.toLowerCase();

        const scheduledDate = interview.scheduledAt
          ? new Date(interview.scheduledAt)
          : null;

        return (
          status === "scheduled" &&
          scheduledDate &&
          !Number.isNaN(scheduledDate.getTime()) &&
          scheduledDate >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt) - new Date(b.scheduledAt)
      );
  }, [interviews]);

  // Count unique candidates across interviews.
  const candidateCount = useMemo(() => {
    const candidateIds = new Set();

    interviews.forEach((interview) => {
      const candidate = interview.candidate;

      const candidateId =
        typeof candidate === "object" ? candidate?._id : candidate;

      if (candidateId) {
        candidateIds.add(candidateId.toString());
      }
    });

    return candidateIds.size;
  }, [interviews]);

  // Interview overview statistics.
  const stats = [
    {
      label: "Total Interviews",
      value: totalInterviews,
      icon: Video,
      color: "bg-indigo-500/10 text-indigo-400",
    },
    {
      label: "Upcoming Interviews",
      value: upcomingInterviews.length,
      icon: CalendarDays,
      color: "bg-violet-500/10 text-violet-400",
    },
    {
      label: "Candidates",
      value: candidateCount,
      icon: Users,
      color: "bg-cyan-500/10 text-cyan-400",
    },
  ];

  // Dashboard quick actions.
  const actions = [
    {
      title: "Create Interview",
      description: "Set up a new technical interview.",
      icon: Plus,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      onClick: () => navigate("/interviews/create"),
    },
    {
      title: "Manage Interviews",
      description: "View and manage your interview sessions.",
      icon: Video,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      onClick: () => navigate("/interviews"),
    },
    {
      title: "Review Evaluations",
      description: "Review candidate performance and scorecards.",
      icon: ClipboardCheck,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      onClick: () => navigate("/evaluations"),
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleOpenInterview = (interview) => {
    navigate(`/interviews/${interview._id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-[#18181f] to-[#18181f] p-6 sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-violet-400">
                INTERVIEWER WORKSPACE
              </p>

              <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                Welcome back, {user?.name?.split(" ")[0] || "Interviewer"}!
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Organize technical interviews, collaborate with candidates
                and manage your interview sessions.
              </p>
            </div>

            <UserAvatar user={user} size="xl" />
          </div>
        </section>

        {/* Interview Overview */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Interview Overview
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Your interview activity from the backend.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#18181f] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-violet-500/40 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                {...item}
                loading={loading}
              />
            ))}
          </div>
        </section>

        {/* Interview Management Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Interview Management
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your technical interview workflow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={action.onClick}
                  className="group rounded-xl border border-white/10 bg-[#18181f] p-5 text-left transition hover:-translate-y-1 hover:border-violet-500/40 hover:bg-[#1d1d27]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.bg} ${action.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-violet-400"
                    />
                  </div>

                  <h3 className="mt-5 font-semibold text-white">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Upcoming Interviews */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Upcoming Interviews
              </h2>

              <p className="text-sm text-zinc-500">
                Your scheduled interview sessions.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-lg border border-white/5 px-4 py-10 text-center">
                <RefreshCw
                  size={23}
                  className="mx-auto animate-spin text-violet-400"
                />

                <p className="mt-3 text-sm text-zinc-400">
                  Loading upcoming interviews...
                </p>
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <EmptyState
                title="No upcoming interviews"
                description="Your future scheduled interviews will appear here."
              />
            ) : (
              upcomingInterviews.slice(0, 5).map((interview) => (
                <button
                  key={interview._id}
                  type="button"
                  onClick={() => handleOpenInterview(interview)}
                  className="flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-violet-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium text-white">
                      {interview.title}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      {interview.candidate?.name || "Waiting for candidate"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CalendarDays
                      size={14}
                      className="text-violet-400"
                    />

                    {formatDate(interview.scheduledAt)}

                    <ArrowRight size={15} className="ml-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default InterviewerDashboard;
