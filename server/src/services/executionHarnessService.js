
const getFunctionName = (problem, language) => {
  const functionName = problem.functionNames?.get(language);

  if (functionName) return functionName;

  if (language === "javascript") {
    return problem.functionName;
  }

  return null;
};

const validateFunctionName = (name) => {
  if (
    typeof name !== "string" ||
    !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
  ) {
    throw new Error("Invalid function name configuration");
  }

  return name;
};

const validateArgumentsConfig = (argumentsConfig) => {
  if (!Array.isArray(argumentsConfig)) {
    throw new Error("Invalid function arguments configuration");
  }

  for (const argument of argumentsConfig) {
    if (
      !argument ||
      typeof argument.name !== "string" ||
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(argument.name)
    ) {
      throw new Error("Invalid argument name configuration");
    }
  }
};

// JavaScript harness
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
} else if (__input !== null && typeof __input === "object") {
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
  typeof __serialized === "undefined" ? "null" : __serialized
);
`;
};

// Python harness
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

__stdout.write(json.dumps(__result, separators=(",", ":")))
`;
};

// C++ harness
const buildCppHarness = ({
  code,
  functionName,
  argumentsConfig,
  returnType,
}) => {
  const cppTypes = {
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
  };

  const declarations = argumentsConfig.map((argument, index) => {
    const cppType = cppTypes[argument.type];

    if (!cppType) {
      throw new Error(`Unsupported C++ argument type: ${argument.type}`);
    }

    return `
    ${cppType} __arg${index} =
        convert<${cppType}>(getArgument(__root, ${JSON.stringify(argument.name)}, ${index}));
    `;
  }).join("\n");

  const argumentList = argumentsConfig
    .map((_, index) => `__arg${index}`)
    .join(", ");

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
    throw new Error(`Unsupported C++ return type: ${returnType}`);
  }

  const invocation = returnType === "void"
    ? `${functionName}(${argumentList});\n    cout << "null";`
    : `auto __result = ${functionName}(${argumentList});\n    cout << serialize(__result);`;

  return `
#include <bits/stdc++.h>
using namespace std;

${code}

// ---------------- JSON PARSER ----------------

struct Json {
    enum Type { OBJECT, ARRAY, STRING, NUMBER, BOOLEAN, NIL };

    Type type = NIL;
    map<string, Json> object;
    vector<Json> array;
    string text;
    double number = 0;
    bool boolean = false;
};

class JsonParser {
    string s;
    size_t pos = 0;

    void whitespace() {
        while (pos < s.size() && isspace((unsigned char)s[pos])) {
            pos++;
        }
    }

    char peek() {
        whitespace();
        return pos < s.size() ? s[pos] : '\\0';
    }

    string parseString() {
        if (s[pos++] != '"') throw runtime_error("Expected string");

        string result;

        while (pos < s.size()) {
            char c = s[pos++];

            if (c == '"') return result;

            if (c == '\\\\') {
                if (pos >= s.size()) throw runtime_error("Invalid escape");

                char e = s[pos++];

                switch (e) {
                    case '"': result += '"'; break;
                    case '\\\\': result += '\\\\'; break;
                    case '/': result += '/'; break;
                    case 'b': result += '\\b'; break;
                    case 'f': result += '\\f'; break;
                    case 'n': result += '\\n'; break;
                    case 'r': result += '\\r'; break;
                    case 't': result += '\\t'; break;
                    case 'u': {
                        if (pos + 4 > s.size())
                            throw runtime_error("Invalid unicode escape");

                        unsigned int value = 0;

                        for (int i = 0; i < 4; i++) {
                            char h = s[pos++];
                            value <<= 4;

                            if (h >= '0' && h <= '9') value += h - '0';
                            else if (h >= 'a' && h <= 'f') value += h - 'a' + 10;
                            else if (h >= 'A' && h <= 'F') value += h - 'A' + 10;
                            else throw runtime_error("Invalid unicode escape");
                        }

                        if (value <= 0x7F) {
                            result += (char)value;
                        } else if (value <= 0x7FF) {
                            result += (char)(0xC0 | (value >> 6));
                            result += (char)(0x80 | (value & 0x3F));
                        } else {
                            result += (char)(0xE0 | (value >> 12));
                            result += (char)(0x80 | ((value >> 6) & 0x3F));
                            result += (char)(0x80 | (value & 0x3F));
                        }
                        break;
                    }
                    default: throw runtime_error("Invalid escape");
                }
            } else {
                if ((unsigned char)c < 0x20)
                    throw runtime_error("Invalid control character");

                result += c;
            }
        }

        throw runtime_error("Unterminated string");
    }

    Json parseValue() {
        whitespace();

        char c = peek();
        Json result;

        if (c == '{') {
            result.type = Json::OBJECT;
            pos++;

            if (peek() == '}') {
                pos++;
                return result;
            }

            while (true) {
                whitespace();

                if (peek() != '"')
                    throw runtime_error("Expected object key");

                string key = parseString();

                whitespace();

                if (pos >= s.size() || s[pos++] != ':')
                    throw runtime_error("Expected colon");

                result.object[key] = parseValue();

                whitespace();

                char separator = s[pos++];

                if (separator == '}') break;
                if (separator != ',')
                    throw runtime_error("Expected comma");
            }

            return result;
        }

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

                char separator = s[pos++];

                if (separator == ']') break;
                if (separator != ',')
                    throw runtime_error("Expected comma");
            }

            return result;
        }

        if (c == '"') {
            result.type = Json::STRING;
            result.text = parseString();
            return result;
        }

        if (c == 't' && s.substr(pos, 4) == "true") {
            result.type = Json::BOOLEAN;
            result.boolean = true;
            pos += 4;
            return result;
        }

        if (c == 'f' && s.substr(pos, 5) == "false") {
            result.type = Json::BOOLEAN;
            result.boolean = false;
            pos += 5;
            return result;
        }

        if (c == 'n' && s.substr(pos, 4) == "null") {
            result.type = Json::NIL;
            pos += 4;
            return result;
        }

        if (c == '-' || isdigit((unsigned char)c)) {
            size_t start = pos;

            if (s[pos] == '-') pos++;

            while (pos < s.size() &&
                   (isdigit((unsigned char)s[pos]) || s[pos] == '.' ||
                    s[pos] == 'e' || s[pos] == 'E' ||
                    s[pos] == '+' || s[pos] == '-')) {
                pos++;
            }

            result.type = Json::NUMBER;
            result.text = s.substr(start, pos - start);
            result.number = stod(result.text);
            return result;
        }

        throw runtime_error("Invalid JSON value");
    }

public:
    explicit JsonParser(string input) : s(input) {}

    Json parse() {
        Json result = parseValue();
        whitespace();

        if (pos != s.size())
            throw runtime_error("Unexpected JSON content");

        return result;
    }
};

// ---------------- JSON VALUE ACCESS ----------------

const Json& getArgument(
    const Json& root,
    const string& name,
    size_t index
) {
    if (root.type == Json::ARRAY) {
        if (index >= root.array.size())
            throw runtime_error("Missing positional argument");

        return root.array[index];
    }

    if (root.type == Json::OBJECT) {
        auto it = root.object.find(name);

        if (it == root.object.end())
            throw runtime_error("Missing argument: " + name);

        return it->second;
    }

    throw runtime_error("Input must be a JSON object or array");
}

// ---------------- TYPE CONVERSION ----------------

template<typename T>
T convert(const Json& value) {
    if constexpr (is_same_v<T, int>) {
        if (value.type != Json::NUMBER ||
            floor(value.number) != value.number ||
            value.number < INT_MIN ||
            value.number > INT_MAX) {
            throw runtime_error("Expected integer");
        }
        return (int)value.number;
    }
    else if constexpr (is_same_v<T, double>) {
        if (value.type != Json::NUMBER)
            throw runtime_error("Expected number");
        return value.number;
    }
    else if constexpr (is_same_v<T, string>) {
        if (value.type != Json::STRING)
            throw runtime_error("Expected string");
        return value.text;
    }
    else if constexpr (is_same_v<T, bool>) {
        if (value.type != Json::BOOLEAN)
            throw runtime_error("Expected boolean");
        return value.boolean;
    }
    else if constexpr (
        is_same_v<T, vector<int>> ||
        is_same_v<T, vector<double>> ||
        is_same_v<T, vector<string>> ||
        is_same_v<T, vector<bool>>
    ) {
        if (value.type != Json::ARRAY)
            throw runtime_error("Expected array");

        T result;

        for (const auto& item : value.array) {
            result.push_back(convert<typename T::value_type>(item));
        }

        return result;
    }
    else if constexpr (
        is_same_v<T, vector<vector<int>>> ||
        is_same_v<T, vector<vector<string>>>
    ) {
        if (value.type != Json::ARRAY)
            throw runtime_error("Expected matrix");

        T result;

        for (const auto& row : value.array) {
            result.push_back(
                convert<typename T::value_type>(row)
            );
        }

        return result;
    }
}

// ---------------- JSON SERIALIZATION ----------------

string escapeString(const string& value) {
    string result = "\\"";

    for (char c : value) {
        switch (c) {
            case '"': result += "\\\\\\""; break;
            case '\\\\': result += "\\\\\\\\"; break;
            case '\\n': result += "\\\\n"; break;
            case '\\r': result += "\\\\r"; break;
            case '\\t': result += "\\\\t"; break;
            default: result += c;
        }
    }

    result += "\\"";
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

template<typename T>
string serialize(const vector<T>& values) {
    string result = "[";

    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) result += ",";
        result += serialize(values[i]);
    }

    result += "]";
    return result;
}

template<typename T>
string serialize(const T& value) {
    ostringstream output;
    output << setprecision(15) << value;
    return output.str();
}

// ---------------- MAIN EXECUTION ----------------

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

  const functionName = validateFunctionName(
    getFunctionName(problem, language)
  );

  const argumentsConfig = executionConfig.arguments || [];

  validateArgumentsConfig(argumentsConfig);

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
