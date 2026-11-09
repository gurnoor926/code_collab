
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Cpu,
  FileCode2,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../components/layout/AppLayout";
import SubmissionStatus from "../../components/submissions/SubmissionStatus";
import submissionService from "../../services/submissionService";

function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await submissionService.getSubmissionById(id);

        if (isMounted) {
          setSubmission(response?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err.response?.data?.message ||
            "Unable to load submission details.";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSubmission();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyCode = async () => {
    if (!submission?.sourceCode) return;

    try {
      await navigator.clipboard.writeText(submission.sourceCode);
      toast.success("Source code copied!");
    } catch {
      toast.error("Unable to copy source code.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">
            Loading submission details...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error || !submission) {
    return (
      <AppLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-red-400">
            <FileCode2 size={30} />
          </div>

          <h2 className="text-xl font-semibold text-white">
            Submission unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            {error || "This submission could not be found."}
          </p>

          <button
            onClick={() => navigate("/submissions")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Back to submissions
          </button>
        </div>
      </AppLayout>
    );
  }

  const metrics = [
    {
      label: "Test Cases Passed",
      value: `${submission.passedTestCases ?? 0}/${submission.totalTestCases ?? 0}`,
      icon: FlaskConical,
      color: "text-indigo-400",
    },
    {
      label: "Execution Time",
      value:
        submission.executionTime != null
          ? submission.executionTime
          : "—",
      icon: Clock3,
      color: "text-blue-400",
    },
    {
      label: "Memory Used",
      value:
        submission.memoryUsed != null
          ? submission.memoryUsed
          : "—",
      icon: Cpu,
      color: "text-purple-400",
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-7">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/submissions")}
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to submissions
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-400">
                <FileCode2 size={18} />
                <span className="text-sm font-medium">
                  Submission Details
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {submission.problem?.title || "Unknown Problem"}
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Review your submitted solution and execution information.
              </p>
            </div>

            <SubmissionStatus status={submission.status} />
          </div>
        </div>

        {/* Submission information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-400">
              <Code2 size={17} />
              <span className="text-xs">Language</span>
            </div>
            <p className="font-semibold capitalize text-white">
              {submission.language || "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-400">
              <CalendarDays size={17} />
              <span className="text-xs">Submitted At</span>
            </div>
            <p className="text-sm font-medium text-white">
              {formatDate(submission.submittedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-400">
              <CheckCircle2 size={17} />
              <span className="text-xs">Test Cases Passed</span>
            </div>
            <p className="font-semibold text-white">
              {submission.passedTestCases ?? 0}/
              {submission.totalTestCases ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-400">
              <Clock3 size={17} />
              <span className="text-xs">Execution Time</span>
            </div>
            <p className="font-semibold text-white">
              {submission.executionTime ?? "—"}
            </p>
          </div>
        </div>

        {/* Execution metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#11111b] p-5"
              >
                <div className={`rounded-xl bg-white/5 p-3 ${metric.color}`}>
                  <Icon size={21} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {metric.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Source code */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11111b]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileCode2 size={18} className="text-indigo-400" />
                <h2 className="font-semibold text-white">
                  Submitted Source Code
                </h2>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Read-only view of your submitted solution.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-indigo-500/40 hover:text-white"
            >
              <Copy size={14} />
              Copy Code
            </button>
          </div>

          <div className="overflow-x-auto bg-[#09090f] p-5">
            <pre className="min-h-72 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-gray-300">
              <code>{submission.sourceCode || "// No source code available."}</code>
            </pre>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default SubmissionDetail;
