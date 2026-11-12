
import {
  Terminal,
  CircleDot,
  CheckCircle2,
  XCircle,
  Clock3,
  MemoryStick,
  LoaderCircle,
  AlertCircle,
  Send,
  Play,
} from "lucide-react";

function getStatusColor(status) {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
    case "passed":
      return "text-emerald-400 bg-emerald-500/10";

    case "wrong answer":
    case "wrong_answer":
    case "failed":
      return "text-red-400 bg-red-500/10";

    case "running":
    case "pending":
      return "text-yellow-400 bg-yellow-500/10";

    case "runtime error":
    case "runtime_error":
    case "compilation error":
    case "compilation_error":
      return "text-orange-400 bg-orange-500/10";

    default:
      return "text-zinc-400 bg-white/5";
  }
}

function formatTime(value) {
  if (value === null || value === undefined) return "N/A";

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return String(value);

  return `${numericValue} ms`;
}

function formatMemory(value) {
  if (value === null || value === undefined) return "N/A";

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return String(value);

  return `${numericValue} KB`;
}

function ExecutionPanel({
  result = null,
  loading = false,
  error = "",
  mode = "run",
  output = "",
}) {
  const results = result?.results || [];

  const totalTestCases =
    result?.totalTestCases ?? results.length;

  const passedTestCases =
    result?.passedTestCases ??
    results.filter((test) => test.passed).length;

  const failedTestCases = Math.max(
    0,
    totalTestCases - passedTestCases
  );

  const isAccepted =
    result?.status === "Accepted" ||
    result?.status === "accepted";

  const status = result?.status;

  const hasResult = Boolean(result);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#14141d]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal size={17} className="text-indigo-400" />

          <h3 className="text-sm font-semibold text-white">
            Execution Console
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {mode === "submit" ? (
            <>
              <Send size={13} />
              Submission
            </>
          ) : (
            <>
              <Play size={13} />
              Run Code
            </>
          )}
        </div>
      </div>

      <div className="space-y-5 p-4">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <LoaderCircle
              size={20}
              className="animate-spin text-indigo-400"
            />

            <div>
              <p className="text-sm font-medium text-white">
                {mode === "submit"
                  ? "Submitting your solution..."
                  : "Executing your code..."}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Please wait while the test cases are processed.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-medium text-red-400">
                Execution failed
              </p>

              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Initial state */}
        {!loading && !error && !hasResult && (
          <div className="flex min-h-28 flex-col items-center justify-center text-center">
            <Terminal size={27} className="text-zinc-600" />

            <p className="mt-3 text-sm font-medium text-zinc-300">
              No execution results yet
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Run your code or submit your solution to see results here.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && hasResult && (
          <>
            {/* Overall status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500">
                  {mode === "submit"
                    ? "Submission Status"
                    : "Execution Status"}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {isAccepted ? (
                    <CheckCircle2
                      size={20}
                      className="text-emerald-400"
                    />
                  ) : (
                    <CircleDot
                      size={20}
                      className="text-yellow-400"
                    />
                  )}

                  <span
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${getStatusColor(
                      status ||
                        (failedTestCases === 0 &&
                        totalTestCases > 0
                          ? "Accepted"
                          : "Completed")
                    )}`}
                  >
                    {status ||
                      (failedTestCases === 0 &&
                      totalTestCases > 0
                        ? "Accepted"
                        : "Completed")}
                  </span>
                </div>
              </div>

              {result?.submissionId && (
                <div className="text-right">
                  <p className="text-xs text-zinc-500">
                    Submission ID
                  </p>

                  <p className="mt-1 max-w-40 truncate font-mono text-xs text-zinc-300">
                    {result.submissionId}
                  </p>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="text-xs text-zinc-500">
                  Total Tests
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {totalTestCases}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                <p className="text-xs text-zinc-500">
                  Passed
                </p>

                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {passedTestCases}
                </p>
              </div>

              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                <p className="text-xs text-zinc-500">
                  Failed
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {failedTestCases}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="text-xs text-zinc-500">
                  Execution Time
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {formatTime(result?.executionTime)}
                </p>
              </div>
            </div>

            {/* Memory and timestamp */}
            <div className="flex flex-wrap gap-5 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <MemoryStick
                  size={15}
                  className="text-indigo-400"
                />

                Memory: {formatMemory(result?.memoryUsed)}
              </div>

              {result?.submittedAt && (
                <div className="flex items-center gap-2">
                  <Clock3
                    size={15}
                    className="text-indigo-400"
                  />

                  Submitted:{" "}
                  {new Date(result.submittedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Test cases */}
            {results.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    Test Case Results
                  </h4>

                  <span className="text-xs text-zinc-500">
                    {results.length} test cases
                  </span>
                </div>

                <div className="space-y-2">
                  {results.map((test, index) => (
                    <div
                      key={test._id || index}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {test.passed ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-400"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-red-400"
                            />
                          )}

                          <span className="text-sm font-medium text-zinc-200">
                            Test Case {index + 1}
                          </span>
                        </div>

                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-semibold ${getStatusColor(
                            test.status ||
                              (test.passed ? "Passed" : "Failed")
                          )}`}
                        >
                          {test.status ||
                            (test.passed ? "Passed" : "Failed")}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                        {test.executionTime != null && (
                          <span>
                            Time: {formatTime(test.executionTime)}
                          </span>
                        )}

                        {test.memoryUsed != null && (
                          <span>
                            Memory: {formatMemory(test.memoryUsed)}
                          </span>
                        )}
                      </div>

                      {test.error && (
                        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-red-500/5 p-3 font-mono text-xs leading-5 text-red-300">
                          {test.error}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output */}
            {(output || result?.output) && (
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-400">
                  Output
                </p>

                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/20 p-3 font-mono text-xs leading-6 text-zinc-300">
                  {output || result.output}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default ExecutionPanel;
