const { z } = require("zod");

const exampleSchema = z.object({
  input: z.string().trim().min(1, "Example input is required"),
  output: z.string().trim().min(1, "Example output is required"),
  explanation: z.string().max(2000).optional().default(""),
});

const problemSchema = z.object({
  title: z.string().trim().min(3).max(150),

  description: z.string().trim().min(10).max(20000),

  difficulty: z.enum(["Easy", "Medium", "Hard"]),

  category: z.string().trim().min(2).max(50),

  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional().default([]),

  constraints: z
    .array(z.string().trim().min(1).max(500))
    .max(30)
    .optional()
    .default([]),

  examples: z.array(exampleSchema).min(1).max(10),

  starterCode: z
    .record(z.string(), z.string().max(20000))
    .optional()
    .default({}),

  supportedLanguages: z
    .array(z.enum(["javascript", "python", "java", "cpp"]))
    .min(1)
    .max(4)
    .optional()
    .default(["javascript", "python", "java", "cpp"]),

  timeLimit: z.number().int().min(1).max(30).optional().default(2),

  memoryLimit: z.number().int().min(16).max(1024).optional().default(256),

  isPublished: z.boolean().optional().default(false),
});

const updateProblemSchema = problemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required for an update" }
);

module.exports = {
  problemSchema,
  updateProblemSchema,
};