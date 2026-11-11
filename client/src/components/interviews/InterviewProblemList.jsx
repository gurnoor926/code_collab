
import { Code2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

function InterviewProblemList({ interview }) {
  const problems = interview.problems || interview.problemIds || [];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Assigned problems
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Coding questions for this interview
          </p>
        </div>

        <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400">
          {problems.length} problems
        </span>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
          <Code2 className="mx-auto mb-2 text-slate-500" size={28} />
          <p className="text-sm text-slate-400">
            No coding problems assigned.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem, index) => {
            const id =
              typeof problem === "string" ? problem : problem._id;

            const title =
              typeof problem === "string"
                ? `Problem ${index + 1}`
                : problem.title || `Problem ${index + 1}`;

            return (
              <div
                key={id || index}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Code2 size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {title}
                    </p>

                    {problem?.difficulty && (
                      <p className="mt-1 text-xs capitalize text-slate-400">
                        {problem.difficulty}
                      </p>
                    )}
                  </div>
                </div>

                {typeof problem !== "string" && problem._id && (
                  <Link
                    to={`/problems/${problem._id}`}
                    className="shrink-0 text-slate-400 transition hover:text-indigo-400"
                    title="View problem"
                  >
                    <ExternalLink size={17} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default InterviewProblemList;
