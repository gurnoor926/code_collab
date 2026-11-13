
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  Save,
  Star,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import interviewService from "../../services/interviewService";
import evaluationService from "../../services/evaluationService";
import { useAuth } from "../../hooks/useAuth";

const ratingFields = [
  {
    key: "technicalSkills",
    label: "Technical Skills",
    description: "Knowledge of programming concepts and technologies.",
  },
  {
    key: "problemSolving",
    label: "Problem Solving",
    description: "Ability to understand and solve problems.",
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

const recommendations = [
  { value: "strong_hire", label: "Strong Hire" },
  { value: "hire", label: "Hire" },
  { value: "hold", label: "Hold" },
  { value: "no_hire", label: "No Hire" },
];

const initialRatings = {
  technicalSkills: 3,
  problemSolving: 3,
  communication: 3,
  codeQuality: 3,
};

const cardClass =
  "rounded-xl border border-zinc-800 bg-surface p-5";

const inputClass =
  "w-full resize-y rounded-lg border border-zinc-700 bg-surface-light p-3 text-sm text-text-primary placeholder:text-zinc-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

function getEvaluationData(response) {
  const data = response?.data ?? response;

  return {
    evaluation: data?.evaluation ?? (data?.scores || data?.recommendation ? data : null),
    coding: data?.coding ?? null,
  };
}

function RatingInput({ field, value, onChange, disabled }) {
  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">
            {field.label}
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            {field.description}
          </p>
        </div>

        <span className="w-fit rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-indigo-300">
          {value}/5 · {ratingLabels[value]}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={() => onChange(field.key, rating)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold transition ${
              value === rating
                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                : "border-zinc-700 bg-surface-light text-text-secondary hover:border-primary hover:text-text-primary"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ label, value, description }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-text-secondary">{label}</p>

      <p className="mt-2 text-3xl font-bold text-text-primary">
        {value}
        <span className="ml-1 text-base font-medium text-text-secondary">
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

export default function InterviewEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interview, setInterview] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [coding, setCoding] = useState(null);

  const [ratings, setRatings] = useState(initialRatings);
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [interviewerNotes, setInterviewerNotes] = useState("");
  const [recommendation, setRecommendation] = useState("hire");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isManager = ["admin", "interviewer"].includes(user?.role);
  const isSubmitted = evaluation?.status === "submitted";

  const fetchEvaluationData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [interviewResponse, evaluationResponse] = await Promise.all([
        interviewService.getInterviewById(id),
        evaluationService.getEvaluation(id),
      ]);

      const interviewData =
        interviewResponse?.data?.interview ??
        interviewResponse?.data ??
        interviewResponse?.interview ??
        interviewResponse;

      const {
        evaluation: evaluationData,
        coding: codingData,
      } = getEvaluationData(evaluationResponse);

      setInterview(interviewData);
      setEvaluation(evaluationData);
      setCoding(codingData);

      if (evaluationData) {
        setRatings({
          technicalSkills: evaluationData.technicalSkills ?? 3,
          problemSolving: evaluationData.problemSolving ?? 3,
          communication: evaluationData.communication ?? 3,
          codeQuality: evaluationData.codeQuality ?? 3,
        });

        setStrengths(
          Array.isArray(evaluationData.strengths)
            ? evaluationData.strengths.join("\n")
            : ""
        );

        setAreasForImprovement(
          Array.isArray(evaluationData.areasForImprovement)
            ? evaluationData.areasForImprovement.join("\n")
            : ""
        );

        setInterviewerNotes(evaluationData.interviewerNotes ?? "");
        setRecommendation(evaluationData.recommendation ?? "hire");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load evaluation.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvaluationData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchEvaluationData]);

  const handleRatingChange = (key, value) => {
    setRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const codingScore = Number(
    coding?.codingScore ?? evaluation?.codingScore ?? 0
  );

  const overallScore = useMemo(() => {
    const technical = (ratings.technicalSkills / 5) * 100;
    const problemSolving = (ratings.problemSolving / 5) * 100;
    const communication = (ratings.communication / 5) * 100;
    const codeQuality = (ratings.codeQuality / 5) * 100;

    return Number(
      (
        codingScore * 0.5 +
        technical * 0.2 +
        problemSolving * 0.1 +
        communication * 0.1 +
        codeQuality * 0.1
      ).toFixed(2)
    );
  }, [codingScore, ratings]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isManager) {
      toast.error("You are not authorized to submit this evaluation.");
      return;
    }

    if (interview?.status !== "completed") {
      toast.error("Only completed interviews can be evaluated.");
      return;
    }

    const strengthsList = strengths
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const improvementList = areasForImprovement
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!strengthsList.length) {
      toast.error("Please add at least one candidate strength.");
      return;
    }

    if (!improvementList.length) {
      toast.error("Please add at least one improvement area.");
      return;
    }

    if (strengthsList.length > 20 || improvementList.length > 20) {
      toast.error(
        "You can add a maximum of 20 items in each feedback section."
      );
      return;
    }

    if (
      [...strengthsList, ...improvementList].some(
        (item) => item.length > 500
      )
    ) {
      toast.error(
        "Each feedback item must be 500 characters or less."
      );
      return;
    }

    if (interviewerNotes.length > 5000) {
      toast.error("Interviewer notes cannot exceed 5000 characters.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...ratings,
        strengths: strengthsList,
        areasForImprovement: improvementList,
        interviewerNotes,
        recommendation,
      };

      const response = await evaluationService.submitEvaluation(
        id,
        payload
      );

      const {
        evaluation: submittedEvaluation,
        coding: submittedCoding,
      } = getEvaluationData(response);

      setEvaluation(submittedEvaluation);
      setCoding(submittedCoding);

      toast.success("Candidate evaluation submitted successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit evaluation."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !interview || !evaluation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-surface p-8 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-text-secondary" />

          <h2 className="mt-4 text-xl font-bold text-text-primary">
            Evaluation unavailable
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            {error || "Evaluation information could not be found."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const candidateName = interview.candidate?.name || "Candidate";
  const problemResults = coding?.problemResults ?? [];

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Back navigation */}
        <button
          onClick={() => navigate(`/interviews/${id}`)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to Interview
        </button>

        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
              <ClipboardCheck size={17} />
              Interview Evaluation
            </div>

            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Candidate Scorecard
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              Review coding performance and evaluate the candidate.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              isSubmitted
                ? "bg-green-500/10 text-green-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {isSubmitted ? "Evaluation Submitted" : "Draft Evaluation"}
          </span>
        </div>

        {/* Candidate information */}
        <section className={`${cardClass} mb-6`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-indigo-400">
              <UserRound size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {candidateName}
              </h2>

              <p className="text-sm text-text-secondary">
                {interview.candidate?.email || "Candidate"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-text-secondary">Interview</p>
              <p className="mt-1 font-semibold text-text-primary">
                {interview.title}
              </p>
            </div>

            <div>
              <p className="text-xs text-text-secondary">Interview Status</p>
              <p className="mt-1 font-semibold capitalize text-text-primary">
                {interview.status}
              </p>
            </div>
          </div>
        </section>

        {/* Score overview */}
        <section className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="text-indigo-400" size={21} />

            <h2 className="text-lg font-bold text-text-primary">
              Score Overview
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreCard
              label="Coding Score"
              value={codingScore.toFixed(2)}
              description="Weighted as 50% of the overall score"
            />

            <ScoreCard
              label="Overall Score"
              value={
                isSubmitted
                  ? Number(
                      evaluation.overallScore ?? overallScore
                    ).toFixed(2)
                  : overallScore.toFixed(2)
              }
              description="Calculated using the evaluation criteria"
            />
          </div>
        </section>

        {/* Coding performance */}
        <section className={`${cardClass} mb-6`}>
          <h2 className="text-lg font-bold text-text-primary">
            Coding Performance
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-light p-4">
              <p className="text-sm text-text-secondary">Problems</p>

              <p className="mt-1 text-2xl font-bold text-text-primary">
                {coding?.totalProblems ?? interview.problems?.length ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-surface-light p-4">
              <p className="text-sm text-text-secondary">Evaluated</p>

              <p className="mt-1 text-2xl font-bold text-text-primary">
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

                const problem = interview.problems?.find(
                  (item) => item._id === problemId
                );

                return (
                  <div
                    key={problemId || index}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-surface-light/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">
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

        {/* Evaluation form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Rating criteria */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                Evaluation Criteria
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                Rate each category from 1 (Poor) to 5 (Excellent).
              </p>
            </div>

            <div className="space-y-4">
              {ratingFields.map((field) => (
                <RatingInput
                  key={field.key}
                  field={field}
                  value={ratings[field.key]}
                  onChange={handleRatingChange}
                  disabled={isSubmitted || !isManager}
                />
              ))}
            </div>
          </section>

          {/* Strengths and improvements */}
          <section className="grid gap-5 md:grid-cols-2">
            <div className={cardClass}>
              <label className="font-semibold text-text-primary">
                Candidate Strengths
              </label>

              <p className="mb-3 mt-1 text-xs text-text-secondary">
                Enter one strength per line.
              </p>

              <textarea
                rows={5}
                maxLength={10000}
                disabled={isSubmitted || !isManager}
                value={strengths}
                onChange={(event) => setStrengths(event.target.value)}
                placeholder={
                  "Strong JavaScript fundamentals\nGood debugging skills"
                }
                className={inputClass}
              />
            </div>

            <div className={cardClass}>
              <label className="font-semibold text-text-primary">
                Areas for Improvement
              </label>

              <p className="mb-3 mt-1 text-xs text-text-secondary">
                Enter one improvement area per line.
              </p>

              <textarea
                rows={5}
                maxLength={10000}
                disabled={isSubmitted || !isManager}
                value={areasForImprovement}
                onChange={(event) =>
                  setAreasForImprovement(event.target.value)
                }
                placeholder={
                  "Improve time complexity analysis\nPractice system design"
                }
                className={inputClass}
              />
            </div>
          </section>

          {/* Interviewer notes */}
          <section className={cardClass}>
            <label className="font-semibold text-text-primary">
              Interviewer Notes
            </label>

            <p className="mb-3 mt-1 text-xs text-text-secondary">
              Additional observations about the interview.
            </p>

            <textarea
              rows={5}
              maxLength={5000}
              disabled={isSubmitted || !isManager}
              value={interviewerNotes}
              onChange={(event) =>
                setInterviewerNotes(event.target.value)
              }
              placeholder="Write your interview observations..."
              className={inputClass}
            />

            <p className="mt-1 text-right text-xs text-text-secondary">
              {interviewerNotes.length}/5000
            </p>
          </section>

          {/* Final recommendation */}
          <section className={cardClass}>
            <label className="font-semibold text-text-primary">
              Final Recommendation
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {recommendations.map((item) => (
                <label
                  key={item.value}
                  className={`flex items-center gap-3 rounded-lg border p-4 transition ${
                    recommendation === item.value
                      ? "border-primary bg-primary/10"
                      : "border-zinc-700 bg-surface-light hover:border-zinc-500"
                  } ${
                    isSubmitted || !isManager
                      ? "cursor-not-allowed opacity-80"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="recommendation"
                    value={item.value}
                    checked={recommendation === item.value}
                    disabled={isSubmitted || !isManager}
                    onChange={(event) =>
                      setRecommendation(event.target.value)
                    }
                    className="accent-indigo-500"
                  />

                  <span className="text-sm font-medium text-text-primary">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Final score and submit */}
          <section className="rounded-2xl border border-primary/40 bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <Star size={19} />

                  <h2 className="font-bold text-text-primary">
                    Final Evaluation Score
                  </h2>
                </div>

                <p className="mt-1 text-sm text-text-secondary">
                  Coding 50% · Technical 20% · Other criteria 30%
                </p>
              </div>

              <p className="text-4xl font-bold text-indigo-400">
                {Number(
                  isSubmitted
                    ? evaluation.overallScore ?? overallScore
                    : overallScore
                ).toFixed(2)}

                <span className="ml-1 text-base font-medium text-text-secondary">
                  /100
                </span>
              </p>
            </div>

            {isSubmitted ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm font-medium text-green-400">
                <CheckCircle2 size={19} />
                This evaluation has been submitted and is now read-only.
              </div>
            ) : isManager ? (
              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Submit Final Evaluation
                  </>
                )}
              </button>
            ) : null}
          </section>
        </form>
      </div>
    </div>
  );
}
