import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  FileCode,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

function SubmissionReviewModal({ isOpen, onClose, interview, submissions = [] }) {
  const [selectedSub, setSelectedSub] = useState(
    submissions.length > 0 ? submissions[0] : null
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (selectedSub?.sourceCode) {
      navigator.clipboard.writeText(selectedSub.sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-6 w-full max-w-5xl rounded-2xl border border-white/10 bg-[#14141f] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Submission Review
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interview: <span className="text-indigo-400 font-medium">{interview?.title}</span> ({submissions.length} submission{submissions.length === 1 ? "" : "s"})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-zinc-500">
            <FileCode size={36} className="mb-3 text-zinc-600" />
            No submissions have been recorded for this interview.
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden">
            {/* Sidebar list */}
            <div className="overflow-y-auto p-3 space-y-2 max-h-[300px] md:max-h-none">
              {submissions.map((sub, idx) => {
                const isAccepted = sub.status === "Accepted";
                const isSelected = (selectedSub?._id || 0) === sub._id;

                return (
                  <button
                    key={sub._id || idx}
                    type="button"
                    onClick={() => setSelectedSub(sub)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                        : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isAccepted ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : (
                          <XCircle size={15} className="text-red-400" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            isAccepted ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(sub.submittedAt || sub.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-medium truncate text-zinc-200">
                      {sub.problem?.title || "Problem"}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="uppercase font-mono text-[10px] text-indigo-400">
                        {sub.language}
                      </span>
                      <span>
                        {sub.passedTestCases || 0} / {sub.totalTestCases || 0} passed
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Code & Details View */}
            <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4 overflow-y-auto">
              {selectedSub ? (
                <>
                  {/* Top Stats Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          selectedSub.status === "Accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {selectedSub.status}
                      </span>
                      <span className="text-xs text-zinc-300 font-medium">
                        Candidate: {selectedSub.user?.name || "Candidate"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                      {selectedSub.executionTimeMs !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-indigo-400" />
                          {selectedSub.executionTimeMs} ms
                        </span>
                      )}
                      {selectedSub.memoryKb !== undefined && (
                        <span className="flex items-center gap-1">
                          <Cpu size={13} className="text-indigo-400" />
                          {Math.round(selectedSub.memoryKb / 1024)} MB
                        </span>
                      )}
                      <span className="uppercase text-indigo-400 font-semibold text-[11px]">
                        {selectedSub.language}
                      </span>
                    </div>
                  </div>

                  {/* Error Message if any */}
                  {selectedSub.errorMessage && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs font-mono text-red-400">
                      {selectedSub.errorMessage}
                    </div>
                  )}

                  {/* Source Code View */}
                  <div className="flex-1 flex flex-col min-h-[300px] rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 bg-zinc-900/60">
                      <span className="text-xs font-mono text-zinc-400">
                        Source Code ({selectedSub.language})
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-zinc-200 whitespace-pre">
                      {selectedSub.sourceCode || "// No source code available."}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                  Select a submission from the list to view code and metrics.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionReviewModal;

