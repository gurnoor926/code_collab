
const CPP_TYPE_MAP = {
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

const getCppType = (type) => {
  const cppType = CPP_TYPE_MAP[type];

  if (!cppType) {
    throw new Error(`Unsupported C++ type: ${type}`);
  }

  return cppType;
};

module.exports = { getCppType };
