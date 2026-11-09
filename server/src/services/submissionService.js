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
  if (!["javascript", "python"].includes(language)) {
    return code;
  }

  if (
    typeof functionName !== "string" ||
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)
  ) {
    throw new Error(
      `A valid function name is required for ${language} problems`
    );
  }

  // JavaScript function harness
  if (language === "javascript") {
    return `
console.log = () => {};
console.info = () => {};
console.debug = () => {};

${code}

(async () => {
    const __input = JSON.parse(
        require("fs").readFileSync(0, "utf8")
    );

    const __args = Array.isArray(__input)
        ? __input
        : Object.values(__input);

    const __result = await ${functionName}(...__args);

    const __serialized = JSON.stringify(__result);

    process.stdout.write(
        typeof __serialized === "undefined"
            ? "null"
            : __serialized
    );
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
`;
  }

  // Python function harness
  if (language === "python") {
    return `
import sys
import json
import contextlib

${code}

__output = sys.stdout

try:
    __input = json.loads(sys.stdin.read())

    if isinstance(__input, dict):
        __args = list(__input.values())
    elif isinstance(__input, list):
        __args = __input
    else:
        raise ValueError("Test input must be a JSON object or array")

    with contextlib.redirect_stdout(sys.stderr):
        __result = ${functionName}(*__args)

    __output.write(
        json.dumps(__result, separators=(",", ":"))
    )

except Exception as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
`;
  }

  if (language === "cpp") {
  return `
#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    string input(
        (istreambuf_iterator<char>(cin)),
        istreambuf_iterator<char>()
    );

    regex numsRegex("\\\\\"nums\\\\\"\\\\s*:\\\\s*\\\\[([^]]*)\\\\]");
    regex targetRegex("\\\\\"target\\\\\"\\\\s*:\\\\s*(-?\\\\d+)");

    smatch numsMatch;
    smatch targetMatch;

    if (!regex_search(input, numsMatch, numsRegex) ||
        !regex_search(input, targetMatch, targetRegex)) {
        cerr << "Invalid test input";
        return 1;
    }

    vector<int> nums;
    string numsString = numsMatch[1].str();

    regex numberRegex("-?\\\\d+");
    auto begin = sregex_iterator(
        numsString.begin(),
        numsString.end(),
        numberRegex
    );

    auto end = sregex_iterator();

    for (auto it = begin; it != end; ++it) {
        nums.push_back(stoi(it->str()));
    }

    int target = stoi(targetMatch[1].str());

    vector<int> result = ${functionName}(nums, target);

    cout << "[";
    for (size_t i = 0; i < result.size(); i++) {
        if (i > 0) cout << ",";
        cout << result[i];
    }
    cout << "]";

    return 0;
}
`;
}

if (language === "java") {
  return `
import java.util.*;
import java.util.regex.*;

${code}

public class Main {
    public static void main(String[] args) {
        try {
            Scanner scanner = new Scanner(System.in);
            StringBuilder inputBuilder = new StringBuilder();

            while (scanner.hasNextLine()) {
                inputBuilder.append(scanner.nextLine());
            }

            String input = inputBuilder.toString();

            Pattern numsPattern = Pattern.compile(
                "\\\\\"nums\\\\\"\\\\s*:\\\\s*\\\\[([^]]*)\\\\]"
            );

            Pattern targetPattern = Pattern.compile(
                "\\\\\"target\\\\\"\\\\s*:\\\\s*(-?\\\\d+)"
            );

            Matcher numsMatcher = numsPattern.matcher(input);
            Matcher targetMatcher = targetPattern.matcher(input);

            if (!numsMatcher.find() || !targetMatcher.find()) {
                throw new IllegalArgumentException("Invalid test input");
            }

            String numsString = numsMatcher.group(1).trim();

            int[] nums;

            if (numsString.isEmpty()) {
                nums = new int[0];
            } else {
                String[] parts = numsString.split(",");
                nums = new int[parts.length];

                for (int i = 0; i < parts.length; i++) {
                    nums[i] = Integer.parseInt(parts[i].trim());
                }
            }

            int target = Integer.parseInt(targetMatcher.group(1));

            Solution solution = new Solution();
            int[] result = solution.${functionName}(nums, target);

            StringBuilder output = new StringBuilder("[");

            for (int i = 0; i < result.length; i++) {
                if (i > 0) output.append(",");
                output.append(result[i]);
            }

            output.append("]");
            System.out.print(output.toString());

        } catch (Exception error) {
            System.err.println(error.getMessage());
            System.exit(1);
        }
    }
}
`;
}

  return code;
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
  }).select("_id functionName functionNames");

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
  const functionName =
  problem.functionNames?.get(language) ||
  (language === "javascript" ? problem.functionName : null);

  const results = await evaluateTestCases({
    language,
    code,
    testCases,
    functionName,
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
  }).select("_id functionName functionNames");

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

  const functionName =
  problem.functionNames?.get(language) ||
  (language === "javascript" ? problem.functionName : null);

  try {
    const results = await evaluateTestCases({
      language,
      code,
      testCases,
      functionName,
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
