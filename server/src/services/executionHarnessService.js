
const getFunctionName = (problem, language) => {
  const functionName = problem.functionNames?.get(language);

  if (functionName) return functionName;

  if (language === "javascript") {
    return problem.functionName;
  }

  return null;
};

// Generate JavaScript function execution harness
const buildJavaScriptHarness = ({
  code,
  functionName,
  argumentsConfig,
}) => {
  const argumentNames = JSON.stringify(
    argumentsConfig.map((argument) => argument.name)
  );

  return `
const fs = require("fs");

${code}

const __input = JSON.parse(fs.readFileSync(0, "utf8"));
const __argumentNames = ${argumentNames};

let __args;

if (Array.isArray(__input)) {
  __args = __input;
} else if (
  __input !== null &&
  typeof __input === "object"
) {
  __args = __argumentNames.map((name) => {
    if (!Object.prototype.hasOwnProperty.call(__input, name)) {
      throw new Error("Missing argument: " + name);
    }

    return __input[name];
  });
} else {
  throw new Error("Input must be a JSON object or array");
}

const __originalLog = console.log;
console.log = (...args) => {
  process.stderr.write(args.join(" ") + "\\n");
};

const __result = ${functionName}(...__args);

console.log = __originalLog;

const __serialized = JSON.stringify(__result);

process.stdout.write(
  typeof __serialized === "undefined" ? "null" : __serialized
);
`;
};

// Generate Python function execution harness
const buildPythonHarness = ({
  code,
  functionName,
  argumentsConfig,
}) => {
  const argumentNames = JSON.stringify(
    argumentsConfig.map((argument) => argument.name)
  );

  return `
import sys
import json
import contextlib

${code}

__input = json.loads(sys.stdin.read())
__argument_names = ${argumentNames}

if isinstance(__input, list):
    __args = __input

elif isinstance(__input, dict):
    __args = []

    for __name in __argument_names:
        if __name not in __input:
            raise ValueError("Missing argument: " + __name)

        __args.append(__input[__name])

else:
    raise ValueError("Input must be a JSON object or array")

__stdout = sys.stdout

with contextlib.redirect_stdout(sys.stderr):
    __result = ${functionName}(*__args)

__stdout.write(
    json.dumps(__result, separators=(",", ":"))
)
`;
};

// Main harness generator
const buildExecutionCode = ({
  language,
  code,
  problem,
}) => {
  if (!problem) {
    throw new Error("Problem configuration is required");
  }

  const executionConfig = problem.executionConfig;

  if (!executionConfig || executionConfig.mode !== "function") {
    throw new Error("Function execution configuration is missing");
  }

  const functionName = getFunctionName(problem, language);

  if (!functionName) {
    throw new Error(
      `Function name is not configured for ${language}`
    );
  }

  if (
    !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName)
  ) {
    throw new Error("Invalid function name configuration");
  }

  const argumentsConfig = executionConfig.arguments || [];

  if (!Array.isArray(argumentsConfig)) {
    throw new Error("Invalid function arguments configuration");
  }

  switch (language) {
    case "javascript":
      return buildJavaScriptHarness({
        code,
        functionName,
        argumentsConfig,
      });

    case "python":
      return buildPythonHarness({
        code,
        functionName,
        argumentsConfig,
      });

    default:
      throw new Error(
        `Generic function execution is not yet supported for ${language}`
      );
  }
};

module.exports = {
  getFunctionName,
  buildExecutionCode,
};
