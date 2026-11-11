
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Video,
  Users,
  CalendarDays,
  ClipboardCheck,
  Plus,
  ArrowRight,
  Clock3,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import UserAvatar from "../../components/common/UserAvatar";
import AppLayout from "../../components/layout/AppLayout";

import interviewService from "../../services/interviewService";
import evaluationService from "../../services/evaluationService";

import toast from "react-hot-toast";

function InterviewerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [evaluationError, setEvaluationError] = useState(false);

  // Fetch interviews and evaluation information.
  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");
      setEvaluationError(false);

      // Fetch first page of interviews.
      const firstResponse = await interviewService.getMyInterviews({
        page: 1,
        limit: 50,
      });

      const firstPage = firstResponse?.data || [];
      const totalPages = firstResponse?.pagination?.totalPages || 1;

      let allInterviews = [...firstPage];

      // Fetch remaining pages if required.
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

      // Only completed interviews need evaluation.
      const completedInterviews = allInterviews.filter(
        (interview) => interview.status?.toLowerCase() === "completed"
      );

      // Fetch evaluations for completed interviews.
      const evaluationResults = await Promise.allSettled(
        completedInterviews.map((interview) =>
          evaluationService.getEvaluation(interview._id)
        )
      );

      let pendingCount = 0;
      let hasEvaluationError = false;

      evaluationResults.forEach((result) => {
        if (result.status === "rejected") {
          hasEvaluationError = true;
          console.error("Unable to fetch an interview evaluation:", result.reason);
          return;
        }

        const evaluationStatus =
          result.value?.data?.evaluation?.status;

        if (evaluationStatus === "draft") {
          pendingCount++;
        }
      });

      setPendingEvaluations(pendingCount);
      setEvaluationError(hasEvaluationError);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load your interview data.";

      setError(message);
      setInterviews([]);
      setTotalInterviews(0);
      setPendingEvaluations(0);

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial dashboard loading.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  // Upcoming interviews.
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

  // Unique candidate count.
  const candidateCount = useMemo(() => {
    const candidateIds = new Set();

    interviews.forEach((interview) => {
      const candidate = interview.candidate;

      const candidateId =
        typeof candidate === "object"
          ? candidate?._id
          : candidate;

      if (candidateId) {
        candidateIds.add(candidateId.toString());
      }
    });

    return candidateIds.size;
  }, [interviews]);

  // Dashboard statistics.
  const stats = [
    {
      label: "Total Interviews",
      value: totalInterviews,
      icon: Video,
    },
    {
      label: "Upcoming Interviews",
      value: upcomingInterviews.length,
      icon: CalendarDays,
    },
    {
      label: "Candidates",
      value: candidateCount,
      icon: Users,
    },
    {
      label: "Pending Evaluations",
      value: pendingEvaluations,
      icon: ClipboardCheck,
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
      onClick: () =>
        toast("Evaluation dashboard will be connected in the evaluation phase."),
    },
  ];

  // Refresh dashboard.
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Format interview date.
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

  // Open interview details.
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
                and evaluate their performance.
              </p>
            </div>

            <UserAvatar user={user} size="xl" />

          </div>
        </section>

        {/* Dashboard Overview */}
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

          {evaluationError && !loading && (
            <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-yellow-400">
                Some evaluation records could not be loaded. The pending
                evaluation count may be incomplete.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-[#18181f] p-5"
                >

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-400">
                      {item.label}
                    </p>

                    <Icon size={19} className="text-violet-400" />
                  </div>

                  <p className="mt-4 text-2xl font-semibold text-white">
                    {loading ? (
                      <span className="inline-block h-7 w-12 animate-pulse rounded bg-white/10" />
                    ) : (
                      item.value
                    )}
                  </p>

                </div>
              );
            })}

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

              <div className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center">

                <Clock3 size={25} className="mx-auto text-zinc-600" />

                <p className="mt-3 text-sm font-medium text-zinc-300">
                  No upcoming interviews
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Your future scheduled interviews will appear here.
                </p>

              </div>

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
