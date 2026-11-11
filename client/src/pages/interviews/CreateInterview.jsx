import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Code2,
  Plus,
  Search,
  Trash2,
  Video,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import problemService from "../../services/problemService";
import interviewService from "../../services/interviewService";
import InterviewInvitation from "../../components/interviews/InterviewInvitation";

import toast from "react-hot-toast";

const getProblemList = (response) => {
  // Support common response shapes without changing the API.
  if (Array.isArray(response?.data?.problems)) {
    return response.data.problems;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.problems)) {
    return response.problems;
  }

  if (Array.isArray(response?.data?.data?.problems)) {
    return response.data.data.problems;
  }

  return [];
};

const getDifficultyStyle = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-green-500/10 text-green-400 border-green-500/20";

    case "medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

    case "hard":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

function CreateInterview() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: 60,
  });

  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [loadingProblems, setLoadingProblems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [createdInterview, setCreatedInterview] = useState(null);

  // Load available problems.
  const fetchProblems = useCallback(async () => {
    try {
      setLoadingProblems(true);

      const response = await problemService.getProblems();

      const problemList = getProblemList(response);

      setProblems(problemList);
    } catch (error) {
      console.error("Problem loading error:", error);

      toast.error(
        error.response?.data?.message || "Unable to load coding problems.",
      );
    } finally {
      setLoadingProblems(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchProblems]);

  // Handle form inputs.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "durationMinutes" ? Number(value) : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // Filter problems locally.
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch =
        problem.title?.toLowerCase().includes(search.toLowerCase()) ||
        problem.tags?.some((tag) =>
          String(tag).toLowerCase().includes(search.toLowerCase()),
        );

      const matchesDifficulty =
        difficultyFilter === "all" ||
        problem.difficulty?.toLowerCase() === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [problems, search, difficultyFilter]);

  // Add or remove a problem.
  const toggleProblem = (problem) => {
    const problemId = problem._id;

    if (!problemId) {
      toast.error("This problem does not have a valid ID.");
      return;
    }

    const alreadySelected = selectedProblems.some(
      (item) => item._id === problemId,
    );

    if (alreadySelected) {
      setSelectedProblems((previous) =>
        previous.filter((item) => item._id !== problemId),
      );

      return;
    }

    if (selectedProblems.length >= 20) {
      toast.error("You can select a maximum of 20 problems.");
      return;
    }

    setSelectedProblems((previous) => [...previous, problem]);
  };

  // Remove a selected problem.
  const removeProblem = (problemId) => {
    setSelectedProblems((previous) =>
      previous.filter((problem) => problem._id !== problemId),
    );
  };

  // Validate form.
  const validateForm = () => {
    const newErrors = {};

    const title = formData.title.trim();
    const description = formData.description.trim();

    if (title.length < 3) {
      newErrors.title = "Title must contain at least 3 characters.";
    }

    if (title.length > 150) {
      newErrors.title = "Title cannot exceed 150 characters.";
    }

    if (description.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters.";
    }

    if (
      !Number.isInteger(formData.durationMinutes) ||
      formData.durationMinutes < 1 ||
      formData.durationMinutes > 480
    ) {
      newErrors.durationMinutes = "Duration must be between 1 and 480 minutes.";
    }

    if (selectedProblems.length > 20) {
      newErrors.problems = "Maximum 20 problems are allowed.";
    }

    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt);

      if (Number.isNaN(scheduledDate.getTime())) {
        newErrors.scheduledAt = "Please select a valid date and time.";
      } else if (scheduledDate <= new Date()) {
        newErrors.scheduledAt = "Interview must be scheduled in the future.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit interview.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        problemIds: selectedProblems.map((problem) => problem._id),
        scheduledAt: formData.scheduledAt
          ? new Date(formData.scheduledAt).toISOString()
          : null,
        durationMinutes: formData.durationMinutes,
      };

      const response = await interviewService.createInterview(payload);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to create interview.");
      }

      if (!response?.data?.roomCode) {
        throw new Error("Interview created, but room code was not returned.");
      }

      setCreatedInterview(response.data);

      toast.success("Interview created successfully!");
    } catch (error) {
      console.error("Create interview error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create interview.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Video size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Create Interview
                </h1>

                <p className="mt-1 text-sm text-zinc-400">
                  Configure a new technical interview session.
                </p>
              </div>
            </div>
          </div>
        </div>
        {createdInterview && (
          <InterviewInvitation
            interview={createdInterview}
            onCreateAnother={() => {
              setCreatedInterview(null);
              setSelectedProblems([]);
              setFormData({
                title: "",
                description: "",
                scheduledAt: "",
                durationMinutes: 60,
              });
              setErrors({});
            }}
          />
        )}

        {!createdInterview && (
  <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="rounded-2xl border border-white/10 bg-[#18181f] p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Interview Information
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Provide the basic details for your interview.
              </p>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Interview Title <span className="text-red-400">*</span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength={150}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Frontend Developer Technical Interview"
                  className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500"
                />

                <div className="mt-1 flex justify-between">
                  {errors.title ? (
                    <p className="text-xs text-red-400">{errors.title}</p>
                  ) : (
                    <span />
                  )}

                  <span className="text-xs text-zinc-600">
                    {formData.title.length}/150
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  maxLength={2000}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the interview objectives, topics and expectations..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500"
                />

                <div className="mt-1 flex justify-between">
                  {errors.description ? (
                    <p className="text-xs text-red-400">{errors.description}</p>
                  ) : (
                    <span />
                  )}

                  <span className="text-xs text-zinc-600">
                    {formData.description.length}/2000
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Schedule and Duration */}
          <section className="rounded-2xl border border-white/10 bg-[#18181f] p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Schedule & Duration
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Set the interview date and expected duration.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Date */}
              <div>
                <label
                  htmlFor="scheduledAt"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
                >
                  <CalendarDays size={16} className="text-violet-400" />
                  Interview Date & Time
                  <span className="text-xs text-zinc-600">(Optional)</span>
                </label>

                <input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-violet-500"
                />

                {errors.scheduledAt && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.scheduledAt}
                  </p>
                )}

                <p className="mt-2 text-xs text-zinc-500">
                  Leave empty if you don't want to schedule it yet.
                </p>
              </div>

              {/* Duration */}
              <div>
                <label
                  htmlFor="durationMinutes"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
                >
                  <Clock3 size={16} className="text-violet-400" />
                  Duration
                </label>

                <select
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                  <option value={180}>180 minutes</option>
                  <option value={240}>240 minutes</option>
                  <option value={480}>480 minutes</option>
                </select>

                {errors.durationMinutes && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.durationMinutes}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Problem Selection */}
          <section className="rounded-2xl border border-white/10 bg-[#18181f] p-5 sm:p-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Code2 size={19} className="text-violet-400" />
                  Coding Problems
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Select problems for this interview. This is optional.
                </p>
              </div>

              <span className="w-fit rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                {selectedProblems.length}/20 selected
              </span>
            </div>

            {/* Selected Problems */}
            {selectedProblems.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Selected Problems
                </p>

                {selectedProblems.map((problem) => (
                  <div
                    key={problem._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {problem.title}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-[10px] capitalize ${getDifficultyStyle(problem.difficulty)}`}
                      >
                        {problem.difficulty || "Unknown"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProblem(problem._id)}
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Remove ${problem.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search and Filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search coding problems..."
                  className="w-full rounded-xl border border-white/10 bg-[#101016] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Problem List */}
            {loadingProblems ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 py-12">
                <Loader2 size={25} className="animate-spin text-violet-400" />

                <p className="mt-3 text-sm text-zinc-400">
                  Loading problems...
                </p>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
                <Code2 size={28} className="mx-auto text-zinc-600" />

                <p className="mt-3 text-sm font-medium text-zinc-300">
                  No problems found
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Try changing your search or difficulty filter.
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {filteredProblems.map((problem) => {
                  const selected = selectedProblems.some(
                    (item) => item._id === problem._id,
                  );

                  return (
                    <div
                      key={problem._id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-violet-500/30 bg-violet-500/5"
                          : "border-white/5 bg-[#101016] hover:border-white/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {problem.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] capitalize ${getDifficultyStyle(problem.difficulty)}`}
                          >
                            {problem.difficulty || "Unknown"}
                          </span>

                          {problem.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!selected && selectedProblems.length >= 20}
                        onClick={() => toggleProblem(problem)}
                        className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected
                            ? "bg-violet-500/10 text-violet-300"
                            : "bg-white/5 text-zinc-300 hover:bg-violet-500/10 hover:text-violet-300"
                        }`}
                      >
                        {selected ? (
                          <>
                            <CheckCircle2 size={15} />
                            Selected
                          </>
                        ) : (
                          <>
                            <Plus size={15} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {errors.problems && (
              <p className="mt-3 text-xs text-red-400">{errors.problems}</p>
            )}
          </section>

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/interviews")}
              disabled={submitting}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating Interview...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Interview
                </>
              )}
            </button>
          </div>
        </form>)}
      </div>
    </AppLayout>
  );
}

export default CreateInterview;
