
import {
  CheckCircle2,
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
}) {
  const isManager = ["admin", "interviewer"].includes(userRole);
  const status = interview.status;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Interview actions
      </h2>

      <div className="flex flex-wrap gap-3">
        {isManager && status === "waiting" && (
          <button
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

        {isManager && ["scheduled", "waiting"].includes(status) && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <XCircle size={17} />
            Cancel interview
          </button>
        )}

        {isManager && status === "active" && (
          <button
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

        {status === "active" && (
          <button
            onClick={onJoin}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Video size={17} />
            Open interview room
          </button>
        )}

        {["completed", "cancelled"].includes(status) && (
          <p className="text-sm text-slate-400">
            This interview is {status}. No further actions are available.
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
