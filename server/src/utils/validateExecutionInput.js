const TYPE_VALIDATORS = {
  integer: (value) =>
    Number.isInteger(value),

  number: (value) =>
    typeof value === "number" && Number.isFinite(value),

  string: (value) =>
    typeof value === "string",

  boolean: (value) =>
    typeof value === "boolean",

  integer_array: (value) =>
    Array.isArray(value) &&
    value.every(Number.isInteger),

  number_array: (value) =>
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "number" && Number.isFinite(item)
    ),

  string_array: (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string"),

  boolean_array: (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "boolean"),

  integer_matrix: (value) =>
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.every(Number.isInteger)
    ),

  string_matrix: (value) =>
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) &&
        row.every((item) => typeof item === "string")
    ),
};

const validateExecutionInput = ({ input, executionConfig }) => {
  if (!executionConfig || executionConfig.mode !== "function") {
    return { valid: true };
  }

  let parsedInput;

  try {
    parsedInput = JSON.parse(input);
  } catch {
    return {
      valid: false,
      error: "Test case input must contain valid JSON.",
    };
  }

  const argumentsConfig = executionConfig.arguments || [];

  const values = Array.isArray(parsedInput)
    ? parsedInput
    : parsedInput && typeof parsedInput === "object"
      ? parsedInput
      : null;

  if (!values) {
    return {
      valid: false,
      error: "Test case input must be a JSON object or array.",
    };
  }

  if (Array.isArray(values)) {
    if (values.length !== argumentsConfig.length) {
      return {
        valid: false,
        error: `Expected ${argumentsConfig.length} arguments but received ${values.length}.`,
      };
    }
  }

  const args = argumentsConfig.map((argument, index) => {
    if (Array.isArray(values)) {
      return values[index];
    }

    if (!Object.prototype.hasOwnProperty.call(values, argument.name)) {
      return undefined;
    }

    return values[argument.name];
  });

  for (let index = 0; index < argumentsConfig.length; index++) {
    const argument = argumentsConfig[index];
    const value = args[index];
    const validator = TYPE_VALIDATORS[argument.type];

    if (!validator) {
      return {
        valid: false,
        error: `Unsupported argument type: ${argument.type}`,
      };
    }

    if (value === undefined || !validator(value)) {
      return {
        valid: false,
        error: `Invalid value for argument "${argument.name}". Expected ${argument.type}.`,
      };
    }
  }

  return {
    valid: true,
    args,
  };
};

module.exports = validateExecutionInput;