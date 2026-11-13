import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Play,
  Send,
  ChevronDown,
  LoaderCircle,
  AlertCircle,
  Terminal,
  FileCode2,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../components/layout/AppLayout";
import CodeEditor from "../../components/editor/CodeEditor";
import problemService from "../../services/problemService";
import useCodeExecution from "../../hooks/useCodeExecution";
import submissionService from "../../services/submissionService";

const languageLabels = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
};

const difficultyStyles = {
  Easy: "bg-emerald-500/10 text-emerald-400",
  Medium: "bg-amber-500/10 text-amber-400",
  Hard: "bg-red-500/10 text-red-400",
};

function ProblemDetail() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const [activeTab, setActiveTab] = useState("description");
  const [outputTab, setOutputTab] = useState("output");
  const [customInput, setCustomInput] = useState("");
  const {
    runCode,
    loading: executionLoading,
    result: executionResult,
    error: executionError,
    clearResult,
  } = useCodeExecution();
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [examplesResult, setExamplesResult] = useState(null);
  const [examplesError, setExamplesError] = useState("");

  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState("");

  const isBusy = executionLoading || examplesLoading || submissionLoading;

  useEffect(() => {
    let active = true;

    const fetchProblem = async () => {
      try {
        const response = await problemService.getProblemById(id);

        if (!active) return;

        const fetchedProblem = response.data;

        setProblem(fetchedProblem);

        const languages = fetchedProblem.supportedLanguages ?? [];
        const initialLanguage = languages.includes("javascript")
          ? "javascript"
          : languages[0] || "javascript";

        setLanguage(initialLanguage);

        const starterCode = fetchedProblem.starterCode ?? {};
        setCode(starterCode[initialLanguage] || "");
        setError("");
      } catch (err) {
        if (!active) return;

        setError(err.response?.data?.message || "Unable to load this problem.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProblem();

    return () => {
      active = false;
    };
  }, [id]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);

    const starterCode = problem?.starterCode ?? {};
    setCode(starterCode[nextLanguage] || "");
  };

  const handleRunCode = async () => {
    setOutputTab("output");
    setExamplesError("");
    setSubmissionError("");

    clearResult();

    await runCode({
      language,
      code,
      stdin: customInput,
    });
  };
  const handleRunExamples = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first.");
      return;
    }

    setExamplesLoading(true);
    setExamplesError("");
    setExamplesResult(null);
    setOutputTab("examples");

    try {
      const response = await submissionService.runExamples({
        problemId: id,
        language,
        code,
      });

      setExamplesResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to run the example test cases.";

      setExamplesError(message);
      toast.error(message);
    } finally {
      setExamplesLoading(false);
    }
  };

  // 3. Formal submission against all test cases.
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code before submitting.");
      return;
    }

    setSubmissionLoading(true);
    setSubmissionError("");
    setSubmissionResult(null);
    setOutputTab("submission");

    try {
      const response = await submissionService.submitSolution({
        problemId: id,
        language,
        code,
      });

      setSubmissionResult(response.data);
      toast.success("Solution evaluated successfully.");
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to submit your solution.";

      setSubmissionError(message);
      toast.error(message);
    } finally {
      setSubmissionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoaderCircle size={30} className="animate-spin text-indigo-400" />
        </div>
      </AppLayout>
    );
  }

  if (error || !problem) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-[#18181f] p-8 text-center">
          <AlertCircle size={30} className="mx-auto text-red-400" />

          <h2 className="mt-4 text-lg font-semibold text-white">
            Problem unavailable
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {error || "This problem could not be found."}
          </p>

          <Link
            to="/problems"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            <ArrowLeft size={16} />
            Back to problems
          </Link>
        </div>
      </AppLayout>
    );
  }

  const supportedLanguages = problem.supportedLanguages ?? [];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/problems"
            className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Problem Library
          </Link>

          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <Code2 size={15} />
            CodeCollab Workspace
          </span>
        </div>

        {/* Workspace */}
        <div className="grid min-h-[750px] gap-4 xl:grid-cols-2">
          {/* LEFT: Problem Description */}
          <section className="flex min-h-[600px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#18181f]">
            {/* Problem Header */}
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${difficultyStyles[problem.difficulty] || "bg-white/5 text-zinc-400"}`}
                >
                  {problem.difficulty}
                </span>

                <span className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {problem.category}
                </span>
              </div>

              <h1 className="mt-4 text-xl font-bold text-white">
                {problem.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2">
                {(problem.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-5 border-b border-white/10 px-5">
              {["description", "examples"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 py-3 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? "border-indigo-400 text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {activeTab === "description" && (
                <>
                  <div>
                    <h2 className="mb-3 font-semibold text-white">
                      Problem Description
                    </h2>

                    <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {problem.description}
                    </div>
                  </div>

                  {Array.isArray(problem.constraints) && problem.constraints.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-white">
                        Constraints
                      </h3>

                      <ul className="space-y-2">
                        {problem.constraints.map((constraint, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm text-zinc-400"
                          >
                            <span className="text-indigo-400">•</span>
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {problem.examples?.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("examples")}
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        View examples →
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeTab === "examples" && (
                <div className="space-y-5">
                  {problem.examples?.map((example, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 bg-[#101017] p-4"
                    >
                      <h3 className="mb-4 text-sm font-semibold text-white">
                        Example {index + 1}
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="mb-1 text-xs text-zinc-500">Input</p>
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-emerald-300">
                            {example.input}
                          </pre>
                        </div>

                        <div>
                          <p className="mb-1 text-xs text-zinc-500">Output</p>
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-indigo-300">
                            {example.output}
                          </pre>
                        </div>

                        {example.explanation && (
                          <div>
                            <p className="mb-1 text-xs text-zinc-500">
                              Explanation
                            </p>
                            <p className="leading-6 text-zinc-400">
                              {example.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!problem.examples || problem.examples.length === 0) && (
                    <p className="text-sm text-zinc-500">
                      No examples are available for this problem.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Editor */}
          <section className="flex min-h-[750px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#18181f]">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
              <div className="flex items-center gap-2">
                <FileCode2 size={17} className="text-indigo-400" />

                <span className="text-sm font-semibold text-white">
                  Code Editor
                </span>
              </div>

              <div className="relative">
                <select
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="appearance-none rounded-lg border border-white/10 bg-[#101017] py-2 pl-3 pr-9 text-xs text-zinc-300 outline-none focus:border-indigo-500"
                >
                  {supportedLanguages.map((item) => (
                    <option key={item} value={item}>
                      {languageLabels[item] || item}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
              </div>
            </div>

            {/* Editor */}
            <div className="min-h-[450px] flex-1">
              <CodeEditor language={language} code={code} onChange={setCode} />
            </div>

            {/* Custom Input */}
            <div className="border-t border-white/10">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <Terminal size={16} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">
                  Custom Input
                </span>
              </div>

              <textarea
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="Enter custom input here..."
                rows={3}
                className="w-full resize-y bg-[#101017] p-4 font-mono text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* Output */}
            {/* Results Panel */}
            <div className="border-t border-white/10">
              {/* Result Tabs */}
              <div className="flex gap-5 border-b border-white/10 px-4">
                {[
                  { id: "output", label: "Execution Output" },
                  { id: "examples", label: "Example Tests" },
                  { id: "submission", label: "Submission" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOutputTab(tab.id)}
                    className={`border-b-2 py-3 text-xs font-medium transition ${
                      outputTab === tab.id
                        ? "border-indigo-400 text-indigo-400"
                        : "border-transparent text-zinc-500 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="min-h-36 max-h-80 space-y-4 overflow-y-auto bg-[#101017] p-4">
                {/* RUN CODE OUTPUT */}
                {outputTab === "output" && (
                  <>
                    {executionLoading && (
                      <div className="flex items-center gap-2 text-xs text-indigo-400">
                        <LoaderCircle size={15} className="animate-spin" />
                        Executing your code...
                      </div>
                    )}

                    {executionError && (
                      <pre className="whitespace-pre-wrap text-xs text-red-400">
                        {executionError}
                      </pre>
                    )}

                    {executionResult && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                            {executionResult.status?.id === 3
                              ? "Execution completed"
                              : executionResult.status?.description ||
                                "Execution finished"}
                          </span>

                          {executionResult.time != null && (
                            <span className="text-xs text-zinc-500">
                              Time: {executionResult.time}s
                            </span>
                          )}

                          {executionResult.memory != null && (
                            <span className="text-xs text-zinc-500">
                              Memory:{" "}
                              {(executionResult.memory / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>

                        {executionResult.stdout && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-zinc-400">
                              Standard Output
                            </p>
                            <pre className="whitespace-pre-wrap text-xs text-emerald-300">
                              {executionResult.stdout}
                            </pre>
                          </div>
                        )}

                        {executionResult.stderr && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-red-400">
                              Runtime Error
                            </p>
                            <pre className="whitespace-pre-wrap text-xs text-red-300">
                              {executionResult.stderr}
                            </pre>
                          </div>
                        )}

                        {executionResult.compile_output && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-amber-400">
                              Compilation Output
                            </p>
                            <pre className="whitespace-pre-wrap text-xs text-amber-300">
                              {executionResult.compile_output}
                            </pre>
                          </div>
                        )}

                        {!executionResult.stdout &&
                          !executionResult.stderr &&
                          !executionResult.compile_output && (
                            <p className="text-xs text-zinc-500">
                              {executionResult.message ||
                                "Execution completed without output."}
                            </p>
                          )}

                        <p className="text-xs text-zinc-500">
                          This confirms code execution only. Use Run Examples or
                          Submit Solution to check correctness.
                        </p>
                      </div>
                    )}

                    {!executionLoading &&
                      !executionError &&
                      !executionResult && (
                        <p className="text-xs text-zinc-500">
                          Run your code to see its execution output here.
                        </p>
                      )}
                  </>
                )}

                {/* PUBLIC TEST CASES */}
                {outputTab === "examples" && (
                  <>
                    {examplesLoading && (
                      <div className="flex items-center gap-2 text-xs text-indigo-400">
                        <LoaderCircle size={15} className="animate-spin" />
                        Running public test cases...
                      </div>
                    )}

                    {examplesError && (
                      <p className="text-xs text-red-400">{examplesError}</p>
                    )}

                    {examplesResult && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Public Test Results
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {examplesResult.passedTestCases} of{" "}
                              {examplesResult.totalTestCases} test cases passed
                            </p>
                          </div>

                          <span
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                              examplesResult.passedTestCases ===
                              examplesResult.totalTestCases
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {examplesResult.passedTestCases ===
                            examplesResult.totalTestCases
                              ? "All Passed"
                              : "Some Tests Failed"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {examplesResult.results?.map((test, index) => (
                            <div
                              key={index}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
                            >
                              <div>
                                <p className="text-xs font-medium text-white">
                                  Test Case {index + 1}
                                </p>
                                {test.status && (
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {test.status}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {test.executionTime != null && (
                                  <span className="text-xs text-zinc-500">
                                    {test.executionTime}
                                  </span>
                                )}

                                <span
                                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                                    test.passed
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {test.passed ? "Passed" : "Failed"}
                                </span>
                              </div>

                              {test.error && (
                                <p className="w-full whitespace-pre-wrap text-xs text-red-400">
                                  {test.error}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!examplesLoading && !examplesError && !examplesResult && (
                      <p className="text-xs text-zinc-500">
                        Click Run Examples to test your solution against public
                        test cases.
                      </p>
                    )}
                  </>
                )}

                {/* FORMAL SUBMISSION */}
                {outputTab === "submission" && (
                  <>
                    {submissionLoading && (
                      <div className="flex items-center gap-2 text-xs text-indigo-400">
                        <LoaderCircle size={15} className="animate-spin" />
                        Evaluating your submission against all test cases...
                      </div>
                    )}

                    {submissionError && (
                      <p className="text-xs text-red-400">{submissionError}</p>
                    )}

                    {submissionResult && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <p className="text-xs text-zinc-500">Final Verdict</p>

                          <p className="mt-2 text-lg font-bold text-white">
                            {typeof submissionResult.status === "string"
                              ? submissionResult.status
                              : submissionResult.status?.description ||
                                "Submission evaluated"}
                          </p>

                          <p className="mt-2 text-sm text-zinc-400">
                            {submissionResult.passedTestCases} of{" "}
                            {submissionResult.totalTestCases} test cases passed
                          </p>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${
                                  submissionResult.totalTestCases > 0
                                    ? (submissionResult.passedTestCases /
                                        submissionResult.totalTestCases) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-white/10 p-3">
                            <p className="text-xs text-zinc-500">
                              Execution Time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {submissionResult.executionTime ?? "—"}
                            </p>
                          </div>

                          <div className="rounded-lg border border-white/10 p-3">
                            <p className="text-xs text-zinc-500">Memory Used</p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {submissionResult.memoryUsed ?? "—"}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500">
                          Submission ID: {submissionResult.submissionId}
                        </p>

                        <p className="text-xs text-zinc-500">
                          Final results include hidden test cases. Hidden test
                          inputs and expected outputs are not displayed.
                        </p>
                      </div>
                    )}

                    {!submissionLoading &&
                      !submissionError &&
                      !submissionResult && (
                        <p className="text-xs text-zinc-500">
                          Click Submit Solution to evaluate your solution
                          against all active test cases.
                        </p>
                      )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 p-3">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isBusy}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {executionLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Run Code
              </button>

              <button
                type="button"
                onClick={handleRunExamples}
                disabled={isBusy}
                className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {examplesLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Run Examples
              </button>

              <button
                type="button"
                onClick={handleSubmitCode}
                disabled={isBusy}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submissionLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Submit Solution
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default ProblemDetail;
