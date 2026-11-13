import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  Code2,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";
import ProblemFormModal from "./ProblemFormModal";
import TestCaseManagementModal from "./TestCaseManagementModal";

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

function ProblemManagement() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [testCaseModalOpen, setTestCaseModalOpen] = useState(false);
  const [testCaseProblem, setTestCaseProblem] = useState(null);

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        isPublished: statusFilter === "all" ? "all" : statusFilter === "published",
      };

      if (search.trim()) params.search = search.trim();
      if (difficulty !== "all") params.difficulty = difficulty;

      const res = await adminService.getProblems(params);
      if (res?.success) {
        setProblems(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch {
      toast.error("Failed to load problems.");
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProblems]);

  const handleCreate = () => {
    setSelectedProblem(null);
    setFormModalOpen(true);
  };

  const handleEdit = async (problem) => {
    try {
      // Fetch full problem details (including starter code and templates)
      const res = await adminService.getProblemById(problem._id, {
        allowDraft: "true",
      });
      setSelectedProblem(res?.data || problem);
    } catch {
      setSelectedProblem(problem);
    }
    setFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) {
      return;
    }
    try {
      await adminService.deleteProblem(id);
      toast.success("Problem deleted successfully.");
      fetchProblems();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete problem."
      );
    }
  };

  const handleTogglePublish = async (problem) => {
    try {
      const nextStatus = !problem.isPublished;
      await adminService.updateProblem(problem._id, {
        isPublished: nextStatus,
      });
      toast.success(
        `Problem ${nextStatus ? "published" : "unpublished"} successfully.`
      );
      fetchProblems();
    } catch {
      toast.error("Failed to update publication status.");
    }
  };

  const handleOpenTestCases = (problem) => {
    setTestCaseProblem(problem);
    setTestCaseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
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
              placeholder="Search problems..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#161622] px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Publication Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#161622] px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="draft">Unpublished (Draft)</option>
          </select>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
        >
          <Plus size={16} />
          Create Problem
        </button>
      </div>

      {/* Problems Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-zinc-900/60 font-semibold text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Difficulty</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Languages</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-indigo-500"
                      size={28}
                    />
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-xs text-zinc-500"
                  >
                    No problems found matching criteria.
                  </td>
                </tr>
              ) : (
                problems.map((p) => {
                  const diffClass =
                    difficultyColors[p.difficulty] ||
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                  const isPub = p.isPublished ?? true;

                  return (
                    <tr
                      key={p._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Code2 size={16} className="text-indigo-400 shrink-0" />
                          <span className="font-semibold">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-400">{p.category}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${diffClass}`}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                            isPub
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                          }`}
                          title="Click to toggle publish"
                        >
                          {isPub ? (
                            <>
                              <Eye size={11} /> Published
                            </>
                          ) : (
                            <>
                              <EyeOff size={11} /> Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(p.supportedLanguages || []).map((l) => (
                            <span
                              key={l}
                              className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase font-mono text-zinc-400"
                            >
                              {l === "cpp" ? "C++" : l}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Test Cases */}
                          <button
                            type="button"
                            onClick={() => handleOpenTestCases(p)}
                            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
                            title="Manage test cases"
                          >
                            <Sliders size={13} className="inline mr-1" />
                            Test Cases
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            title="Edit problem"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Delete problem"
                          >
                            <Trash2 size={15} />
                          </button>
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
              Page {page} of {pagination.totalPages} ({pagination.total} problems)
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

      {/* Problem Edit/Create Modal */}
      <ProblemFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        problem={selectedProblem}
        onSuccess={fetchProblems}
      />

      {/* Test Cases Modal */}
      <TestCaseManagementModal
        isOpen={testCaseModalOpen}
        onClose={() => setTestCaseModalOpen(false)}
        problem={testCaseProblem}
      />
    </div>
  );
}

export default ProblemManagement;
