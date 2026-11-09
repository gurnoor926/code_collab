
const getFunctionName = (problem, language) => {
  const functionName = problem.functionNames?.get(language);

  if (functionName) return functionName;

  if (language === "javascript") {
    return problem.functionName;
  }

  return null;
};

const validateFunctionName = (name, language) => {
  const patterns = {
    javascript: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    python: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    cpp: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    java: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
  };

  if (
    typeof name !== "string" ||
    !patterns[language]?.test(name)
  ) {
    throw new Error(
      `Invalid function name configuration for ${language}`
    );
  }

  return name;
};

const validateArgumentsConfig = (argumentsConfig) => {
  if (!Array.isArray(argumentsConfig)) {
    throw new Error("Invalid function arguments configuration");
  }

  const names = new Set();

  for (const argument of argumentsConfig) {
    if (
      !argument ||
      typeof argument.name !== "string" ||
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(argument.name)
    ) {
      throw new Error("Invalid argument name configuration");
    }

    if (names.has(argument.name)) {
      throw new Error(
        `Duplicate argument name: ${argument.name}`
      );
    }

    names.add(argument.name);
  }
};

// ======================================================
// JAVASCRIPT HARNESS
// ======================================================

const buildJavaScriptHarness = ({
  code,
  functionName,
  argumentsConfig,
  returnType,
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

const __result = ${functionName}(...__args);
const __serialized = JSON.stringify(__result);

process.stdout.write(
  typeof __serialized === "undefined"
    ? "null"
    : __serialized
);
`;
};

// ======================================================
// PYTHON HARNESS
// ======================================================

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

// ======================================================
// C++ HARNESS
// C++14 compatible - no external JSON libraries
// ======================================================

const buildCppHarness = ({
  code,
  functionName,
  argumentsConfig,
  returnType,
}) => {
  const cppConverters = {
    integer: {
      type: "int",
      converter: "convert",
    },
    number: {
      type: "double",
      converter: "convertDouble",
    },
    string: {
      type: "string",
      converter: "convertString",
    },
    boolean: {
      type: "bool",
      converter: "convertBool",
    },
    integer_array: {
      type: "vector<int>",
      converter: "convertIntArray",
    },
    number_array: {
      type: "vector<double>",
      converter: "convertDoubleArray",
    },
    string_array: {
      type: "vector<string>",
      converter: "convertStringArray",
    },
    boolean_array: {
      type: "vector<bool>",
      converter: "convertBoolArray",
    },
    integer_matrix: {
      type: "vector<vector<int>>",
      converter: "convertIntMatrix",
    },
    string_matrix: {
      type: "vector<vector<string>>",
      converter: "convertStringMatrix",
    },
  };

  const cppReturnTypes = {
    integer: "int",
    number: "double",
    string: "string",
    boolean: "bool",
    integer_array: "vector<int>",
    number_array: "vector<double>",
    string_array: "vector<string>",
    boolean_array: "vector<bool>",
    integer_matrix: "vector<vector<int>>",
    string_matrix: "vector<vector<string>>",
    void: "void",
  };

  if (!cppReturnTypes[returnType]) {
    throw new Error(
      `Unsupported C++ return type: ${returnType}`
    );
  }

  const declarations = argumentsConfig
    .map((argument, index) => {
      const mapping = cppConverters[argument.type];

      if (!mapping) {
        throw new Error(
          `Unsupported C++ argument type: ${argument.type}`
        );
      }

      return `
    ${mapping.type} __arg${index} =
        ${mapping.converter}(
            getArgument(
                __root,
                ${JSON.stringify(argument.name)},
                ${index}
            )
        );
`;
    })
    .join("\n");

  const argumentList = argumentsConfig
    .map((_, index) => `__arg${index}`)
    .join(", ");

  const invocation =
    returnType === "void"
      ? `
        ${functionName}(${argumentList});
        cout << "null";
`
      : `
        auto __result = ${functionName}(${argumentList});
        cout << serialize(__result);
`;

  return String.raw`
#include <bits/stdc++.h>
using namespace std;

// ======================================================
// CANDIDATE FUNCTION
// ======================================================

${code}

// ======================================================
// JSON VALUE STRUCTURE
// ======================================================

struct Json {
    enum Type {
        OBJECT,
        ARRAY,
        STRING,
        NUMBER,
        BOOLEAN,
        NIL
    };

    Type type = NIL;

    map<string, Json> object;
    vector<Json> array;

    string text;
    double number = 0;
    bool boolean = false;
};

// ======================================================
// JSON PARSER
// ======================================================

class JsonParser {
private:
    string s;
    size_t pos = 0;

    void whitespace() {
        while (
            pos < s.size() &&
            isspace(static_cast<unsigned char>(s[pos]))
        ) {
            pos++;
        }
    }

    char peek() {
        whitespace();

        if (pos >= s.size()) {
            return '\0';
        }

        return s[pos];
    }

    string parseString() {
        if (pos >= s.size() || s[pos] != '"') {
            throw runtime_error("Expected string");
        }

        pos++;

        string result;

        while (pos < s.size()) {
            char c = s[pos++];

            if (c == '"') {
                return result;
            }

            if (c == '\\') {
                if (pos >= s.size()) {
                    throw runtime_error("Invalid escape");
                }

                char e = s[pos++];

                switch (e) {
                    case '"':
                        result += '"';
                        break;

                    case '\\':
                        result += '\\';
                        break;

                    case '/':
                        result += '/';
                        break;

                    case 'b':
                        result += '\b';
                        break;

                    case 'f':
                        result += '\f';
                        break;

                    case 'n':
                        result += '\n';
                        break;

                    case 'r':
                        result += '\r';
                        break;

                    case 't':
                        result += '\t';
                        break;

                    case 'u': {
                        if (pos + 4 > s.size()) {
                            throw runtime_error("Invalid unicode escape");
                        }

                        unsigned int value = 0;

                        for (int i = 0; i < 4; i++) {
                            char h = s[pos++];

                            value <<= 4;

                            if (h >= '0' && h <= '9') {
                                value += h - '0';
                            } else if (h >= 'a' && h <= 'f') {
                                value += h - 'a' + 10;
                            } else if (h >= 'A' && h <= 'F') {
                                value += h - 'A' + 10;
                            } else {
                                throw runtime_error(
                                    "Invalid unicode escape"
                                );
                            }
                        }

                        if (value <= 0x7F) {
                            result += static_cast<char>(value);
                        } else if (value <= 0x7FF) {
                            result += static_cast<char>(
                                0xC0 | (value >> 6)
                            );

                            result += static_cast<char>(
                                0x80 | (value & 0x3F)
                            );
                        } else {
                            result += static_cast<char>(
                                0xE0 | (value >> 12)
                            );

                            result += static_cast<char>(
                                0x80 | ((value >> 6) & 0x3F)
                            );

                            result += static_cast<char>(
                                0x80 | (value & 0x3F)
                            );
                        }

                        break;
                    }

                    default:
                        throw runtime_error("Invalid escape");
                }
            } else {
                if (static_cast<unsigned char>(c) < 0x20) {
                    throw runtime_error(
                        "Invalid control character"
                    );
                }

                result += c;
            }
        }

        throw runtime_error("Unterminated string");
    }

    Json parseValue() {
        whitespace();

        char c = peek();

        Json result;

        // Object
        if (c == '{') {
            result.type = Json::OBJECT;

            pos++;

            if (peek() == '}') {
                pos++;
                return result;
            }

            while (true) {
                whitespace();

                if (peek() != '"') {
                    throw runtime_error("Expected object key");
                }

                string key = parseString();

                whitespace();

                if (pos >= s.size() || s[pos++] != ':') {
                    throw runtime_error("Expected colon");
                }

                result.object[key] = parseValue();

                whitespace();

                if (pos >= s.size()) {
                    throw runtime_error("Unterminated object");
                }

                char separator = s[pos++];

                if (separator == '}') {
                    break;
                }

                if (separator != ',') {
                    throw runtime_error("Expected comma");
                }
            }

            return result;
        }

        // Array
        if (c == '[') {
            result.type = Json::ARRAY;

            pos++;

            if (peek() == ']') {
                pos++;
                return result;
            }

            while (true) {
                result.array.push_back(parseValue());

                whitespace();

                if (pos >= s.size()) {
                    throw runtime_error("Unterminated array");
                }

                char separator = s[pos++];

                if (separator == ']') {
                    break;
                }

                if (separator != ',') {
                    throw runtime_error("Expected comma");
                }
            }

            return result;
        }

        // String
        if (c == '"') {
            result.type = Json::STRING;
            result.text = parseString();

            return result;
        }

        // Boolean true
        if (
            c == 't' &&
            s.compare(pos, 4, "true") == 0
        ) {
            result.type = Json::BOOLEAN;
            result.boolean = true;

            pos += 4;

            return result;
        }

        // Boolean false
        if (
            c == 'f' &&
            s.compare(pos, 5, "false") == 0
        ) {
            result.type = Json::BOOLEAN;
            result.boolean = false;

            pos += 5;

            return result;
        }

        // Null
        if (
            c == 'n' &&
            s.compare(pos, 4, "null") == 0
        ) {
            result.type = Json::NIL;

            pos += 4;

            return result;
        }

        // Number
        if (c == '-' || isdigit(static_cast<unsigned char>(c))) {
            size_t start = pos;

            if (s[pos] == '-') {
                pos++;
            }

            while (
                pos < s.size() &&
                isdigit(static_cast<unsigned char>(s[pos]))
            ) {
                pos++;
            }

            if (pos < s.size() && s[pos] == '.') {
                pos++;

                while (
                    pos < s.size() &&
                    isdigit(static_cast<unsigned char>(s[pos]))
                ) {
                    pos++;
                }
            }

            if (
                pos < s.size() &&
                (s[pos] == 'e' || s[pos] == 'E')
            ) {
                pos++;

                if (
                    pos < s.size() &&
                    (s[pos] == '+' || s[pos] == '-')
                ) {
                    pos++;
                }

                while (
                    pos < s.size() &&
                    isdigit(static_cast<unsigned char>(s[pos]))
                ) {
                    pos++;
                }
            }

            result.type = Json::NUMBER;
            result.text = s.substr(start, pos - start);

            size_t parsed = 0;

            try {
                result.number = stod(result.text, &parsed);
            } catch (...) {
                throw runtime_error("Invalid number");
            }

            if (parsed != result.text.size()) {
                throw runtime_error("Invalid number");
            }

            return result;
        }

        throw runtime_error("Invalid JSON value");
    }

public:
    explicit JsonParser(const string& input) : s(input) {}

    Json parse() {
        Json result = parseValue();

        whitespace();

        if (pos != s.size()) {
            throw runtime_error("Unexpected JSON content");
        }

        return result;
    }
};

// ======================================================
// GET ARGUMENT FROM JSON
// ======================================================

const Json& getArgument(
    const Json& root,
    const string& name,
    size_t index
) {
    if (root.type == Json::ARRAY) {
        if (index >= root.array.size()) {
            throw runtime_error("Missing positional argument");
        }

        return root.array[index];
    }

    if (root.type == Json::OBJECT) {
        map<string, Json>::const_iterator it =
            root.object.find(name);

        if (it == root.object.end()) {
            throw runtime_error("Missing argument: " + name);
        }

        return it->second;
    }

    throw runtime_error(
        "Input must be a JSON object or array"
    );
}

// ======================================================
// TYPE CONVERSION
// C++14 compatible overloads
// ======================================================

int convert(const Json& value) {
    if (
        value.type != Json::NUMBER ||
        floor(value.number) != value.number ||
        value.number < INT_MIN ||
        value.number > INT_MAX
    ) {
        throw runtime_error("Expected integer");
    }

    return static_cast<int>(value.number);
}

double convertDouble(const Json& value) {
    if (value.type != Json::NUMBER) {
        throw runtime_error("Expected number");
    }

    return value.number;
}

string convertString(const Json& value) {
    if (value.type != Json::STRING) {
        throw runtime_error("Expected string");
    }

    return value.text;
}

bool convertBool(const Json& value) {
    if (value.type != Json::BOOLEAN) {
        throw runtime_error("Expected boolean");
    }

    return value.boolean;
}

vector<int> convertIntArray(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected integer array");
    }

    vector<int> result;

    for (const auto& item : value.array) {
        result.push_back(convert(item));
    }

    return result;
}

vector<double> convertDoubleArray(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected number array");
    }

    vector<double> result;

    for (const auto& item : value.array) {
        result.push_back(convertDouble(item));
    }

    return result;
}

vector<string> convertStringArray(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected string array");
    }

    vector<string> result;

    for (const auto& item : value.array) {
        result.push_back(convertString(item));
    }

    return result;
}

vector<bool> convertBoolArray(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected boolean array");
    }

    vector<bool> result;

    for (const auto& item : value.array) {
        result.push_back(convertBool(item));
    }

    return result;
}

vector<vector<int>> convertIntMatrix(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected integer matrix");
    }

    vector<vector<int>> result;

    for (const auto& row : value.array) {
        result.push_back(convertIntArray(row));
    }

    return result;
}

vector<vector<string>> convertStringMatrix(const Json& value) {
    if (value.type != Json::ARRAY) {
        throw runtime_error("Expected string matrix");
    }

    vector<vector<string>> result;

    for (const auto& row : value.array) {
        result.push_back(convertStringArray(row));
    }

    return result;
}

// ======================================================
// JSON SERIALIZATION
// ======================================================

string escapeString(const string& value) {
    string result = "\"";

    for (char c : value) {
        switch (c) {
            case '"':
                result += "\\\"";
                break;

            case '\\':
                result += "\\\\";
                break;

            case '\b':
                result += "\\b";
                break;

            case '\f':
                result += "\\f";
                break;

            case '\n':
                result += "\\n";
                break;

            case '\r':
                result += "\\r";
                break;

            case '\t':
                result += "\\t";
                break;

            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    const char* hex = "0123456789abcdef";

                    result += "\\u00";
                    result += hex[(c >> 4) & 0x0F];
                    result += hex[c & 0x0F];
                } else {
                    result += c;
                }
        }
    }

    result += "\"";

    return result;
}

string serialize(const string& value) {
    return escapeString(value);
}

string serialize(const char* value) {
    return escapeString(value);
}

string serialize(bool value) {
    return value ? "true" : "false";
}

string serialize(double value) {
    if (!isfinite(value)) {
        throw runtime_error("Cannot serialize non-finite number");
    }

    ostringstream output;

    output << setprecision(15) << value;

    return output.str();
}

string serialize(float value) {
    if (!isfinite(value)) {
        throw runtime_error("Cannot serialize non-finite number");
    }

    ostringstream output;

    output << setprecision(7) << value;

    return output.str();
}

template<typename T>
string serialize(const vector<T>& values) {
    string result = "[";

    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            result += ",";
        }

        result += serialize(values[i]);
    }

    result += "]";

    return result;
}

string serialize(const vector<bool>& values) {
    string result = "[";

    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) {
            result += ",";
        }

        result += values[i] ? "true" : "false";
    }

    result += "]";

    return result;
}

template<typename T>
string serialize(const T& value) {
    ostringstream output;

    output << value;

    return output.str();
}

// ======================================================
// MAIN
// ======================================================

int main() {
    try {
        string input(
            (istreambuf_iterator<char>(cin)),
            istreambuf_iterator<char>()
        );

        JsonParser parser(input);

        Json __root = parser.parse();

        ${declarations}

        ${invocation}

    } catch (const exception& error) {
        cerr << error.what() << endl;
        return 1;
    }

    return 0;
}
`;
};

// ======================================================
// MAIN EXECUTION CODE GENERATOR
// ======================================================

const buildExecutionCode = ({
  language,
  code,
  problem,
}) => {
  if (!problem) {
    throw new Error("Problem configuration is required");
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Source code is required");
  }

  const executionConfig = problem.executionConfig;

  if (
    !executionConfig ||
    executionConfig.mode !== "function"
  ) {
    throw new Error(
      "Function execution configuration is missing"
    );
  }

  const functionName = validateFunctionName(
    getFunctionName(problem, language),
    language
  );

  const argumentsConfig = executionConfig.arguments || [];

  validateArgumentsConfig(argumentsConfig);

  switch (language) {
    case "javascript":
      return buildJavaScriptHarness({
        code,
        functionName,
        argumentsConfig,
        returnType: executionConfig.returnType,
      });

    case "python":
      return buildPythonHarness({
        code,
        functionName,
        argumentsConfig,
      });

    case "cpp":
      return buildCppHarness({
        code,
        functionName,
        argumentsConfig,
        returnType: executionConfig.returnType,
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
