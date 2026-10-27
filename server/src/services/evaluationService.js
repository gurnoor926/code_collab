const mongoose = require("mongoose");

const InterviewSession = require("../models/InterviewSession");
const InterviewEvaluation = require("../models/InterviewEvaluation");
const Submission = require("../models/Submission");

//Calculate the coding score for an interview candidate.
const calculateCodingScore = async (interview) => {
    if(!interview.candidate) {
        const error = new Error(
            "A candidate must join the interview before evaluation",
        );
        error.statusCode = 409;
        throw error; 
    }

    const problemIds = (interview.problems || []).map((problem) => 
    problem._id ? problem._id : problem,
    );

    if(problemIds.length === 0){
        return {
            codingScore:0,
            totalProblems : 0,
            evaluatedProblems : 0,
            problemResults : [],
        };
    }

    // Retrive each problem's latest submission for this interview.
    const latestSubmission = await Submission.aggregate([
        {
            $match:{
                interview: interview._id,
                user: interview.candidate,
                problem : {$in: problemIds},
            },
        },
        {
            $sort : {
                submittedAt : -1,
                _id : -1,
            },
        },
        {
            $group :{
                _id : "$problem",
                submission : {$first : "$$ROOT"},
            },
        },
        {
            $replaceRoot : {
                newRoot : "$submission",
            },
        },
    ]);

    const submissionByProblem = new Map(
        latestSubmission.map((submission) =>[
            submission.problem.toString(),
            submission,
        ]),
    );

    const problemResults = problemIds.map((problemId) => {
        const id = problemId.toString();
        const submission = submissionByProblem.get(id);

        if(!submission || submission.status === "Pending" ||
            submission.status === "Running"
        ){
            return {
                problem : id,
                submitted : Boolean(submission),
                status : submission?.status || "Not submitted",
                totalTestCases : submission?.totalTestCases || 0,
                passedTestCases : submission?.passedTestCases || 0,
                score : 0,
            };
        }

        const total = Math.max(0,submission.totalTestCases || 0);
        const passed = Math.max(
            0,
            Math.min(total,submission.passedTestCases || 0),
        );

        const score = submission.status === "Accepted"
        ? 100
        : total > 0
          ? (passed/total) * 100
          : 0;

        return {
            problem :id,
            submitted :true,
            status : submission.status,
            totalTestCases : total,
            passedTestCases : passed,
            score : Math.round(score *100) / 100,
        };
    });

    const codingScore = 
      problemResults.length > 0
      ? problemResults.reduce((sum,result) => sum + result.score,0)/
        problemResults.length
      : 0;

    return {
        codingScore : Math.round(codingScore * 100) / 100,
        totalProblems : problemIds.length,
        evaluatedProblems : problemResults.filter(
            (result) => result.submitted &&
             result.status !== "Pending" &&
             result.status !== "Running",
        ).length,
        problemResults,
    };
};

//calculate the overall interview score
const calculateOverallScore = ({
    codingScore,
    technicalSkills,
    problemSolving,
    communication,
    codeQuality,
}) => {
    const ratings = [
        technicalSkills,
        problemSolving,
        communication,
        codeQuality,
    ];

    if(
        ratings.some(
            (rating) => !Number.isFinite(rating) || rating < 1 || rating > 5
        )
    ){
        return null;
    }

    const overallScore = 
      codingScore * 0.5 + 
      (technicalSkills/5) * 100 * 0.2 +
      (problemSolving/5) * 100 * 0.1 +
      (codeQuality/5) * 100 * 0.05;

    return Math.round(overallScore * 100) / 100;
};

// create or retrieve a draft evalualtion
// Create or retrieve an evaluation without duplicating records.
const getOrCreateEvaluation = async (interviewId) => {
  if (!mongoose.isValidObjectId(interviewId)) {
    const error = new Error("Invalid interview ID");
    error.statusCode = 400;
    throw error;
  }

  const interview = await InterviewSession.findById(interviewId);

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  if (!interview.candidate) {
    const error = new Error(
      "A candidate must join the interview before evaluation",
    );
    error.statusCode = 409;
    throw error;
  }

  // First, retrieve an existing evaluation.
  let evaluation = await InterviewEvaluation.findOne({
    interview: interview._id,
  });

  // Create a draft only when no evaluation exists.
  if (!evaluation) {
    const coding = await calculateCodingScore(interview);

    try {
      evaluation = await InterviewEvaluation.create({
        interview: interview._id,
        candidate: interview.candidate,
        interviewer: interview.interviewer,
        codingScore: coding.codingScore,
        status: "draft",
      });
    } catch (error) {
      // Another request may have created the evaluation simultaneously.
      if (error.code !== 11000) {
        throw error;
      }

      evaluation = await InterviewEvaluation.findOne({
        interview: interview._id,
      });

      if (!evaluation) {
        throw error;
      }
    }
  }

  // Refresh coding score only while the evaluation is still a draft.
  let coding;

  if (evaluation.status === "draft") {
    coding = await calculateCodingScore(interview);

    evaluation.codingScore = coding.codingScore;
    await evaluation.save();
  } else {
    // A submitted evaluation must retain its original score.
    coding = {
      codingScore: evaluation.codingScore,
      totalProblems: (interview.problems || []).length,
      evaluatedProblems: null,
      problemResults: [],
    };
  }

  return {
    evaluation,
    coding,
  };
};
module.exports = {
    calculateCodingScore,
    calculateOverallScore,
    getOrCreateEvaluation,
};