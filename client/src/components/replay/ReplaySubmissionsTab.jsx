import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Cpu, FileCode } from "lucide-react";

function ReplaySubmissionsTab({ submissions = [], onSelectCode }) {
  const [selectedSub, setSelectedSub] = useState(null);

  if (submissions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-xs text-zinc-500">
        <FileCode size={32} className="mb-2 text-zinc-600" />
        No submissions were made during this session.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col divide-y divide-white/[0.05] overflow-y-auto p-3 space-y-2">
      {submissions.map((sub, idx) => {
        const isAccepted = sub.status === "Accepted";
        const isSelected = selectedSub?._id === sub._id;

        return (
          <div
            key={sub._id || idx}
            className={`rounded-xl border p-3 transition ${
              isSelected
                ? "border-indigo-500/40 bg-indigo-500/10"
                : "border-white/5 bg-zinc-900/40 hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isAccepted ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    isAccepted ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {sub.status}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {new Date(sub.submittedAt || sub.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-zinc-300">
              {sub.problem?.title || "Problem"}
            </p>

            <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="rounded bg-white/5 px-2 py-0.5 uppercase font-mono text-zinc-300">
                {sub.language}
              </span>
              {sub.executionTimeMs !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {sub.executionTimeMs} ms
                </span>
              )}
              {sub.memoryKb !== undefined && (
                <span className="flex items-center gap-1">
                  <Cpu size={12} />
                  {Math.round(sub.memoryKb / 1024)} MB
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-zinc-500">
                Passed: {sub.passedTestCases || 0} / {sub.totalTestCases || 0}
              </span>

              {sub.sourceCode && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSub(sub);
                    onSelectCode?.(sub.sourceCode, sub.language);
                  }}
                  className="rounded-lg bg-indigo-600/20 px-2.5 py-1 text-[11px] font-medium text-indigo-400 hover:bg-indigo-600/30"
                >
                  Load in Editor
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ReplaySubmissionsTab;

