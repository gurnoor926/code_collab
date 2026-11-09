
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Code2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BookOpen,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import problemService from "../../services/problemService";

const PAGE_SIZE = 9;

const difficultyStyles = {
  Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

function ProblemLibrary() {
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProblems = async () => {
      try {
        const response = await problemService.getProblems({
          page: pagination.page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          difficulty: difficulty || undefined,
          category: category.trim() || undefined,
        });

        if (!active) return;

        setProblems(response.data ?? []);
        setPagination((current) => ({
          ...current,
          ...(response.pagination ?? {}),
        }));
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            "Unable to load problems. Please try again."
        );
        setProblems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProblems();

    return () => {
      active = false;
    };
  }, [pagination.page, search, difficulty, category]);

  const updateSearch = (value) => {
    setLoading(true);
    setPagination((current) => ({ ...current, page: 1 }));
    setSearch(value);
  };

  const updateDifficulty = (value) => {
    setLoading(true);
    setPagination((current) => ({ ...current, page: 1 }));
    setDifficulty(value);
  };

  const updateCategory = (value) => {
    setLoading(true);
    setPagination((current) => ({ ...current, page: 1 }));
    setCategory(value);
  };

  const changePage = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }

    setLoading(true);
    setPagination((current) => ({ ...current, page: nextPage }));
  };

  const resetFilters = () => {
    setLoading(true);
    setSearch("");
    setDifficulty("");
    setCategory("");
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const hasFilters = search || difficulty || category;

  return (
    <AppLayout>
      <div className="space-y-7">

        {/* Page Heading */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-400">
              <BookOpen size={16} />
              CODING PRACTICE
            </div>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Problem Library
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Explore coding challenges and sharpen your problem-solving skills.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#18181f] px-4 py-3">
            <Code2 size={19} className="text-indigo-400" />
            <div>
              <p className="text-lg font-bold text-white">
                {pagination.total}
              </p>
              <p className="text-xs text-zinc-500">Available problems</p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-white/10 bg-[#18181f] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={17} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              Find a problem
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search problems..."
                className="h-11 w-full rounded-lg border border-white/10 bg-[#101017] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={(event) => updateDifficulty(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-[#101017] px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
            >
              <option value="">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Category */}
            <input
              type="text"
              value={category}
              onChange={(event) => updateCategory(event.target.value)}
              placeholder="Filter by category..."
              className="h-11 rounded-lg border border-white/10 bg-[#101017] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </div>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-2 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                <RefreshCw size={13} />
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Results Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">All Problems</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages || 1}
            </p>
          </div>

          {loading && (
            <span className="flex items-center gap-2 text-xs text-zinc-400">
              <LoaderCircle size={15} className="animate-spin" />
              Loading
            </span>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <AlertCircle size={25} className="mx-auto text-red-400" />

            <p className="mt-3 text-sm font-medium text-white">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-zinc-400">{error}</p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                // Retry with the current filters and page.
                setPagination((current) => ({
                  ...current,
                  page: current.page === 1 ? 2 : 1,
                }));
                setPagination((current) => ({
                  ...current,
                  page: 1,
                }));
              }}
              className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Try again
            </button>
          </div>
        )}

        {/* Problem Cards */}
        {!error && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {problems.map((problem) => (
                <article
                  key={problem._id}
                  className="group flex flex-col rounded-xl border border-white/10 bg-[#18181f] p-5 transition hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-[#1c1c26]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Code2 size={20} />
                    </span>

                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                        difficultyStyles[problem.difficulty] ||
                        "border-white/10 bg-white/5 text-zinc-400"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-semibold text-white transition group-hover:text-indigo-300">
                    {problem.title}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    {problem.category}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(problem.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="text-xs text-zinc-500">
                      {(problem.supportedLanguages ?? []).length} languages
                    </span>

                    <Link
                      to={`/problems/${problem._id}`}
                      className="flex items-center gap-2 text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
                    >
                      Solve problem
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Empty State */}
            {!loading && problems.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#18181f] px-5 py-14 text-center">
                <BookOpen size={30} className="mx-auto text-zinc-600" />

                <h3 className="mt-4 font-semibold text-white">
                  No problems found
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Try changing your search or filter criteria.
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!error && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.07] pt-6">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => changePage(pagination.page - 1)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-zinc-400">
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                pagination.page >= pagination.totalPages || loading
              }
              onClick={() => changePage(pagination.page + 1)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ProblemLibrary;
