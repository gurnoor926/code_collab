import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileCode,
  ClipboardCheck,
  Film,
  XCircle,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";
import interviewService from "../../services/interviewService";
import SubmissionReviewModal from "./SubmissionReviewModal";
import UserAvatar from "../common/UserAvatar";

const statusStyles = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  waiting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function InterviewAdministration() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Submission review modal state
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewSubs, setInterviewSubs] = useState([]);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await adminService.getInterviews(params);
      if (res?.success) {
        setInterviews(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch {
      toast.error("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInterviews]);

  const handleOpenSubmissions = async (interview) => {
    try {
      setSelectedInterview(interview);
      setSubModalOpen(true);
      const res = await adminService.getInterviewSubmissions(interview._id);
      setInterviewSubs(res?.data || []);
    } catch {
      toast.error("Failed to load interview submissions.");
    }
  };

  const handleCancelInterview = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this interview?")) {
      return;
    }
    try {
      await interviewService.cancelInterview(id);
      toast.success("Interview cancelled.");
      fetchInterviews();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel interview."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-3 text-zinc-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#161622] px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="waiting">Waiting</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400">
          Total: <strong className="text-white">{pagination.total}</strong> interviews
        </span>
      </div>

      {/* Interviews Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-zinc-900/60 font-semibold text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">Interview Title</th>
                <th className="px-4 py-3.5">Room Code</th>
                <th className="px-4 py-3.5">Interviewer</th>
                <th className="px-4 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Scheduled</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-indigo-500"
                      size={28}
                    />
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-xs text-zinc-500"
                  >
                    No interviews found matching criteria.
                  </td>
                </tr>
              ) : (
                interviews.map((item) => {
                  const statusClass =
                    statusStyles[item.status] ||
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

                  return (
                    <tr
                      key={item._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        <Link
                          to={`/interviews/${item._id}`}
                          className="hover:text-indigo-400 transition flex items-center gap-1.5"
                        >
                          <span className="font-semibold">{item.title}</span>
                          <ArrowUpRight size={13} className="text-zinc-500" />
                        </Link>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                          {item.roomCode || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={item.interviewer} size="xs" />
                          <span className="truncate max-w-28 text-zinc-300">
                            {item.interviewer?.name || "Assigned"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={item.candidate} size="xs" />
                          <span className="truncate max-w-28 text-zinc-300">
                            {item.candidate?.name || "Waiting"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-400">
                        {item.scheduledAt
                          ? new Date(item.scheduledAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Immediate"}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Submissions Review */}
                          <button
                            type="button"
                            onClick={() => handleOpenSubmissions(item)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition"
                            title="Review submissions"
                          >
                            <FileCode size={13} className="inline mr-1" />
                            Submissions
                          </button>

                          {/* Evaluation */}
                          {item.status === "completed" && (
                            <Link
                              to={`/interviews/${item._id}/evaluation`}
                              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                              title="View evaluation"
                            >
                              <ClipboardCheck size={13} className="inline mr-1" />
                              Evaluation
                            </Link>
                          )}

                          {/* Replay */}
                          {item.status === "completed" && (
                            <Link
                              to={`/interviews/${item._id}/replay`}
                              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                              title="Watch session replay"
                            >
                              <Film size={13} className="inline mr-1" />
                              Replay
                            </Link>
                          )}

                          {/* Cancel if scheduled/waiting */}
                          {["scheduled", "waiting"].includes(item.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelInterview(item._id)}
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"
                              title="Cancel interview"
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-zinc-400">
            <span>
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Review Modal */}
      <SubmissionReviewModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        interview={selectedInterview}
        submissions={interviewSubs}
      />
    </div>
  );
}

export default InterviewAdministration;
