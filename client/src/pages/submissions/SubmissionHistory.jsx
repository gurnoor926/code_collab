
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Code2,
  RefreshCw,
  Search,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../components/layout/AppLayout";
import SubmissionFilters from "../../components/submissions/SubmissionFilters";
import SubmissionCard from "../../components/submissions/SubmissionCard";
import submissionService from "../../services/submissionService";

function SubmissionHistory() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [problemId, setProblemId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSubmissions = useCallback(
    async (page = 1, limit = pagination.limit, selectedProblem = problemId) => {
      try {
        setError("");
        setLoading(true);

        const response = await submissionService.getMySubmissions({
          problemId: selectedProblem || undefined,
          page,
          limit,
        });

        const result = response?.data;
        const subs = Array.isArray(result) ? result : (result?.submissions || response?.submissions || []);

        setSubmissions(subs);
        setPagination(
          result?.pagination || {
            page,
            limit,
            total: subs.length,
            totalPages: 1,
          }
        );
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "Unable to load your submissions.";

        setError(message);
        setSubmissions([]);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.limit, problemId]
  );

  useEffect(() => {
  const timer = setTimeout(() => {
    fetchSubmissions(1, pagination.limit, problemId);
  }, 0);

  return () => clearTimeout(timer);
}, [fetchSubmissions, pagination.limit, problemId]);

  // Problem options are derived from the currently loaded records.
  const problems = useMemo(() => {
    const uniqueProblems = new Map();

    submissions.forEach((submission) => {
      if (submission.problem?._id) {
        uniqueProblems.set(submission.problem._id, {
          _id: submission.problem._id,
          title: submission.problem.title,
        });
      }
    });

    return Array.from(uniqueProblems.values());
  }, [submissions]);

  // The API does not support status filtering.
  // This filter applies only to the currently loaded page.
  const filteredSubmissions = useMemo(() => {
    if (!status) return submissions;

    return submissions.filter(
      (submission) => submission.status === status
    );
  }, [submissions, status]);

  const handleProblemChange = (value) => {
    setProblemId(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleLimitChange = (value) => {
    setPagination((prev) => ({ ...prev, page: 1, limit: value }));
  };

  const handleReset = () => {
    setProblemId("");
    setStatus("");
    setPagination((prev) => ({ ...prev, page: 1, limit: 10 }));
  };

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }

    setPagination((prev) => ({ ...prev, page: nextPage }));
    fetchSubmissions(nextPage, pagination.limit, problemId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubmissions(pagination.page, pagination.limit, problemId);
  };

  const acceptedCount = submissions.filter(
    (item) => item.status === "Accepted"
  ).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-400">
                <Terminal size={19} />
                <span className="text-sm font-medium">
                  Coding Activity
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white">
                My Submissions
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Review your coding attempts, results, and execution details.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#11111b] px-4 py-2.5 text-sm text-gray-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Code2 size={20} />
            </div>
            <p className="text-sm text-gray-400">Total Submissions</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Code2 size={20} />
            </div>
            <p className="text-sm text-gray-400">Accepted on This Page</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {acceptedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11111b] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Search size={20} />
            </div>
            <p className="text-sm text-gray-400">Showing</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {filteredSubmissions.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <SubmissionFilters
          problems={problems}
          problemId={problemId}
          status={status}
          limit={pagination.limit}
          onProblemChange={handleProblemChange}
          onStatusChange={setStatus}
          onLimitChange={handleLimitChange}
          onReset={handleReset}
        />

        {/* Submission list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Submission History
            </h2>

            <span className="text-xs text-gray-500">
              {pagination.total} records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#11111b]">
              <RefreshCw size={25} className="animate-spin text-indigo-400" />
              <p className="text-sm text-gray-400">
                Loading your submissions...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="font-medium text-red-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
              >
                Try again
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#11111b] px-5 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Code2 size={27} />
              </div>

              <h3 className="text-lg font-semibold text-white">
                {submissions.length === 0
                  ? "No submissions yet"
                  : "No matching submissions"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-400">
                {submissions.length === 0
                  ? "Start solving coding problems. Your submitted solutions will appear here."
                  : "Try changing your status filter to see more submissions."}
              </p>

              {submissions.length === 0 && (
                <button
                  onClick={() => navigate("/problems")}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Explore Problems
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission._id}
                  submission={submission}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default SubmissionHistory;
