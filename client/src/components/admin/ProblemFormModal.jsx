import { useEffect, useState } from "react";
import { X, Plus, Trash2, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";

const defaultTemplates = {
  javascript: `// Write your JavaScript solution here
function solution() {

}`,
  python: `# Write your Python solution here
def solution():
    pass`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
};

function ProblemFormModal({ isOpen, onClose, problem, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [category, setCategory] = useState("Algorithms");
  const [tagsInput, setTagsInput] = useState("");
  const [constraints, setConstraints] = useState([""]);
  const [examples, setExamples] = useState([
    { input: "", output: "", explanation: "" },
  ]);
  const [supportedLanguages, setSupportedLanguages] = useState([
    "javascript",
    "python",
    "java",
    "cpp",
  ]);
  const [starterCode, setStarterCode] = useState(defaultTemplates);
  const [activeLangTab, setActiveLangTab] = useState("javascript");
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (problem) {
        setTitle(problem.title || "");
        setDescription(problem.description || "");
        setDifficulty(problem.difficulty || "Easy");
        setCategory(problem.category || "Algorithms");
        setTagsInput(Array.isArray(problem.tags) ? problem.tags.join(", ") : "");
        setConstraints(
          problem.constraints?.length ? problem.constraints : [""]
        );
        setExamples(
          problem.examples?.length
            ? problem.examples.map((ex) => ({
                input: ex.input || "",
                output: ex.output || "",
                explanation: ex.explanation || "",
              }))
            : [{ input: "", output: "", explanation: "" }]
        );
        setSupportedLanguages(
          problem.supportedLanguages || ["javascript", "python", "java", "cpp"]
        );
        setStarterCode({
          javascript:
            problem.starterCode?.javascript || defaultTemplates.javascript,
          python: problem.starterCode?.python || defaultTemplates.python,
          java: problem.starterCode?.java || defaultTemplates.java,
          cpp: problem.starterCode?.cpp || defaultTemplates.cpp,
        });
        setTimeLimit(problem.timeLimit || 2);
        setMemoryLimit(problem.memoryLimit || 256);
        setIsPublished(problem.isPublished ?? true);
      } else {
        // Reset form
        setTitle("");
        setDescription("");
        setDifficulty("Easy");
        setCategory("Algorithms");
        setTagsInput("");
        setConstraints([""]);
        setExamples([{ input: "", output: "", explanation: "" }]);
        setSupportedLanguages(["javascript", "python", "java", "cpp"]);
        setStarterCode(defaultTemplates);
        setTimeLimit(2);
        setMemoryLimit(256);
        setIsPublished(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [problem, isOpen]);

  if (!isOpen) return null;

  // Constraint handlers
  const handleAddConstraint = () => setConstraints([...constraints, ""]);
  const handleConstraintChange = (idx, val) => {
    const updated = [...constraints];
    updated[idx] = val;
    setConstraints(updated);
  };
  const handleRemoveConstraint = (idx) => {
    setConstraints(constraints.filter((_, i) => i !== idx));
  };

  // Example handlers
  const handleAddExample = () => {
    setExamples([...examples, { input: "", output: "", explanation: "" }]);
  };
  const handleExampleChange = (idx, field, val) => {
    const updated = [...examples];
    updated[idx][field] = val;
    setExamples(updated);
  };
  const handleRemoveExample = (idx) => {
    if (examples.length === 1) {
      toast.error("At least one example is required.");
      return;
    }
    setExamples(examples.filter((_, i) => i !== idx));
  };

  // Language toggle
  const toggleLanguage = (lang) => {
    if (supportedLanguages.includes(lang)) {
      if (supportedLanguages.length === 1) {
        toast.error("At least one language must be supported.");
        return;
      }
      setSupportedLanguages(supportedLanguages.filter((l) => l !== lang));
    } else {
      setSupportedLanguages([...supportedLanguages, lang]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !category.trim()) {
      toast.error("Please fill in title, description, and category.");
      return;
    }

    const cleanConstraints = constraints
      .map((c) => c.trim())
      .filter(Boolean);

    const cleanExamples = examples.filter(
      (ex) => ex.input.trim() && ex.output.trim()
    );

    if (cleanExamples.length === 0) {
      toast.error("At least one valid example with input & output is required.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      category: category.trim(),
      tags,
      constraints: cleanConstraints,
      examples: cleanExamples,
      supportedLanguages,
      starterCode,
      timeLimit: Number(timeLimit) || 2,
      memoryLimit: Number(memoryLimit) || 256,
      isPublished,
    };

    try {
      setLoading(true);
      if (problem) {
        await adminService.updateProblem(problem._id, payload);
        toast.success("Problem updated successfully!");
      } else {
        await adminService.createProblem(payload);
        toast.success("Problem created successfully!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save problem."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#14141f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {problem ? "Edit Problem" : "Create New Problem"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Title & Difficulty */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300">
                Problem Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Difficulty *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1c1c28] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Category *
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Arrays, Dynamic Programming"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="array, hash-table, two-pointers"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300">
              Problem Description (Markdown supported) *
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, input format, output format..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Constraints */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                Constraints
              </label>
              <button
                type="button"
                onClick={handleAddConstraint}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Plus size={14} /> Add Constraint
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {constraints.map((constraint, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={constraint}
                    onChange={(e) => handleConstraintChange(idx, e.target.value)}
                    placeholder="e.g. 1 <= nums.length <= 10^5"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  {constraints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveConstraint(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                Examples *
              </label>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Plus size={14} /> Add Example
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">
                      Example {idx + 1}
                    </span>
                    {examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(idx)}
                        className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400">
                        Input *
                      </label>
                      <input
                        type="text"
                        required
                        value={ex.input}
                        onChange={(e) =>
                          handleExampleChange(idx, "input", e.target.value)
                        }
                        placeholder='nums = [2,7,11,15], target = 9'
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400">
                        Output *
                      </label>
                      <input
                        type="text"
                        required
                        value={ex.output}
                        onChange={(e) =>
                          handleExampleChange(idx, "output", e.target.value)
                        }
                        placeholder='[0,1]'
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400">
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={ex.explanation}
                      onChange={(e) =>
                        handleExampleChange(idx, "explanation", e.target.value)
                      }
                      placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Languages */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Supported Programming Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {["javascript", "python", "java", "cpp"].map((lang) => {
                const isSelected = supportedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {lang === "cpp" ? "C++" : lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Starter Code per Language */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Starter Code Template
            </label>
            <div className="flex gap-2 border-b border-white/10 pb-2">
              {["javascript", "python", "java", "cpp"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLangTab(lang)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    activeLangTab === lang
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {lang === "cpp" ? "C++" : lang}
                </button>
              ))}
            </div>
            <textarea
              rows={5}
              value={starterCode[activeLangTab] || ""}
              onChange={(e) =>
                setStarterCode({
                  ...starterCode,
                  [activeLangTab]: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Limits & Publication */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Time Limit (Seconds)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Memory Limit (MB)
              </label>
              <input
                type="number"
                min={16}
                max={1024}
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs font-medium text-zinc-200">
                  Publish problem immediately
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {problem ? "Save Changes" : "Create Problem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProblemFormModal;
