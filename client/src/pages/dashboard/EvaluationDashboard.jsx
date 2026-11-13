
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Video,
  Lightbulb,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import evaluationService from "../../services/evaluationService";
import toast from "react-hot-toast";

const recommendationOptions = [
  { value: "all", label: "All recommendations" },
  { value: "strong_hire", label: "Strong Hire" },
  { value: "hire", label: "Hire" },
  { value: "hold", label: "Hold" },
  { value: "no_hire", label: "No Hire" },
];

const recommendationLabels = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  hold: "Hold",
  no_hire: "No Hire",
};

const recommendationStyles = {
  strong_hire: "bg-green-500/10 text-green-400 border-green-500/20",
  hire: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  no_hire: "bg-red-500/10 text-red-400 border-red-500/20",
};

const scoreRanges = [
  { label: "0–20", min: 0, max: 20 },
  { label: "21–40", min: 21, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61–80", min: 61, max: 80 },
  { label: "81–100", min: 81, max: 100 },
];

const performanceCriteria = [
  { key: "codingScore", label: "Coding Score", max: 100 },
  { key: "technicalSkills", label: "Technical Skills", max: 5 },
  { key: "problemSolving", label: "Problem Solving", max: 5 },
  { key: "communication", label: "Communication", max: 5 },
  { key: "codeQuality", label: "Code Quality", max: 5 },
];

function StatCard({ label, value, icon: Icon, color, description }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#18181f] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>

      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function RecommendationBadge({ recommendation }) {
  const style =
    recommendationStyles[recommendation] ||
    "border-zinc-700 bg-zinc-800 text-zinc-300";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {recommendationLabels[recommendation] || "Not specified"}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
      <ClipboardCheck size={25} className="mx-auto text-zinc-600" />

      <p className="mt-3 text-sm font-medium text-zinc-300">{title}</p>

      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description, color = "text-violet-400" }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Icon size={19} className={color} />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>

      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function EvaluationDashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [recommendationFilter, setRecommendationFilter] = useState("all");

  // Date filter state.
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fetch evaluation dashboard data.
  const fetchAnalytics = useCallback(async () => {
    try {
      setError("");

      const response = await evaluationService.getEvaluationDashboard();

      if (response?.success === false || !response?.data) {
        throw new Error(
          response?.message || "Unable to load evaluation analytics."
        );
      }

      setAnalytics(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load evaluation dashboard.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchAnalytics, 0);

    return () => clearTimeout(timer);
  }, [fetchAnalytics]);

  const evaluationStats = analytics || {};

  const submittedEvaluations = useMemo(
    () => evaluationStats.evaluations || [],
    [evaluationStats.evaluations]
  );

  const pendingEvaluations = useMemo(
    () => evaluationStats.pendingInterviews || [],
    [evaluationStats.pendingInterviews]
  );

  // Apply selected date range to submitted evaluations.
  const dateFilteredEvaluations = useMemo(() => {
    const now = new Date();

    let startDate = null;
    let endDate = null;

    if (dateRange === "7") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === "30") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === "90") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
    } else if (dateRange === "custom") {
      if (customStartDate) {
        startDate = new Date(`${customStartDate}T00:00:00`);
      }

      if (customEndDate) {
        endDate = new Date(`${customEndDate}T23:59:59.999`);
      }
    }

    return submittedEvaluations.filter((evaluation) => {
      if (!evaluation.submittedAt) return false;

      const submittedAt = new Date(evaluation.submittedAt);

      if (Number.isNaN(submittedAt.getTime())) return false;

      if (startDate && submittedAt < startDate) return false;
      if (endDate && submittedAt > endDate) return false;

      return true;
    });
  }, [
    submittedEvaluations,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Search and recommendation filtering.
  const filteredEvaluations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dateFilteredEvaluations.filter((evaluation) => {
      const candidateName =
        evaluation.candidate?.name?.toLowerCase() || "";

      const candidateEmail =
        evaluation.candidate?.email?.toLowerCase() || "";

      const interviewTitle =
        evaluation.interview?.title?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        candidateName.includes(query) ||
        candidateEmail.includes(query) ||
        interviewTitle.includes(query);

      const matchesRecommendation =
        recommendationFilter === "all" ||
        evaluation.recommendation === recommendationFilter;

      return matchesSearch && matchesRecommendation;
    });
  }, [dateFilteredEvaluations, search, recommendationFilter]);

  // Average of numeric values.
  const calculateAverage = (evaluations, field) => {
    const values = evaluations
      .map((evaluation) => Number(evaluation[field]))
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) return 0;

    return (
      values.reduce((total, value) => total + value, 0) / values.length
    );
  };

  // Overall average score from filtered evaluations.
  const averageOverallScore = useMemo(
    () => calculateAverage(dateFilteredEvaluations, "overallScore"),
    [dateFilteredEvaluations]
  );

  // Average coding score.
  const averageCodingScore = useMemo(
    () => calculateAverage(dateFilteredEvaluations, "codingScore"),
    [dateFilteredEvaluations]
  );

  // 5.4.1 Score Distribution.
  const scoreDistribution = useMemo(() => {
    return scoreRanges.map((range) => {
      const count = dateFilteredEvaluations.filter((evaluation) => {
        const score = Number(evaluation.overallScore);

        return (
          Number.isFinite(score) &&
          score >= range.min &&
          score <= range.max
        );
      }).length;

      return {
        ...range,
        count,
        percentage:
          dateFilteredEvaluations.length > 0
            ? (count / dateFilteredEvaluations.length) * 100
            : 0,
      };
    });
  }, [dateFilteredEvaluations]);

  const highestScoreCount = Math.max(
    ...scoreDistribution.map((range) => range.count),
    1
  );

  // 5.4.2 Performance Breakdown.
  const performanceBreakdown = useMemo(() => {
    return performanceCriteria.map((criterion) => {
      const average = calculateAverage(
        dateFilteredEvaluations,
        criterion.key
      );

      const percentage =
        criterion.max > 0 ? (average / criterion.max) * 100 : 0;

      return {
        ...criterion,
        average,
        percentage: Math.min(Math.max(percentage, 0), 100),
      };
    });
  }, [dateFilteredEvaluations]);

  // 5.4.3 Recommendation Analytics.
  const recommendationDistribution = useMemo(() => {
    const values = ["strong_hire", "hire", "hold", "no_hire"];

    return values.map((value) => {
      const count = dateFilteredEvaluations.filter(
        (evaluation) => evaluation.recommendation === value
      ).length;

      const total = dateFilteredEvaluations.length;

      return {
        value,
        label: recommendationLabels[value],
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        style: recommendationStyles[value],
      };
    });
  }, [dateFilteredEvaluations]);

  // 5.4.4 Candidate Leaderboard.
  const leaderboard = useMemo(() => {
    return [...dateFilteredEvaluations]
      .filter((evaluation) =>
        Number.isFinite(Number(evaluation.overallScore))
      )
      .sort(
        (a, b) =>
          Number(b.overallScore) - Number(a.overallScore)
      )
      .slice(0, 10);
  }, [dateFilteredEvaluations]);

  // 5.4.5 Performance Insights.
  const insights = useMemo(() => {
    const total = dateFilteredEvaluations.length;

    if (total === 0) return [];

    const strongHireCount = dateFilteredEvaluations.filter(
      (evaluation) => evaluation.recommendation === "strong_hire"
    ).length;

    const hireCount = dateFilteredEvaluations.filter(
      (evaluation) => evaluation.recommendation === "hire"
    ).length;

    const holdCount = dateFilteredEvaluations.filter(
      (evaluation) => evaluation.recommendation === "hold"
    ).length;

    const noHireCount = dateFilteredEvaluations.filter(
      (evaluation) => evaluation.recommendation === "no_hire"
    ).length;

    const topCandidate = [...dateFilteredEvaluations].sort(
      (a, b) => Number(b.overallScore) - Number(a.overallScore)
    )[0];

    const strongestCriterion = [...performanceBreakdown].sort(
      (a, b) => b.percentage - a.percentage
    )[0];

    const weakestCriterion = [...performanceBreakdown].sort(
      (a, b) => a.percentage - b.percentage
    )[0];

    const highScoringCandidates = dateFilteredEvaluations.filter(
      (evaluation) => Number(evaluation.overallScore) >= 80
    ).length;

    const highScorePercentage = (highScoringCandidates / total) * 100;

    return [
      {
        title: "Average Performance",
        description: `The average overall evaluation score is ${averageOverallScore.toFixed(2)}%.`,
        icon: Target,
        color: "text-violet-400",
      },
      {
        title: "Top Candidate",
        description: `${topCandidate?.candidate?.name || "Candidate"} has the highest overall score of ${Number(topCandidate?.overallScore || 0).toFixed(2)}%.`,
        icon: Award,
        color: "text-amber-400",
      },
      {
        title: "Strongest Evaluation Area",
        description: `${strongestCriterion?.label || "Not available"} has the highest normalized average score.`,
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        title: "Area for Improvement",
        description: `${weakestCriterion?.label || "Not available"} has the lowest normalized average score.`,
        icon: Lightbulb,
        color: "text-cyan-400",
      },
      {
        title: "High-Scoring Candidates",
        description: `${highScoringCandidates} of ${total} candidates (${highScorePercentage.toFixed(1)}%) scored 80 or above.`,
        icon: Star,
        color: "text-emerald-400",
      },
      {
        title: "Hiring Recommendations",
        description: `${strongHireCount} Strong Hire, ${hireCount} Hire, ${holdCount} Hold and ${noHireCount} No Hire recommendations.`,
        icon: Users,
        color: "text-indigo-400",
      },
    ];
  }, [
    dateFilteredEvaluations,
    performanceBreakdown,
    averageOverallScore,
  ]);

  // Navigation.
  const openEvaluation = (evaluation) => {
    const interviewId =
      typeof evaluation.interview === "object"
        ? evaluation.interview?._id
        : evaluation.interview;

    if (!interviewId) {
      toast.error("Interview information is unavailable.");
      return;
    }

    navigate(`/interviews/${interviewId}/evaluation`);
  };

  const openPendingEvaluation = (interview) => {
    navigate(`/interviews/${interview._id}/evaluation`);
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "Invalid date";

    return parsedDate.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const resetFilters = () => {
    setSearch("");
    setRecommendationFilter("all");
    setDateRange("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const dateRangeLabel = {
    all: "All time",
    "7": "Last 7 days",
    "30": "Last 30 days",
    "90": "Last 90 days",
    custom: "Custom range",
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Evaluation Dashboard
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Analyze candidate performance, compare evaluations and review scorecards.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#18181f] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-violet-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 5.4.6 Date Range Filter */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={19} className="text-violet-400" />

            <h2 className="font-semibold text-white">
              Analytics Date Range
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <label className="mb-2 block text-xs text-zinc-500">
                Select Period
              </label>

              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="all">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute bottom-3.5 right-3 text-zinc-500"
              />
            </div>

            {dateRange === "custom" && (
              <>
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={customStartDate}
                    max={customEndDate || undefined}
                    onChange={(event) =>
                      setCustomStartDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-zinc-500">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate || undefined}
                    onChange={(event) =>
                      setCustomEndDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#111118] px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <div className="w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                <p className="text-xs text-zinc-500">Active Filter</p>
                <p className="mt-1 text-sm font-semibold text-violet-400">
                  {dateRangeLabel[dateRange]}
                </p>
              </div>
            </div>
          </div>

          {dateRange === "custom" &&
            customStartDate &&
            customEndDate &&
            customStartDate > customEndDate && (
              <p className="mt-3 text-xs text-red-400">
                End date must be on or after the start date.
              </p>
            )}
        </section>

        {/* Overview Statistics */}
        <section>
          <SectionHeading
            icon={BarChart3}
            title="Performance Overview"
            description="Statistics calculated from evaluations in the selected date range."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Completed Interviews"
              value={evaluationStats.totalInterviews ?? 0}
              icon={Video}
              color="bg-violet-500/10 text-violet-400"
            />

            <StatCard
              label="Filtered Evaluations"
              value={loading ? "..." : dateFilteredEvaluations.length}
              icon={CheckCircle2}
              color="bg-green-500/10 text-green-400"
            />

            <StatCard
              label="Average Overall Score"
              value={`${averageOverallScore.toFixed(2)}%`}
              icon={Award}
              color="bg-indigo-500/10 text-indigo-400"
            />

            <StatCard
              label="Average Coding Score"
              value={`${averageCodingScore.toFixed(2)}%`}
              icon={TrendingUp}
              color="bg-cyan-500/10 text-cyan-400"
            />
          </div>
        </section>

        {/* 5.4.1 Score Distribution */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={TrendingUp}
            title="Candidate Score Distribution"
            description="Distribution of candidates according to their overall evaluation scores."
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading score distribution...
            </p>
          ) : dateFilteredEvaluations.length === 0 ? (
            <EmptyState
              title="No score data available"
              description="Score distribution will appear after evaluations are submitted."
            />
          ) : (
            <div className="space-y-6">
              {scoreDistribution.map((range) => (
                <div key={range.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-white">
                        {range.label}
                      </span>

                      <span className="ml-2 text-xs text-zinc-500">
                        points
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">
                        {range.count}
                      </span>

                      <span className="ml-2 text-xs text-zinc-500">
                        ({range.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{
                        width: `${
                          (range.count / highestScoreCount) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5.4.2 Performance Breakdown */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={Target}
            title="Performance Breakdown"
            description="Average performance across all five evaluation criteria."
            color="text-cyan-400"
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading performance breakdown...
            </p>
          ) : dateFilteredEvaluations.length === 0 ? (
            <EmptyState
              title="No performance data"
              description="Performance comparisons will appear after evaluations are submitted."
            />
          ) : (
            <div className="space-y-6">
              {performanceBreakdown.map((item) => (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-300">
                      {item.label}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {item.average.toFixed(2)}
                      <span className="ml-1 text-xs font-normal text-zinc-500">
                        /{item.max}
                      </span>
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5.4.3 Recommendation Analytics */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={Star}
            title="Recommendation Analytics"
            description="Hiring recommendations based on submitted evaluations."
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading recommendations...
            </p>
          ) : dateFilteredEvaluations.length === 0 ? (
            <EmptyState
              title="No recommendation data"
              description="Recommendation statistics will appear after evaluations are submitted."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recommendationDistribution.map((item) => (
                <div
                  key={item.value}
                  className="rounded-xl border border-white/10 bg-[#111118] p-5"
                >
                  <RecommendationBadge recommendation={item.value} />

                  <p className="mt-5 text-3xl font-bold text-white">
                    {item.count}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {item.percentage.toFixed(1)}% of evaluations
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5.4.5 Performance Insights */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={Lightbulb}
            title="Performance Insights"
            description="Automatically generated observations from the filtered evaluation data."
            color="text-amber-400"
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Generating insights...
            </p>
          ) : insights.length === 0 ? (
            <EmptyState
              title="Not enough data for insights"
              description="Submit candidate evaluations to generate performance insights."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {insights.map((insight) => {
                const Icon = insight.icon;

                return (
                  <div
                    key={insight.title}
                    className="rounded-xl border border-white/10 bg-[#111118] p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                      <Icon size={20} className={insight.color} />
                    </div>

                    <h3 className="mt-4 font-semibold text-white">
                      {insight.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5.4.4 Candidate Leaderboard */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={Award}
            title="Candidate Leaderboard"
            description="Top candidates ranked by overall evaluation score."
            color="text-amber-400"
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading leaderboard...
            </p>
          ) : leaderboard.length === 0 ? (
            <EmptyState
              title="No leaderboard data"
              description="Candidate rankings will appear after evaluations are submitted."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-4">Rank</th>
                    <th className="px-4 py-4">Candidate</th>
                    <th className="px-4 py-4">Interview</th>
                    <th className="px-4 py-4">Coding Score</th>
                    <th className="px-4 py-4">Overall Score</th>
                    <th className="px-4 py-4">Recommendation</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaderboard.map((evaluation, index) => (
                    <tr
                      key={evaluation._id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-bold text-violet-400">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-white">
                          {evaluation.candidate?.name || "Candidate"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {evaluation.candidate?.email || "No email"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {evaluation.interview?.title || "Interview"}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {Number(evaluation.codingScore ?? 0).toFixed(2)}%
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-white">
                          {Number(evaluation.overallScore).toFixed(2)}
                        </span>
                        <span className="ml-1 text-xs text-zinc-500">
                          /100
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <RecommendationBadge
                          recommendation={evaluation.recommendation}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openEvaluation(evaluation)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition hover:text-violet-300"
                        >
                          View
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pending Evaluations */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionHeading
                icon={Clock3}
                title="Pending Evaluations"
                description="Completed interviews awaiting your evaluation."
                color="text-amber-400"
              />
            </div>

            <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              {loading ? "Loading..." : `${pendingEvaluations.length} Pending`}
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading pending evaluations...
            </p>
          ) : pendingEvaluations.length === 0 ? (
            <EmptyState
              title="No pending evaluations"
              description="Completed interviews awaiting evaluation will appear here."
            />
          ) : (
            <div className="space-y-3">
              {pendingEvaluations.map((interview) => (
                <div
                  key={interview._id}
                  className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium text-white">
                      {interview.candidate?.name || "Candidate"}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      {interview.title}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {interview.candidate?.email || "No email available"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPendingEvaluation(interview)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Evaluate Candidate
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submitted Evaluations */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <SectionHeading
            icon={CheckCircle2}
            title="Submitted Evaluations"
            description="Search and review previously submitted candidate scorecards."
            color="text-green-400"
          />

          {/* Search and recommendation filters */}
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate or interview..."
                className="w-full rounded-lg border border-white/10 bg-[#111118] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <select
                value={recommendationFilter}
                onChange={(event) =>
                  setRecommendationFilter(event.target.value)
                }
                className="w-full appearance-none rounded-lg border border-white/10 bg-[#111118] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-500"
              >
                {recommendationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-500">
              Showing {filteredEvaluations.length} of{" "}
              {dateFilteredEvaluations.length} evaluations
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
            >
              Reset all filters
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading submitted evaluations...
            </p>
          ) : filteredEvaluations.length === 0 ? (
            <EmptyState
              title={
                dateFilteredEvaluations.length === 0
                  ? "No submitted evaluations"
                  : "No matching evaluations"
              }
              description={
                dateFilteredEvaluations.length === 0
                  ? "Submitted evaluations will appear here."
                  : "Try changing your search or filters."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation._id}
                  className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      {evaluation.candidate?.name || "Candidate"}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      {evaluation.interview?.title || "Interview"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {evaluation.candidate?.email || "No email available"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Submitted: {formatDate(evaluation.submittedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Overall Score</p>

                      <p className="mt-1 text-lg font-bold text-white">
                        {Number(evaluation.overallScore ?? 0).toFixed(2)}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          /100
                        </span>
                      </p>
                    </div>

                    <RecommendationBadge
                      recommendation={evaluation.recommendation}
                    />

                    <button
                      type="button"
                      onClick={() => openEvaluation(evaluation)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-violet-500/40 hover:text-white"
                    >
                      View Evaluation
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default EvaluationDashboard;
