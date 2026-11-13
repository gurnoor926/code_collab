
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle } from "lucide-react";
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

  const fetchInterview = useCallback(async () => {
    try {
      const response = await interviewService.getInterviewById(id);

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message || "Unable to load interview details."
        );
      }

      setInterview(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load interview."
      );

      setInterview(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterview();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchInterview]);

  const performAction = async (action, successMessage) => {
    try {
      setActionLoading(true);

      const response = await action(id);

      if (response?.success === false) {
        throw new Error(response.message || "Action failed.");
      }

      toast.success(response?.message || successMessage);
      await fetchInterview();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!window.confirm("Are you sure you want to cancel this interview?")) {
      return;
    }

    performAction(
      interviewService.cancelInterview,
      "Interview cancelled successfully."
    );
  };

  const handleStart = () => {
    performAction(
      async (interviewId) => {
        const res = await interviewService.startInterview(interviewId);
        try {
          await replayService.startReplay(interviewId, {
            initialCode: "",
            initialLanguage: "javascript",
          });
        } catch (e) {
          console.warn("Replay start notice:", e?.message);
        }
        return res;
      },
      "Interview started successfully."
    );
  };

  const handleComplete = () => {
    if (!window.confirm("Mark this interview as completed?")) {
      return;
    }

    performAction(
      async (interviewId) => {
        try {
          await replayService.completeReplay(interviewId);
        } catch (e) {
          console.warn("Replay complete notice:", e?.message);
        }
        return interviewService.completeInterview(interviewId);
      },
      "Interview completed successfully."
    );
  };

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-xl font-semibold text-white">
          Interview not found
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          The interview may have been removed or you may not have permission to view it.
        </p>

        <Link
          to="/interviews"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to interviews
        </Link>
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
