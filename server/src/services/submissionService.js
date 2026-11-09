const Submission = require("../models/Submission");
const TestCase = require("../models/TestCase");
const Problem = require("../models/Problem");

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

const buildExecutionCode = ({ language, code, functionName }) => {
  // Preserve existing execution for other languages
  // and JavaScript problems using stdin/stdout.
  if (language !== "javascript" || !functionName) {
    return code;
  }

  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName)) {
    throw new Error("Invalid problem function name");
  }

  return `
console.log = () => {};
console.info = () => {};
console.debug = () => {};

${code}

// CodeCollab JavaScript test harness
(async () => {
    const __input = JSON.parse(
        require("fs").readFileSync(0, "utf8")
    );

    const __args = Array.isArray(__input)
        ? __input
        : Object.values(__input);

    const __result = await ${functionName}(...__args);

    process.stdout.write(
        JSON.stringify(__result) ?? "null"
    );
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
`;
};

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
  functionName = null,
}) => {
  const results = [];

  for (const testCase of testCases) {
    const executionCode = buildExecutionCode({
      language,
      code,
      functionName,
    });

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
      testCase.expectedOutput,
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
  }).select("_id functionName");

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
    functionName: problem.functionName,
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

// save a formal submission and evaluate it

const submitSolution = async ({
  userId,
  problemId,
  language,
  code,
  interviewId = null,
}) => {
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
  }).select("_id functionName");

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
      functionName: problem.functionName,
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
