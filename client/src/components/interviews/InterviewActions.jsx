import {
  CheckCircle2,
  ClipboardCheck,
  Film,
  LoaderCircle,
  Play,
  Video,
  XCircle,
} from "lucide-react";

function InterviewActions({
  interview,
  userRole,
  loading,
  onStart,
  onCancel,
  onComplete,
  onJoin,
  onViewScorecard,
  onEvaluate,
  onViewReplay,
}) {
  const isManager = ["admin", "interviewer"].includes(userRole);
  const status = interview.status;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Interview actions
      </h2>

      <div className="flex flex-wrap gap-3">
        {/* Start interview */}
        {isManager && status === "waiting" && (
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Play size={17} />
            )}
            Start interview
          </button>
        )}

        {/* Cancel interview */}
        {isManager && ["scheduled", "waiting"].includes(status) && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <XCircle size={17} />
            Cancel interview
          </button>
        )}

        {/* Complete interview */}
        {isManager && status === "active" && (
          <button
            type="button"
            onClick={onComplete}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Complete interview
          </button>
        )}

        {/* Open interview room */}
        {status === "active" && (
          <button
            type="button"
            onClick={onJoin}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Video size={17} />
            Open interview room
          </button>
        )}

        {/* Evaluate completed interview */}
        {isManager && status === "completed" && (
          <button
            type="button"
            onClick={onEvaluate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <ClipboardCheck size={17} />
            Evaluate Candidate
          </button>
        )}

        {/* Session Replay */}
        {status === "completed" && (
          <button
            type="button"
            onClick={onViewReplay}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 hover:text-white"
          >
            <Film size={17} />
            Session Replay
          </button>
        )}

        {userRole === "candidate" && interview?.status === "completed" && (
          <button
            onClick={onViewScorecard}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <ClipboardCheck size={17} />
            View Scorecard
          </button>
        )}

        {/* Status messages */}
        {status === "cancelled" && (
          <p className="text-sm text-slate-400">
            This interview has been cancelled.
          </p>
        )}

        {status === "scheduled" && !isManager && (
          <p className="text-sm text-slate-400">
            Waiting for the interviewer to start the interview.
          </p>
        )}

        {status === "waiting" && !isManager && (
          <p className="text-sm text-slate-400">
            You have joined. Waiting for the interviewer to start.
          </p>
        )}
      </div>
    </section>
  );
}

export default InterviewActions;
