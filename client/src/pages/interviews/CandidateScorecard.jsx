
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import evaluationService from "../../services/evaluationService";

const ratingFields = [
  {
    key: "technicalSkills",
    label: "Technical Skills",
    description: "Programming knowledge and technical understanding.",
  },
  {
    key: "problemSolving",
    label: "Problem Solving",
    description: "Ability to analyze and solve problems.",
  },
  {
    key: "communication",
    label: "Communication",
    description: "Clarity in explaining ideas and approaches.",
  },
  {
    key: "codeQuality",
    label: "Code Quality",
    description: "Code readability, structure, and best practices.",
  },
];

const ratingLabels = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const recommendationLabels = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  hold: "Hold",
  no_hire: "No Hire",
};

const cardClass =
  "rounded-xl border border-zinc-800 bg-surface p-5";

function getResponseData(response) {
  return response?.data ?? response;
}

function getRatingColor(value) {
  if (value >= 4) return "text-green-400";
  if (value === 3) return "text-indigo-400";
  return "text-amber-400";
}

function ScoreCard({ label, value, description, icon: Icon }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        {Icon && <Icon size={19} className="text-indigo-400" />}
      </div>

      <p className="mt-3 text-3xl font-bold text-text-primary">
        {Number(value ?? 0).toFixed(2)}
        <span className="ml-1 text-sm font-medium text-text-secondary">
          /100
        </span>
      </p>

      {description && (
        <p className="mt-1 text-xs text-text-secondary">
          {description}
        </p>
      )}
    </div>
  );
}

function RatingCard({ field, value }) {
  const rating = Number(value ?? 0);

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">
            {field.label}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {field.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getRatingColor(rating)}`}>
            {rating}/5
          </span>
          <span className="text-xs text-text-secondary">
            {ratingLabels[rating] || "Not rated"}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-light">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${Math.min(Math.max(rating, 0), 5) * 20}%`,
          }}
        />
      </div>
    </div>
  );
}

function FeedbackCard({ title, items, icon: Icon, color }) {
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={20} className={color} />
        <h2 className="font-bold text-text-primary">{title}</h2>
      </div>

      {Array.isArray(items) && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3">
              <CheckCircle2
                size={17}
                className={`${color} mt-0.5 shrink-0`}
              />
              <span className="text-sm leading-relaxed text-text-secondary">
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">
          No feedback provided.
        </p>
      )}
    </section>
  );
}

export default function CandidateScorecard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [coding, setCoding] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchScorecard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [interviewResponse, evaluationResponse] = await Promise.all([
        interviewService.getInterviewById(id),
        evaluationService.getEvaluation(id),
      ]);

      const interviewData = getResponseData(interviewResponse);

      const evaluationData = getResponseData(evaluationResponse);

      setInterview(
        interviewData?.interview ?? interviewData
      );

      setEvaluation(
        evaluationData?.evaluation ?? (evaluationData?.recommendation || evaluationData?.scores ? evaluationData : null)
      );
      setCoding(evaluationData?.coding ?? null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load your evaluation scorecard.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScorecard();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchScorecard]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !evaluation || evaluation.status !== "submitted") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-surface p-8 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-text-secondary" />

          <h2 className="mt-4 text-xl font-bold text-text-primary">
            Scorecard unavailable
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            {error ||
              "Your evaluation has not been published yet. Please check again later."}
          </p>

          <button
            onClick={() => navigate(`/interviews/${id}`)}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  const overallScore = Number(evaluation.overallScore ?? 0);
  const codingScore = Number(
    coding?.codingScore ?? evaluation.codingScore ?? 0
  );

  const recommendation =
    recommendationLabels[evaluation.recommendation] ||
    "Not provided";

  const problemResults = coding?.problemResults ?? [];

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Back button */}
        <button
          onClick={() => navigate(`/interviews/${id}`)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to Interview
        </button>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
              <ClipboardCheck size={17} />
              Your Interview Results
            </div>

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Candidate Scorecard
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              Review your interview performance and feedback.
            </p>
          </div>

          <span className="flex w-fit items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
            <CheckCircle2 size={16} />
            Evaluation Published
          </span>
        </div>

        {/* Candidate and interview information */}
        <section className={`${cardClass} mb-6`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-indigo-400">
              <UserRound size={23} />
            </div>

            <div>
              <h2 className="font-bold text-text-primary">
                {interview?.candidate?.name || "Candidate"}
              </h2>

              <p className="text-sm text-text-secondary">
                {interview?.title || "Interview"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-text-secondary">
                Interview Status
              </p>
              <p className="mt-1 font-semibold capitalize text-text-primary">
                {interview?.status || "Completed"}
              </p>
            </div>

            <div>
              <p className="text-xs text-text-secondary">
                Recommendation
              </p>
              <p className="mt-1 font-semibold text-indigo-400">
                {recommendation}
              </p>
            </div>
          </div>
        </section>

        {/* Score overview */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Award size={21} className="text-indigo-400" />
            <h2 className="text-lg font-bold">Performance Overview</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreCard
              label="Overall Score"
              value={overallScore}
              description="Your final interview evaluation score"
              icon={Award}
            />

            <ScoreCard
              label="Coding Score"
              value={codingScore}
              description="Based on coding submissions and test cases"
              icon={TrendingUp}
            />
          </div>

          <div className={`${cardClass} mt-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">
                  Overall Performance
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Your final score out of 100
                </p>
              </div>

              <span className="text-2xl font-bold text-indigo-400">
                {overallScore.toFixed(2)}%
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-light">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(Math.max(overallScore, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Coding performance */}
        <section className={`${cardClass} mb-8`}>
          <div className="mb-5 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold">Coding Performance</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-light p-4">
              <p className="text-sm text-text-secondary">Problems</p>
              <p className="mt-1 text-2xl font-bold">
                {coding?.totalProblems ?? interview?.problems?.length ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-surface-light p-4">
              <p className="text-sm text-text-secondary">Evaluated</p>
              <p className="mt-1 text-2xl font-bold">
                {coding?.evaluatedProblems ?? 0}
              </p>
            </div>

            <div className="col-span-2 rounded-xl bg-surface-light p-4 sm:col-span-1">
              <p className="text-sm text-text-secondary">Coding Score</p>
              <p className="mt-1 text-2xl font-bold text-indigo-400">
                {codingScore.toFixed(2)}%
              </p>
            </div>
          </div>

          {problemResults.length > 0 && (
            <div className="mt-5 space-y-3">
              {problemResults.map((result, index) => {
                const problemId =
                  typeof result.problem === "object"
                    ? result.problem?._id
                    : result.problem;

                const problem = interview?.problems?.find(
                  (item) => item._id === problemId
                );

                return (
                  <div
                    key={problemId || index}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-surface-light/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {problem?.title || `Problem ${index + 1}`}
                      </p>

                      <p className="mt-1 text-xs text-text-secondary">
                        {result.passedTestCases ?? 0} /{" "}
                        {result.totalTestCases ?? 0} test cases passed
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        result.status === "Accepted"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {result.status || "Not Submitted"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Individual ratings */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Star size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold">
              Evaluation Breakdown
            </h2>
          </div>

          <div className="space-y-4">
            {ratingFields.map((field) => (
              <RatingCard
                key={field.key}
                field={field}
                value={evaluation[field.key]}
              />
            ))}
          </div>
        </section>

        {/* Feedback */}
        <section className="mb-8 grid gap-5 md:grid-cols-2">
          <FeedbackCard
            title="Your Strengths"
            items={evaluation.strengths}
            icon={CheckCircle2}
            color="text-green-400"
          />

          <FeedbackCard
            title="Areas for Improvement"
            items={evaluation.areasForImprovement}
            icon={TrendingUp}
            color="text-amber-400"
          />
        </section>

        {/* Recommendation */}
        <section className="rounded-2xl border border-primary/40 bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-indigo-400">
              <Award size={23} />
            </div>

            <div>
              <p className="text-sm text-text-secondary">
                Final Interview Recommendation
              </p>
              <h2 className="mt-1 text-xl font-bold text-text-primary">
                {recommendation}
              </h2>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-zinc-800 pt-5 text-sm text-green-400">
            <CheckCircle2 size={18} />
            Your evaluation has been submitted and published.
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-text-secondary">
          This scorecard is read-only. Contact your interviewer if you have
          questions about your evaluation.
        </p>
      </div>
    </div>
  );
}
