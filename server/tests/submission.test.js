const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Mock submission service to avoid real Judge0 API calls
jest.mock("../src/services/submissionService", () => ({
  runExamples: jest.fn(),
  submitSolution: jest.fn(),
}));

const {
  runExamples,
  submitSolution,
} = require("../src/services/submissionService");

const User = require("../src/models/User");
const Problem = require("../src/models/Problem");
const TestCase = require("../src/models/TestCase");
const Submission = require("../src/models/Submission");

let mongoServer;
let app;

let candidate;
let anotherCandidate;
let problem;
let anotherProblem;

let candidateToken;
let anotherCandidateToken;

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "5d",
    },
  );
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  app = require("../src/app");
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Problem.deleteMany({}),
    TestCase.deleteMany({}),
    Submission.deleteMany({}),
  ]);

  jest.clearAllMocks();

  // Create users
  candidate = await User.create({
    name: "Candidate One",
    email: "candidate1@test.com",
    passwordHash: "TestPassword@123",
    role: "candidate",
  });

  anotherCandidate = await User.create({
    name: "Candidate Two",
    email: "candidate2@test.com",
    passwordHash: "TestPassword@123",
    role: "candidate",
  });

  candidateToken = generateToken(candidate);
  anotherCandidateToken = generateToken(anotherCandidate);

  // Create published problem
  problem = await Problem.create({
    title: "Two Sum",
    slug: "two-sum",
    description: "Find two numbers whose sum equals the target.",
    difficulty: "Easy",
    category: "Arrays",
    constraints: ["2 <= nums.length <= 100"],
    examples: [
      {
        input: "[2,7,11,15], 9",
        output: "[0,1]",
      },
    ],
    createdBy: candidate._id,
    isPublished: true,
  });

  // Create another published problem
  anotherProblem = await Problem.create({
    title: "Reverse String",
    slug: "reverse-string",
    description: "Reverse a given string.",
    difficulty: "Easy",
    category: "Strings",
    constraints: ["1 <= s.length <= 100"],
    examples: [
      {
        input: "hello",
        output: "olleh",
      },
    ],
    createdBy: candidate._id,
    isPublished: true,
  });

  // Create test cases
  await TestCase.create([
    {
      problem: problem._id,
      input: "2 7",
      expectedOutput: "9",
      isHidden: false,
      order: 1,
    },
    {
      problem: problem._id,
      input: "5 5",
      expectedOutput: "10",
      isHidden: true,
      order: 2,
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

describe("Submission API Tests", () => {
  // -----------------------------------------
  // POST /api/submissions/submit
  // -----------------------------------------

  describe("POST /api/submissions/submit", () => {
    test("should reject submission without authentication", async () => {
      const response = await request(app).post("/api/submissions/submit").send({
        problemId: problem._id.toString(),
        language: "javascript",
        code: "console.log('Hello');",
      });

      expect(response.status).toBe(401);
    });

    test("should reject invalid problem ID", async () => {
      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: "invalid-id",
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid problem ID");

      expect(submitSolution).not.toHaveBeenCalled();
    });

    test("should reject invalid interview ID", async () => {
      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          interviewId: "invalid-id",
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid interview ID");

      expect(submitSolution).not.toHaveBeenCalled();
    });

    test("should successfully submit code", async () => {
      submitSolution.mockResolvedValue({
        submissionId: new mongoose.Types.ObjectId(),
        problemId: problem._id,
        language: "javascript",
        status: "Accepted",
        totalTestCases: 2,
        passedTestCases: 2,
        executionTime: 0.05,
        memoryUsed: 1024,
        submittedAt: new Date(),
        results: [],
      });

      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("Accepted");

      expect(submitSolution).toHaveBeenCalledWith({
        userId: candidate._id.toString(),
        problemId: problem._id.toString(),
        language: "javascript",
        code: "console.log('Hello');",
        interviewId: null,
      });
    });

    test("should return service validation errors", async () => {
      const error = new Error("Unsupported programming language");
      error.statusCode = 400;

      submitSolution.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "ruby",
          code: "puts 'Hello'",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unsupported programming language");
    });

    test("should return 404 when problem is not found", async () => {
      const error = new Error("Problem not found or not Published");
      error.statusCode = 404;

      submitSolution.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Problem not found or not Published");
    });

    test("should return 500 when submission service fails unexpectedly", async () => {
      submitSolution.mockRejectedValue(
        new Error("Unexpected execution failure"),
      );

      const response = await request(app)
        .post("/api/submissions/submit")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Failed to evaluate submission");
    });
  });

  // -----------------------------------------
  // POST /api/submissions/run
  // -----------------------------------------

  describe("POST /api/submissions/run", () => {
    test("should reject unauthenticated requests", async () => {
      const response = await request(app).post("/api/submissions/run").send({
        problemId: problem._id.toString(),
        language: "javascript",
        code: "console.log('Hello');",
      });

      expect(response.status).toBe(401);
    });

    test("should successfully run example test cases", async () => {
      runExamples.mockResolvedValue({
        problemId: problem._id,
        totalTestCases: 1,
        passedTestCases: 1,
        results: [
          {
            passed: true,
            status: "Passed",
            executionTime: 0.05,
            memoryUsed: 1024,
            error: null,
          },
        ],
      });

      const response = await request(app)
        .post("/api/submissions/run")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTestCases).toBe(1);
      expect(response.body.data.passedTestCases).toBe(1);

      expect(runExamples).toHaveBeenCalledWith({
        userId: candidate._id.toString(),
        problemId: problem._id.toString(),
        language: "javascript",
        code: "console.log('Hello');",
      });
    });

    test("should reject invalid problem ID", async () => {
      const response = await request(app)
        .post("/api/submissions/run")
        .set(authHeader(candidateToken))
        .send({
          problemId: "invalid-id",
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(400);
      expect(runExamples).not.toHaveBeenCalled();
    });

    test("should return 404 when problem is not published", async () => {
      const error = new Error("Problem not found or not published");
      error.statusCode = 404;

      runExamples.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/submissions/run")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test("should return 400 when no public test cases are available", async () => {
      const error = new Error("No public test cases are avilable");
      error.statusCode = 400;

      runExamples.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/submissions/run")
        .set(authHeader(candidateToken))
        .send({
          problemId: problem._id.toString(),
          language: "javascript",
          code: "console.log('Hello');",
        });

      expect(response.status).toBe(400);
    });
  });

  // -----------------------------------------
  // GET /api/submissions/my
  // -----------------------------------------

  describe("GET /api/submissions/my", () => {
    beforeEach(async () => {
      await Submission.create([
        {
          user: candidate._id,
          problem: problem._id,
          language: "javascript",
          sourceCode: "console.log(9);",
          status: "Accepted",
          totalTestCases: 2,
          passedTestCases: 2,
        },
        {
          user: candidate._id,
          problem: anotherProblem._id,
          language: "python",
          sourceCode: "print('hello')",
          status: "Wrong Answer",
          totalTestCases: 2,
          passedTestCases: 1,
        },
        {
          user: anotherCandidate._id,
          problem: problem._id,
          language: "javascript",
          sourceCode: "console.log(10);",
          status: "Accepted",
        },
      ]);
    });

    test("should retrieve only the logged-in user's submissions", async () => {
      const response = await request(app)
        .get("/api/submissions/my")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.submissions).toHaveLength(2);

      expect(
        response.body.data.submissions.every(
          (submission) =>
            submission.user.toString() === candidate._id.toString(),
        ),
      ).toBe(true);
    });

    test("should return pagination information", async () => {
      const response = await request(app)
        .get("/api/submissions/my?page=1&limit=1")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(200);

      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      });

      expect(response.body.data.submissions).toHaveLength(1);
    });

    test("should filter submissions by problem ID", async () => {
      const response = await request(app)
        .get(`/api/submissions/my?problemId=${problem._id}`)
        .set(authHeader(candidateToken));

      expect(response.status).toBe(200);
      expect(response.body.data.submissions).toHaveLength(1);

      expect(response.body.data.submissions[0].problem._id.toString()).toBe(
        problem._id.toString(),
      );
    });

    test("should reject invalid pagination parameters", async () => {
      const response = await request(app)
        .get("/api/submissions/my?page=0&limit=10")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid pagination parameters");
    });

    test("should reject invalid problem ID filter", async () => {
      const response = await request(app)
        .get("/api/submissions/my?problemId=invalid")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid problem ID");
    });

    test("should not expose source code in submission history", async () => {
      const response = await request(app)
        .get("/api/submissions/my")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(200);

      response.body.data.submissions.forEach((submission) => {
        expect(submission.sourceCode).toBeUndefined();
        expect(submission.errorMessage).toBeUndefined();
      });
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/api/submissions/my");

      expect(response.status).toBe(401);
    });
  });

  // -----------------------------------------
  // GET /api/submissions/:id
  // -----------------------------------------

  describe("GET /api/submissions/:id", () => {
    let submission;

    beforeEach(async () => {
      submission = await Submission.create({
        user: candidate._id,
        problem: problem._id,
        language: "javascript",
        sourceCode: "console.log(9);",
        status: "Accepted",
        totalTestCases: 2,
        passedTestCases: 2,
        executionTime: 0.05,
        memoryUsed: 1024,
      });
    });

    test("should retrieve a submission by ID", async () => {
      const response = await request(app)
        .get(`/api/submissions/${submission._id}`)
        .set(authHeader(candidateToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data._id).toBe(submission._id.toString());

      expect(response.body.data.sourceCode).toBe("console.log(9);");

      expect(response.body.data.status).toBe("Accepted");
    });

    test("should reject invalid submission ID", async () => {
      const response = await request(app)
        .get("/api/submissions/invalid-id")
        .set(authHeader(candidateToken));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid submission ID");
    });

    test("should prevent users from accessing another user's submission", async () => {
      const response = await request(app)
        .get(`/api/submissions/${submission._id}`)
        .set(authHeader(anotherCandidateToken));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Submission not found");
    });

    test("should return 404 for nonexistent submission", async () => {
      const nonexistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/submissions/${nonexistentId}`)
        .set(authHeader(candidateToken));

      expect(response.status).toBe(404);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app).get(
        `/api/submissions/${submission._id}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
