
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
      throw new Error(`Duplicate argument name: ${argument.name}`);
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
  typeof __serialized === "undefined" ? "null" : __serialized
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
// C++ HARNESS - C++14 COMPATIBLE
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
// JSON VALUE
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
        return pos < s.size() ? s[pos] : '\0';
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
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    case '/': result += '/'; break;
                    case 'b': result += '\b'; break;
                    case 'f': result += '\f'; break;
                    case 'n': result += '\n'; break;
                    case 'r': result += '\r'; break;
                    case 't': result += '\t'; break;

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
                                throw runtime_error("Invalid unicode escape");
                            }
                        }

                        if (value <= 0x7F) {
                            result += static_cast<char>(value);
                        } else if (value <= 0x7FF) {
                            result += static_cast<char>(0xC0 | (value >> 6));
                            result += static_cast<char>(0x80 | (value & 0x3F));
                        } else {
                            result += static_cast<char>(0xE0 | (value >> 12));
                            result += static_cast<char>(0x80 | ((value >> 6) & 0x3F));
                            result += static_cast<char>(0x80 | (value & 0x3F));
                        }

                        break;
                    }

                    default:
                        throw runtime_error("Invalid escape");
                }
            } else {
                if (static_cast<unsigned char>(c) < 0x20) {
                    throw runtime_error("Invalid control character");
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

                if (separator == '}') break;

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

                if (separator == ']') break;

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

        // Boolean
        if (c == 't' && s.compare(pos, 4, "true") == 0) {
            result.type = Json::BOOLEAN;
            result.boolean = true;
            pos += 4;
            return result;
        }

        if (c == 'f' && s.compare(pos, 5, "false") == 0) {
            result.type = Json::BOOLEAN;
            result.boolean = false;
            pos += 5;
            return result;
        }

        // Null
        if (c == 'n' && s.compare(pos, 4, "null") == 0) {
            result.type = Json::NIL;
            pos += 4;
            return result;
        }

        // Number
        if (c == '-' || isdigit(static_cast<unsigned char>(c))) {
            size_t start = pos;

            if (s[pos] == '-') pos++;

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
// GET ARGUMENT
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

    throw runtime_error("Input must be a JSON object or array");
}

// ======================================================
// TYPE CONVERSION - C++14
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
// JSON SERIALIZATION - C++14 COMPATIBLE
// ======================================================

string escapeString(const string& value) {
    string result = "\"";

    for (char c : value) {
        switch (c) {
            case '"': result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\b': result += "\\b"; break;
            case '\f': result += "\\f"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;

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

// Integer serialization
template <typename T>
typename enable_if<
    is_integral<T>::value &&
    !is_same<T, bool>::value,
    string
>::type serialize(T value) {
    return to_string(value);
}

// Floating-point serialization
template <typename T>
typename enable_if<
    is_floating_point<T>::value,
    string
>::type serialize(T value) {
    if (!isfinite(value)) {
        throw runtime_error("Cannot serialize non-finite number");
    }

    ostringstream output;
    output << setprecision(15) << value;

    return output.str();
}

// Vector serialization
template <typename T>
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

// Boolean vector serialization
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

// ======================================================
// MAIN EXECUTION
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


const buildJavaHarness = ({
  code,
  functionName,
  argumentsConfig,
  returnType,
}) => {
  const javaTypes = {
    integer: "int",
    number: "double",
    string: "String",
    boolean: "boolean",
    integer_array: "int[]",
    number_array: "double[]",
    string_array: "String[]",
    boolean_array: "boolean[]",
    integer_matrix: "int[][]",
    string_matrix: "String[][]",
  };

  const argumentNames = `Arrays.asList(${argumentsConfig
  .map((argument) => JSON.stringify(argument.name))
  .join(", ")})`;

  const argumentTypes = argumentsConfig.map((argument) => {
    const type = javaTypes[argument.type];

    if (!type) {
      throw new Error(
        `Unsupported Java argument type: ${argument.type}`
      );
    }

    return type;
  });

  const declarations = argumentTypes
    .map((type, index) => {
      return `
      ${type} __arg${index} =
          (${type}) convert(
              __args.get(${index}),
              "${argumentsConfig[index].type}"
          );
      `;
    })
    .join("\n");

  const invocationArguments = argumentsConfig
    .map((_, index) => `__arg${index}`)
    .join(", ");

  const invocation =
    returnType === "void"
      ? `
      __solution.${functionName}(${invocationArguments});
      System.out.print("null");
      `
      : `
      Object __result =
          __solution.${functionName}(${invocationArguments});

      System.out.print(toJson(__result));
      `;

  return `
import java.util.*;
import java.io.*;

${code}

public class Main {

    // ---------------- JSON PARSER ----------------

    static class JsonParser {
        private final String input;
        private int pos = 0;

        JsonParser(String input) {
            this.input = input;
        }

        void skipWhitespace() {
            while (
                pos < input.length() &&
                Character.isWhitespace(input.charAt(pos))
            ) {
                pos++;
            }
        }

        char peek() {
            skipWhitespace();
            return pos < input.length()
                ? input.charAt(pos)
                : '\\0';
        }

        Object parse() {
            Object value = parseValue();
            skipWhitespace();

            if (pos != input.length()) {
                throw new RuntimeException("Unexpected JSON content");
            }

            return value;
        }

        Object parseValue() {
            skipWhitespace();

            char c = peek();

            if (c == '{') return parseObject();
            if (c == '[') return parseArray();
            if (c == '"') return parseString();

            if (c == 't') {
                pos += 4;
                return true;
            }

            if (c == 'f') {
                pos += 5;
                return false;
            }

            if (c == 'n') {
                pos += 4;
                return null;
            }

            if (c == '-' || Character.isDigit(c)) {
                return parseNumber();
            }

            throw new RuntimeException("Invalid JSON value");
        }

        Map<String, Object> parseObject() {
            Map<String, Object> result = new LinkedHashMap<>();

            pos++;

            if (peek() == '}') {
                pos++;
                return result;
            }

            while (true) {
                String key = parseString();

                skipWhitespace();

                if (input.charAt(pos++) != ':') {
                    throw new RuntimeException("Expected colon");
                }

                result.put(key, parseValue());

                skipWhitespace();

                char separator = input.charAt(pos++);

                if (separator == '}') break;

                if (separator != ',') {
                    throw new RuntimeException("Expected comma");
                }
            }

            return result;
        }

        List<Object> parseArray() {
            List<Object> result = new ArrayList<>();

            pos++;

            if (peek() == ']') {
                pos++;
                return result;
            }

            while (true) {
                result.add(parseValue());

                skipWhitespace();

                char separator = input.charAt(pos++);

                if (separator == ']') break;

                if (separator != ',') {
                    throw new RuntimeException("Expected comma");
                }
            }

            return result;
        }

        String parseString() {
            if (input.charAt(pos++) != '"') {
                throw new RuntimeException("Expected string");
            }

            StringBuilder result = new StringBuilder();

            while (pos < input.length()) {
                char c = input.charAt(pos++);

                if (c == '"') return result.toString();

                if (c == '\\\\') {
                    char escaped = input.charAt(pos++);

                    switch (escaped) {
                        case '"': result.append('"'); break;
                        case '\\\\': result.append('\\\\'); break;
                        case '/': result.append('/'); break;
                        case 'b': result.append('\\b'); break;
                        case 'f': result.append('\\f'); break;
                        case 'n': result.append('\\n'); break;
                        case 'r': result.append('\\r'); break;
                        case 't': result.append('\\t'); break;

                        case 'u':
                            String hex = input.substring(pos, pos + 4);
                            result.append((char) Integer.parseInt(hex, 16));
                            pos += 4;
                            break;

                        default:
                            throw new RuntimeException("Invalid escape");
                    }
                } else {
                    result.append(c);
                }
            }

            throw new RuntimeException("Unterminated string");
        }

        Number parseNumber() {
            int start = pos;

            while (
                pos < input.length() &&
                "-+0123456789.eE".indexOf(input.charAt(pos)) >= 0
            ) {
                pos++;
            }

            String number = input.substring(start, pos);

            return number.contains(".") ||
                   number.contains("e") ||
                   number.contains("E")
                ? Double.parseDouble(number)
                : Long.parseLong(number);
        }
    }

    // ---------------- TYPE CONVERSION ----------------

    static Object convert(Object value, String type) {
        switch (type) {
            case "integer":
                if (!(value instanceof Number)) {
                    throw new RuntimeException("Expected integer");
                }

                long integer = ((Number) value).longValue();

                if (
                    ((Number) value).doubleValue() != integer ||
                    integer < Integer.MIN_VALUE ||
                    integer > Integer.MAX_VALUE
                ) {
                    throw new RuntimeException("Invalid integer");
                }

                return (int) integer;

            case "number":
                if (!(value instanceof Number)) {
                    throw new RuntimeException("Expected number");
                }

                return ((Number) value).doubleValue();

            case "string":
                if (!(value instanceof String)) {
                    throw new RuntimeException("Expected string");
                }

                return value;

            case "boolean":
                if (!(value instanceof Boolean)) {
                    throw new RuntimeException("Expected boolean");
                }

                return value;

            case "integer_array": {
                List<?> list = (List<?>) value;
                int[] result = new int[list.size()];

                for (int i = 0; i < list.size(); i++) {
                    result[i] = (Integer) convert(
                        list.get(i), "integer"
                    );
                }

                return result;
            }

            case "number_array": {
                List<?> list = (List<?>) value;
                double[] result = new double[list.size()];

                for (int i = 0; i < list.size(); i++) {
                    result[i] = (Double) convert(
                        list.get(i), "number"
                    );
                }

                return result;
            }

            case "string_array": {
                List<?> list = (List<?>) value;
                String[] result = new String[list.size()];

                for (int i = 0; i < list.size(); i++) {
                    result[i] = (String) convert(
                        list.get(i), "string"
                    );
                }

                return result;
            }

            case "boolean_array": {
                List<?> list = (List<?>) value;
                boolean[] result = new boolean[list.size()];

                for (int i = 0; i < list.size(); i++) {
                    result[i] = (Boolean) convert(
                        list.get(i), "boolean"
                    );
                }

                return result;
            }

            case "integer_matrix": {
                List<?> rows = (List<?>) value;
                int[][] result = new int[rows.size()][];

                for (int i = 0; i < rows.size(); i++) {
                    result[i] = (int[]) convert(
                        rows.get(i), "integer_array"
                    );
                }

                return result;
            }

            case "string_matrix": {
                List<?> rows = (List<?>) value;
                String[][] result = new String[rows.size()][];

                for (int i = 0; i < rows.size(); i++) {
                    result[i] = (String[]) convert(
                        rows.get(i), "string_array"
                    );
                }

                return result;
            }

            default:
                throw new RuntimeException(
                    "Unsupported type: " + type
                );
        }
    }

    // ---------------- JSON SERIALIZER ----------------

    static String quote(String value) {
        StringBuilder result = new StringBuilder("\\"");

        for (char c : value.toCharArray()) {
            switch (c) {
                case '"': result.append("\\\\\\""); break;
                case '\\\\': result.append("\\\\\\\\"); break;
                case '\\n': result.append("\\\\n"); break;
                case '\\r': result.append("\\\\r"); break;
                case '\\t': result.append("\\\\t"); break;

                default:
                    if (c < 32) {
                        result.append(String.format("\\\\u%04x", (int)c));
                    } else {
                        result.append(c);
                    }
            }
        }

        result.append("\\"");
        return result.toString();
    }

    static String toJson(Object value) {
        if (value == null) return "null";

        if (value instanceof String) {
            return quote((String) value);
        }

        if (value instanceof Boolean || value instanceof Number) {
            return value.toString();
        }

        if (value instanceof int[]) {
            int[] array = (int[]) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < array.length; i++) {
                if (i > 0) result.append(",");
                result.append(array[i]);
            }

            return result.append("]").toString();
        }

        if (value instanceof double[]) {
            double[] array = (double[]) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < array.length; i++) {
                if (i > 0) result.append(",");
                result.append(array[i]);
            }

            return result.append("]").toString();
        }

        if (value instanceof String[]) {
            String[] array = (String[]) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < array.length; i++) {
                if (i > 0) result.append(",");
                result.append(quote(array[i]));
            }

            return result.append("]").toString();
        }

        if (value instanceof boolean[]) {
            boolean[] array = (boolean[]) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < array.length; i++) {
                if (i > 0) result.append(",");
                result.append(array[i]);
            }

            return result.append("]").toString();
        }

        if (value instanceof int[][]) {
            return arrayToJson((int[][]) value);
        }

        if (value instanceof String[][]) {
            return arrayToJson((String[][]) value);
        }

        if (value instanceof List<?>) {
            List<?> list = (List<?>) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < list.size(); i++) {
                if (i > 0) result.append(",");
                result.append(toJson(list.get(i)));
            }

            return result.append("]").toString();
        }

        throw new RuntimeException("Unsupported return value");
    }

    static String arrayToJson(int[][] values) {
        StringBuilder result = new StringBuilder("[");

        for (int i = 0; i < values.length; i++) {
            if (i > 0) result.append(",");
            result.append(toJson(values[i]));
        }

        return result.append("]").toString();
    }

    static String arrayToJson(String[][] values) {
        StringBuilder result = new StringBuilder("[");

        for (int i = 0; i < values.length; i++) {
            if (i > 0) result.append(",");
            result.append(toJson(values[i]));
        }

        return result.append("]").toString();
    }

    // ---------------- MAIN ----------------

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(System.in)
        );

        StringBuilder input = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            input.append(line);
        }

        Object parsed = new JsonParser(input.toString()).parse();

        List<Object> __args = new ArrayList<>();
        List<String> __argumentNames =
            ${argumentNames};

        if (parsed instanceof List<?>) {
            __args.addAll((List<?>) parsed);

        } else if (parsed instanceof Map<?, ?>) {
            Map<?, ?> object = (Map<?, ?>) parsed;

            for (String name : __argumentNames) {
                if (!object.containsKey(name)) {
                    throw new RuntimeException(
                        "Missing argument: " + name
                    );
                }

                __args.add(object.get(name));
            }

        } else {
            throw new RuntimeException(
                "Input must be a JSON object or array"
            );
        }

        if (__args.size() != ${argumentsConfig.length}) {
            throw new RuntimeException("Invalid argument count");
        }

        ${declarations}

        Solution __solution = new Solution();

        ${invocation}
    }
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
    throw new Error("Function execution configuration is missing");
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
    case "java":
  return buildJavaHarness({
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
