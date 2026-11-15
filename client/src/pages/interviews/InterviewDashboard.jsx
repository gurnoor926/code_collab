
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, RefreshCw } from "lucide-react";

import interviewService from "../../services/interviewService";
import { useAuth } from "../../hooks/useAuth";

import InterviewCard from "../../components/interviews/InterviewCard";
import InterviewEmptyState from "../../components/interviews/InterviewEmptyState";
import InterviewStats from "../../components/interviews/InterviewStats";

function InterviewDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const isInterviewer = ["interviewer", "admin"].includes(user?.role);

  // Derive stats from the fetched list.
  const stats = {
    total: interviews.length,
    upcoming: interviews.filter((i) =>
      ["scheduled", "waiting"].includes(i.status?.toLowerCase())
    ).length,
    completed: interviews.filter(
      (i) => i.status?.toLowerCase() === "completed"
    ).length,
    active: interviews.filter((i) => i.status?.toLowerCase() === "active")
      .length,
  };

  const fetchInterviews = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const response = await interviewService.getMyInterviews({
        page: 1,
        limit: 50,
      });

      if (requestId !== requestIdRef.current) return;

      if (!response?.success) {
        throw new Error(response?.message || "Unable to load interviews.");
      }

      setInterviews(response.data ?? []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(
        err.userMessage ||
          err.response?.data?.message ||
          err.message ||
          "Failed to load interviews."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchInterviews, 0);
    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [fetchInterviews]);

  const handleOpen = (interview) => {
    navigate(`/interviews/${interview._id}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Interviews</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {isInterviewer
                ? "Manage and monitor your interview sessions."
                : "View your scheduled and past interview sessions."}
            </p>
          </div>

          {isInterviewer && (
            <button
              type="button"
              onClick={() => navigate("/interviews/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <CalendarPlus size={17} />
              New Interview
            </button>
          )}

          {!isInterviewer && (
            <button
              type="button"
              onClick={() => navigate("/interviews/join")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Join Interview
            </button>
          )}
        </div>

        {/* Stats strip */}
        <InterviewStats stats={stats} loading={loading} />

        {/* Error banner */}
        {error && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={fetchInterviews}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl border border-white/10 bg-[#14141d]"
              />
            ))}
          </div>
        )}

        {/* Interview grid */}
        {!loading && !error && interviews.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && interviews.length === 0 && (
          <InterviewEmptyState role={user?.role} />
        )}
      </div>
    </main>
  );
}

export default InterviewDashboard;
