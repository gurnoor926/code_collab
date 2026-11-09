
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Clock3,
  Code2,
  Cpu,
  FlaskConical,
} from "lucide-react";

import SubmissionStatus from "./SubmissionStatus";

function SubmissionCard({ submission }) {
  const navigate = useNavigate();

  const {
    _id,
    problem,
    language,
    status,
    totalTestCases,
    passedTestCases,
    executionTime,
    memoryUsed,
    submittedAt,
  } = submission;

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString()
    : "Date unavailable";

  return (
    <div
      onClick={() => navigate(`/submissions/${_id}`)}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-[#11111b] p-5 transition duration-200 hover:border-indigo-500/40 hover:bg-[#151522]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white transition group-hover:text-indigo-400">
              {problem?.title || "Unknown Problem"}
            </h3>

            {problem?.difficulty && (
              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-400">
                {problem.difficulty}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Code2 size={14} />
              {language || "Unknown"}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 size={14} />
              {formattedDate}
            </span>
          </div>
        </div>

        <SubmissionStatus status={status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-indigo-400" />
          <div>
            <p className="text-xs text-gray-500">Test Cases</p>
            <p className="text-sm font-medium text-gray-200">
              {passedTestCases ?? 0}/{totalTestCases ?? 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock3 size={16} className="text-blue-400" />
          <div>
            <p className="text-xs text-gray-500">Execution Time</p>
            <p className="text-sm font-medium text-gray-200">
              {executionTime != null ? `${executionTime} ms` : "—"}
            </p>
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-between sm:col-span-1">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-purple-400" />
            <div>
              <p className="text-xs text-gray-500">Memory</p>
              <p className="text-sm font-medium text-gray-200">
                {memoryUsed != null ? `${memoryUsed} KB` : "—"}
              </p>
            </div>
          </div>

          <ArrowUpRight
            size={18}
            className="text-gray-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}

export default SubmissionCard;
