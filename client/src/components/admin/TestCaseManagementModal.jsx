import { useCallback, useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit2,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";

function TestCaseManagementModal({ isOpen, onClose, problem }) {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New or Edit test case form state
  const [editingId, setEditingId] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [expectedOutputVal, setExpectedOutputVal] = useState("");
  const [isHiddenVal, setIsHiddenVal] = useState(false);
  const [pointsVal, setPointsVal] = useState(1);
  const [orderVal, setOrderVal] = useState(0);
  const [isActiveVal, setIsActiveVal] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setInputVal("");
    setExpectedOutputVal("");
    setIsHiddenVal(false);
    setPointsVal(1);
    setIsActiveVal(true);
    setOrderVal(0);
  };

  const fetchTestCases = useCallback(async () => {
    if (!problem?._id) return;
    try {
      setLoading(true);
      const res = await adminService.getProblemTestCases(problem._id);
      if (res?.success) {
        setTestCases(res.data || []);
        // Automatically default next order
        setOrderVal((res.data || []).length);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load test cases."
      );
    } finally {
      setLoading(false);
    }
  }, [problem]);

  useEffect(() => {
    if (isOpen && problem?._id) {
      const timer = setTimeout(() => {
        fetchTestCases();
        resetForm();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, problem, fetchTestCases]);

  const handleStartEdit = (tc) => {
    setEditingId(tc._id);
    setInputVal(tc.input);
    setExpectedOutputVal(tc.expectedOutput);
    setIsHiddenVal(tc.isHidden ?? false);
    setPointsVal(tc.points ?? 1);
    setOrderVal(tc.order ?? 0);
    setIsActiveVal(tc.isActive ?? true);
  };

  const handleSaveTestCase = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || !expectedOutputVal.trim()) {
      toast.error("Both input and expected output are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        input: inputVal,
        expectedOutput: expectedOutputVal,
        isHidden: isHiddenVal,
        points: Number(pointsVal) || 1,
        order: Number(orderVal) || 0,
        isActive: isActiveVal,
      };

      if (editingId) {
        await adminService.updateTestCase(editingId, payload);
        toast.success("Test case updated!");
      } else {
        await adminService.createTestCase(problem._id, payload);
        toast.success("Test case added!");
      }
      resetForm();
      fetchTestCases();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save test case."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestCase = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) {
      return;
    }
    try {
      await adminService.deleteTestCase(id);
      toast.success("Test case deleted!");
      fetchTestCases();
    } catch {
      toast.error("Failed to delete test case.");
    }
  };

  const handleToggleHidden = async (tc) => {
    try {
      await adminService.updateTestCase(tc._id, {
        isHidden: !tc.isHidden,
      });
      fetchTestCases();
      toast.success(
        `Test case marked as ${!tc.isHidden ? "Hidden" : "Public"}.`
      );
    } catch {
      toast.error("Failed to update test case.");
    }
  };

  const handleToggleActive = async (tc) => {
    try {
      await adminService.updateTestCase(tc._id, {
        isActive: !tc.isActive,
      });
      fetchTestCases();
      toast.success(
        `Test case ${!tc.isActive ? "activated" : "deactivated"}.`
      );
    } catch {
      toast.error("Failed to update test case.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#14141f] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Test Case Management
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Problem: <span className="text-indigo-400 font-medium">{problem?.title}</span> ({testCases.length} test cases)
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add / Edit Form */}
          <div className="rounded-2xl border border-white/10 bg-[#191926] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                {editingId ? "Edit Test Case" : "Add New Test Case"}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTestCase} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Input Stdin / Arguments *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="e.g. [2, 7, 11, 15]\n9"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Expected Output *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={expectedOutputVal}
                    onChange={(e) => setExpectedOutputVal(e.target.value)}
                    placeholder="e.g. [0, 1]"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Points (Score)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pointsVal}
                    onChange={(e) => setPointsVal(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Order / Sequence
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={orderVal}
                    onChange={(e) => setOrderVal(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isHiddenCheckbox"
                    checked={isHiddenVal}
                    onChange={(e) => setIsHiddenVal(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0"
                  />
                  <label
                    htmlFor="isHiddenCheckbox"
                    className="text-xs font-medium text-zinc-300 cursor-pointer"
                  >
                    Hidden Test Case
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={isActiveVal}
                    onChange={(e) => setIsActiveVal(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0"
                  />
                  <label
                    htmlFor="isActiveCheckbox"
                    className="text-xs font-medium text-zinc-300 cursor-pointer"
                  >
                    Active for Evaluation
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting && (
                    <LoaderCircle size={14} className="animate-spin" />
                  )}
                  {editingId ? "Update Test Case" : "Add Test Case"}
                </button>
              </div>
            </form>
          </div>

          {/* Test Cases List */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Existing Test Cases ({testCases.length})
            </h3>

            {loading ? (
              <div className="py-12 flex justify-center">
                <LoaderCircle className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : testCases.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-500">
                No test cases configured for this problem yet. Add your first test case above!
              </div>
            ) : (
              <div className="space-y-3">
                {testCases.map((tc, idx) => (
                  <div
                    key={tc._id || idx}
                    className={`rounded-xl border p-4 transition ${
                      tc.isActive
                        ? "border-white/10 bg-[#181824]"
                        : "border-white/5 bg-zinc-900/30 opacity-60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          #{tc.order !== undefined ? tc.order : idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleHidden(tc)}
                          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border transition ${
                            tc.isHidden
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                          title="Click to toggle Public / Hidden"
                        >
                          {tc.isHidden ? (
                            <>
                              <EyeOff size={12} /> Hidden
                            </>
                          ) : (
                            <>
                              <Eye size={12} /> Public
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(tc)}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border transition ${
                            tc.isActive
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                          }`}
                          title="Click to toggle Active / Inactive"
                        >
                          {tc.isActive ? "Active" : "Inactive"}
                        </button>

                        <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                          {tc.points || 1} pt{tc.points > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tc)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5 hover:text-white"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestCase(tc._id)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-500 font-mono uppercase">Input</span>
                        <pre className="mt-1 max-h-24 overflow-x-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap">
                          {tc.input}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[11px] text-zinc-500 font-mono uppercase">Expected Output</span>
                        <pre className="mt-1 max-h-24 overflow-x-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestCaseManagementModal;
