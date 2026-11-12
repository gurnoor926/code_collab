const Submission = require("../models/Submission");
const TestCase = require("../models/TestCase");
const Problem = require("../models/Problem");
const InterviewSession = require("../models/InterviewSession");
const validateExecutionInput = require("../utils/validateExecutionInput");
const {
  buildExecutionCode,
} = require("./executionHarnessService");

const { submitCode, getSubmissionResult } = require("./judge0Service");

const { compareOutput } = require("../utils/outputComparator");

const LANGUAGE_ALLOWEDLIST = new Set(["javascript", "python", "cpp", "java"]);

const TERMINAL_STATUS_IDS = new Set([
  3, //Accepted
  4, // wrong Answer
  5, // Time Limit Exceeded
  6, //compilation error
  7, // Runtime Error (SIGSEGV)
  8, // Runtime Error (SIGXFSZ)
  9, // Runtime Error (SIGFPE)
  10, // Runtime Error (SIGABRT)
  11, // Runtime Error (NZEC)
  12, // Runtime Error (Other)
  13, // Internal Error
  14, // Exec Format Error
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// submit code to judge0 and wait for its terminal result.

const executeAndWait = async ({ language, code, stdin }) => {
  const submission = await submitCode({
    language,
    code,
    stdin,
  });

  if (!submission?.token) {
    throw new Error("Judge0 did not return a submission token");
  }

  const deadline = Date.now() + 60000;

  while (Date.now() < deadline) {
    await sleep(1000);

    const result = await getSubmissionResult(submission.token);

    const statusId = result?.status?.id;

    if (!Number.isInteger(statusId)) {
      throw new Error("Judge0 returned an invalid execution status");
    }

    if (TERMINAL_STATUS_IDS.has(statusId)) {
      return result;
    }

    if (statusId !== 1 && statusId !== 2) {
      throw new Error(
        `Unexpected Judge0 status: ${result?.status?.description || statusId}`,
      );
    }
  }

  throw new Error("Judge0 execution timed out");
};

// run against test cases



const evaluateTestCases = async ({
  language,
  code,
  testCases,
  problem,
}) => {
  const results = [];

  const executionConfig = problem.executionConfig || {};

  for (const testCase of testCases) {
    // Validate input before execution
    const validation = validateExecutionInput({
      input: testCase.input,
      executionConfig,
    });

    if (!validation.valid) {
      results.push({
        testCaseId: testCase._id,
        passed: false,
        status: "Invalid Test Case",
        executionTime: null,
        memoryUsed: null,
        error: testCase.isHidden
          ? "Hidden test case configuration is invalid."
          : validation.error,
        isHidden: testCase.isHidden,
      });

      continue;
    }

    // Generate language-specific function harness
    let executionCode;

    try {
      executionCode =
        executionConfig.mode === "function"
          ? buildExecutionCode({
              language,
              code,
              problem,
            })
          : code;
    } catch (error) {
      throw error;
    }

    // Execute through Judge0
    const execution = await executeAndWait({
      language,
      code: executionCode,
      stdin: testCase.input,
    });

    const statusId = execution.status.id;

    if (statusId !== 3) {
      results.push({
        testCaseId: testCase._id,
        passed: false,
        status:
          statusId === 8
            ? "Memory Limit Exceeded"
            : execution.status.description,
        executionTime: Number(execution.time) || 0,
        memoryUsed: Number(execution.memory) || 0,
        error:
          execution.compile_output ||
          execution.stderr ||
          execution.message ||
          execution.status.description,
        isHidden: testCase.isHidden,
      });

      if (statusId === 6) {
        break;
      }

      continue;
    }

    const passed = compareOutput(
      execution.stdout ?? "",
      testCase.expectedOutput
    );

    results.push({
      testCaseId: testCase._id,
      passed,
      status: passed ? "Passed" : "Wrong Answer",
      executionTime: Number(execution.time) || 0,
      memoryUsed: Number(execution.memory) || 0,
      error: null,
      isHidden: testCase.isHidden,
    });
  }

  return results;
};



// run only public examples , this does not create a formal submission record.

const runExamples = async ({ userId, problemId, language, code }) => {
  if (!LANGUAGE_ALLOWEDLIST.has(language)) {
    const error = new Error("Unsupported programming language");
    error.statusCode = 400;
    throw error;
  }

  const problem = await Problem.findOne({
    _id: problemId,
    isPublished: true,
  }).select("_id executionConfig functionName functionNames");

  if (!problem) {
    const error = new Error("Problem not found or not published");
    error.statusCode = 404;
    throw error;
  }

  const testCases = await TestCase.find({
    problem: problemId,
    isActive: true,
    isHidden: false,
  }).sort({ order: 1 });

  if (testCases.length === 0) {
    const error = new Error("No public test cases are available");
    error.statusCode = 400;
    throw error;
  }

 const results = await evaluateTestCases({
  language,
  code,
  testCases,
  problem,
});

  return {
    problemId,
    totalTestCases: testCases.length,
    passedTestCases: results.filter((result) => result.passed).length,
    results: results.map((result) => ({
      passed: result.passed,
      status: result.status,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      error: result.error,
    })),
  };
};

const validateInterviewSubmission = async ({
  interviewId,
  userId,
  problemId,
}) => {
  const interview = await InterviewSession.findById(interviewId)
    .select("candidate problems status");

  if (!interview) {
    throw new Error("Interview not found.");
  }

  if (
    !interview.candidate ||
    interview.candidate.toString() !== userId.toString()
  ) {
    const error = new Error(
      "You are not authorized to submit code for this interview."
    );
    error.statusCode = 403;
    throw error;
  }

  if (interview.status !== "active") {
    const error = new Error(
      "Code submissions are only allowed during an active interview."
    );
    error.statusCode = 409;
    throw error;
  }

  const isAssignedProblem = interview.problems.some(
    (problem) => problem.toString() === problemId.toString()
  );

  if (!isAssignedProblem) {
    const error = new Error(
      "This problem is not assigned to the interview."
    );
    error.statusCode = 403;
    throw error;
  }

  return interview;
};

// save a formal submission and evaluate it

const submitSolution = async ({
  userId,
  problemId,
  language,
  code,
  interviewId = null,
}) => {
  if (interviewId) {
  await validateInterviewSubmission({
    interviewId,
    userId,
    problemId,
  });
}

  if (!LANGUAGE_ALLOWEDLIST.has(language)) {
    const error = new Error("Unsupported programming language");
    error.statusCode = 400;
    throw error;
  }

  if (
    typeof code !== "string" ||
    !code.trim() ||
    Buffer.byteLength(code, "utf8") > 50000
  ) {
    const error = new Error("Code must be non-empty and no longer than 50 KB");
    error.statusCode = 400;
    throw error;
  }

  const problem = await Problem.findOne({
    _id: problemId,
    isPublished: true,
  }).select("_id executionConfig functionName functionNames");

  if (!problem) {
    const error = new Error("Problem not found or not Published");
    error.statusCode = 404;
    throw error;
  }

  const testCases = await TestCase.find({
    problem: problemId,
    isActive: true,
  }).sort({ order: 1 });

  if (testCases.length === 0) {
    const error = new Error("No active test cases are available");
    error.statusCode = 404;
    throw error;
  }

  const submission = await Submission.create({
    user: userId,
    problem: problemId,
    interview: interviewId,
    language,
    sourceCode: code,
    status: "Running",
    totalTestCases: testCases.length,
    passedTestCases: 0,
  });

  try {
    const results = await evaluateTestCases({
  language,
  code,
  testCases,
  problem,
});

    const passedTestCases = results.filter((result) => result.passed).length;

    const firstExecutionError = results.find(
      (result) => result.status !== "Passed",
    );

    let status = "Accepted";

    if (passedTestCases !== testCases.length) {
      const firstStatus = firstExecutionError?.status;

      if (firstStatus === "Compilation Error") {
        status = "Compilation Error";
      } else if (firstStatus === "Time Limit Exceeded") {
        status = "Time Limit Exceeded";
      } else if (firstStatus === "Memory Limit Exceeded") {
        status = "Memory Limit Exceeded";
      } else if (firstStatus?.startsWith("Runtime Error")) {
        status = "Runtime Error";
      } else if (firstStatus === "Internal Error") {
        status = "Internal Error";
      } else {
        status = "Wrong Answer";
      }
    }

    const totalExecutionTime = results.reduce(
      (sum, result) => sum + (result.executionTime || 0),
      0,
    );

    const maxMemoryUsed = results.reduce(
      (maximum, result) => Math.max(maximum, result.memoryUsed || 0),
      0,
    );

    submission.status = status;
    submission.totalTestCases = testCases.length;
    submission.passedTestCases = passedTestCases;
    submission.executionTime = totalExecutionTime;
    submission.memoryUsed = maxMemoryUsed;
    submission.errorMessage =
      status === "Accepted" ? null : firstExecutionError?.error || status;

    await submission.save();

    return {
      submissionId: submission._id,
      problemId,
      language,
      status,
      totalTestCases: testCases.length,
      passedTestCases,
      executionTime: totalExecutionTime,
      memoryUsed: maxMemoryUsed,
      submittedAt: submission.submittedAt,
      results: results.map((result) => ({
        passed: result.passed,
        status: result.status,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: result.isHidden ? null : result.error,
      })),
    };
  } catch (error) {
    submission.status = "Internal Error";
    submission.errorMessage = "Execution or evaluation failed";

    await submission.save();

    throw error;
  }
};

module.exports = {
  runExamples,
  submitSolution,
};
