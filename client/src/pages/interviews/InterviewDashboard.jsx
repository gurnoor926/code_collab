
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import replayService from "../../services/replayService";
import { useAuth } from "../../hooks/useAuth";

import InterviewDetailsCard from "../../components/interviews/InterviewDetailsCard";
import InterviewParticipants from "../../components/interviews/InterviewParticipants";
import InterviewProblemList from "../../components/interviews/InterviewProblemList";
import InterviewActions from "../../components/interviews/InterviewActions";

function InterviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent stale requests from updating the page.
  const requestIdRef = useRef(0);

  // Prevent multiple actions from starting simultaneously.
  const actionInProgressRef = useRef(false);

  // Fetch interview details.
  const fetchInterview = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const response = await interviewService.getInterviewById(id);

      if (requestId !== requestIdRef.current) return;

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message || "Unable to load interview details."
        );
      }

      setInterview(response.data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      const message =
        err.userMessage ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load interview.";

      setError(message);
      setInterview(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  // Initial fetch.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterview();
    }, 0);

    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [fetchInterview]);

  // Execute interview actions safely.
  const performAction = async (action, successMessage) => {
    if (actionInProgressRef.current) return;

    actionInProgressRef.current = true;
    setActionLoading(true);

    try {
      const response = await action(id);

      if (response?.success === false) {
        throw new Error(response.message || "Action failed.");
      }

      toast.success(response?.message || successMessage);

      await fetchInterview();
    } catch (err) {
      const message =
        err.userMessage ||
        err.response?.data?.message ||
        err.message ||
        "Something went wrong.";

      toast.error(message);
    } finally {
      actionInProgressRef.current = false;
      setActionLoading(false);
    }
  };

  // Cancel interview.
  const handleCancel = () => {
    if (actionLoading) return;

    if (!window.confirm("Are you sure you want to cancel this interview?")) {
      return;
    }

    performAction(
      interviewService.cancelInterview,
      "Interview cancelled successfully."
    );
  };

  // Start interview and initialize replay.
  const handleStart = () => {
    if (actionLoading) return;

    performAction(
      async (interviewId) => {
        const response =
          await interviewService.startInterview(interviewId);

        try {
          await replayService.startReplay(interviewId, {
            initialCode: "",
            initialLanguage: "javascript",
          });
        } catch (err) {
          console.warn("Replay start notice:", err?.message);
        }

        return response;
      },
      "Interview started successfully."
    );
  };

  // Complete interview and finalize replay.
  const handleComplete = () => {
    if (actionLoading) return;

    if (!window.confirm("Mark this interview as completed?")) {
      return;
    }

    performAction(
      async (interviewId) => {
        try {
          await replayService.completeReplay(interviewId);
        } catch (err) {
          console.warn("Replay complete notice:", err?.message);
        }

        return interviewService.completeInterview(interviewId);
      },
      "Interview completed successfully."
    );
  };

  // Navigation handlers.
  const handleJoin = () => {
    navigate(`/interviews/${id}/room`);
  };

  const handleEvaluate = () => {
    navigate(`/interviews/${id}/evaluation`);
  };

  const handleViewScorecard = () => {
    navigate(`/interviews/${id}/scorecard`);
  };

  const handleViewReplay = () => {
    navigate(`/interviews/${id}/replay`);
  };

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-indigo-500"
          size={36}
        />
      </div>
    );
  }

  // Error or missing interview state.
  if (!interview) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-xl font-semibold text-white">
          {error ? "Unable to load interview" : "Interview not found"}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {error ||
            "The interview may have been removed or you may not have permission to view it."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={fetchInterview}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link
            to="/interviews"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/interviews"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to interviews
        </Link>

        <InterviewDetailsCard interview={interview} />

        <InterviewParticipants interview={interview} />

        <InterviewProblemList interview={interview} />

        <InterviewActions
          interview={interview}
          userRole={user?.role}
          loading={actionLoading}
          onStart={handleStart}
          onCancel={handleCancel}
          onComplete={handleComplete}
          onJoin={handleJoin}
          onEvaluate={handleEvaluate}
          onViewScorecard={handleViewScorecard}
          onViewReplay={handleViewReplay}
        />
      </div>
    </main>
  );
}

export default InterviewDetails;
