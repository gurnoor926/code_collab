
import { Filter, RotateCcw } from "lucide-react";

function SubmissionFilters({
  problems = [],
  problemId,
  status,
  limit,
  onProblemChange,
  onStatusChange,
  onLimitChange,
  onReset,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#11111b] p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Filter size={16} />
        Filters
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Problem filter */}
        <select
          value={problemId}
          onChange={(e) => onProblemChange(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500"
        >
          <option value="">All Problems</option>

          {problems.map((problem) => (
            <option key={problem._id} value={problem._id}>
              {problem.title}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
          <option value="Pending">Pending</option>
          <option value="Running">Running</option>
          <option value="Compilation Error">Compilation Error</option>
          <option value="Runtime Error">Runtime Error</option>
          <option value="Time Limit Exceeded">Time Limit Exceeded</option>
          <option value="Memory Limit Exceeded">Memory Limit Exceeded</option>
          <option value="Internal Error">Internal Error</option>
        </select>

        {/* Page size */}
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-gray-200 outline-none transition focus:border-indigo-500"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
      >
        <RotateCcw size={14} />
        Reset
      </button>
    </div>
  );
}

export default SubmissionFilters;
