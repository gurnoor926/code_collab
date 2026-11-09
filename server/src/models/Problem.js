
const mongoose = require("mongoose");

// Problem example schema
const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },

    output: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Execution argument schema
const executionArgumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "integer",
        "number",
        "string",
        "boolean",
        "integer_array",
        "number_array",
        "string_array",
        "boolean_array",
        "integer_matrix",
        "string_matrix",
      ],
    },
  },
  { _id: false }
);

// Execution configuration schema
const executionConfigSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["function", "stdin"],
      default: "stdin",
    },

    arguments: {
      type: [executionArgumentSchema],
      default: [],
    },

    returnType: {
      type: String,
      enum: [
        "integer",
        "number",
        "string",
        "boolean",
        "integer_array",
        "number_array",
        "string_array",
        "boolean_array",
        "integer_matrix",
        "string_matrix",
        "void",
      ],
      default: "void",
    },
  },
  { _id: false }
);

// Main Problem schema
const problemSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    constraints: {
      type: [String],
      required: true,
    },

    // Problem examples
    examples: {
      type: [exampleSchema],
      validate: {
        validator: (examples) => examples.length > 0,
        message: "At least one example is required",
      },
    },

    // Execution configuration
    executionConfig: {
      type: executionConfigSchema,
      default: () => ({
        mode: "stdin",
        arguments: [],
        returnType: "void",
      }),
    },

    // Default function name (backward compatibility)
    functionName: {
      type: String,
      trim: true,
      match: [
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
        "Invalid function name",
      ],
      default: null,
    },

    // Language-specific function names
    functionNames: {
      type: Map,
      of: String,
      default: {},
    },

    // Starter code for each language
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },

    // Supported programming languages
    supportedLanguages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp"],
    },

    // Execution limits
    timeLimit: {
      type: Number,
      default: 2,
      min: 1,
    },

    memoryLimit: {
      type: Number,
      default: 256,
      min: 16,
    },

    // Publishing
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Problem creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
problemSchema.index({
  title: "text",
  description: "text",
});

problemSchema.index({
  difficulty: 1,
  category: 1,
  isPublished: 1,
});

// Export model
module.exports = mongoose.model("Problem", problemSchema);
