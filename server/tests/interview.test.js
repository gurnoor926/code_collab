const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

let mongoServer;
let app;
let User;
let InterviewSession;

const TEST_PASSWORD = "TestPassword@123";

let interviewer;
let candidate;
let anotherCandidate;

let interviewerToken;
let candidateToken;
let anotherCandidateToken;

const createUser = async (name, email, role = "candidate") => {
  const user = new User({
    name,
    email,
    role,
  });

  await user.setPassword(TEST_PASSWORD);
  await user.save();

  return user;
};

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id.toString(),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "5d",
        }
    );
};

const createInterview = async (token, title = "Test Interview") => {

    const response = await request(app)
        .post("/api/interviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title,
            description: "Interview created for API testing",
            durationMinutes: 60,
        });

    return response;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri(), {
    dbName: "CodeCollab_interview_test",
  });

  app = require("../src/app");

  User = require("../src/models/User");

  InterviewSession = require("../src/models/InterviewSession");
}, 30000);

beforeEach(async () => {
  await User.deleteMany({});
  await InterviewSession.deleteMany({});

  interviewer = await createUser(
    "Test Interviewer",
    "interviewer@example.com",
    "interviewer",
  );

  candidate = await createUser(
    "Test Candidate",
    "candidate@example.com",
    "candidate",
  );

  anotherCandidate = await createUser(
    "Another Candidate",
    "another@example.com",
    "candidate",
  );

interviewerToken = generateToken(interviewer);
candidateToken = generateToken(candidate);
anotherCandidateToken = generateToken(anotherCandidate);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);
// tests

describe("POST /api/interviews", () => {
  test("creates an interview as an interviewer", async () => {
    const response = await createInterview(interviewerToken);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Test Interview");
    expect(response.body.data.status).toBe("scheduled");
    expect(response.body.data.roomCode).toMatch(/^CC-[A-F0-9]{8}$/);
    expect(response.body.data.interviewer.toString()).toBe(
      interviewer._id.toString(),
    );
  });

  test("rejects unauthenticated interview creation", async () => {
    const response = await request(app).post("/api/interviews").send({
      title: "Unauthorized Interview",
    });

    expect(response.status).toBe(401);
  });

  test("rejects interview creation by a candidate", async () => {
    const response = await createInterview(candidateToken);

    expect(response.status).toBe(403);
  });

  test("rejects invalid interview data", async () => {
    const response = await request(app)
      .post("/api/interviews")
      .set("Authorization", `Bearer ${interviewerToken}`)
      .send({
        title: "AB",
        durationMinutes: 60,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects duplicate probelm IDs", async () => {
    const problemId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/interviews")
      .set("Authorization", `Bearer ${interviewerToken}`)
      .send({
        title: "Duplicate problems Interview",
        problemIds: [problemId, problemId],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Duplicate problem IDs/i);
  });
});

//GET MY INTERVIEWS
describe("GET /api/interviews/my", () => {
  test("returns interviews belonging to the authenticated interviewer", async () => {
    await createInterview(interviewerToken);
    const response = await request(app)
      .get("/api/interviews/my")
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.page).toBe(1);
  });
  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/interviews/my");
    expect(response.status).toBe(401);
  });
});

//Get interview by id

describe("GET /api/interviews/:id", () => {
  test("allows the interviewer to retrieve their interview", async () => {
    const created = await createInterview(interviewerToken);
    const interviewId = created.body.data._id;
    const response = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Test Interview");
  });
  test("rejects an invalid interview ID", async () => {
    const response = await request(app)
      .get("/api/interviews/invalid-id")
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(400);
  });
  test("rejects access by an unrelated candidate", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .get(`/api/interviews/${created.body.data._id}`)
      .set("Authorization", `Bearer ${anotherCandidateToken}`);
    expect(response.status).toBe(403);
  });
  test("returns 404 for a non-existent interview", async () => {
    const interviewId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(404);
  });
});

//join interview

describe("POST /api/interviews/join", () => {
  test("allows a candidate to join an interview", async () => {
    const created = await createInterview(interviewerToken);
    const roomCode = created.body.data.roomCode;
    const response = await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ roomCode });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("waiting");
    const savedInterview = await InterviewSession.findById(
      created.body.data._id,
    );
    expect(savedInterview.candidate.toString()).toBe(candidate._id.toString());
    expect(savedInterview.status).toBe("waiting");
  });
  test("rejects joining with an invalid room code", async () => {
    const response = await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ roomCode: "INVALID" });
    expect(response.status).toBe(400);
  });
  test("rejects joining an interview as an interviewer", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${interviewerToken}`)
      .send({ roomCode: created.body.data.roomCode });
    expect(response.status).toBe(403);
  });
  test("prevents another candidate from joining an occupied interview", async () => {
    const created = await createInterview(interviewerToken);
    await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ roomCode: created.body.data.roomCode });
    const response = await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${anotherCandidateToken}`)
      .send({ roomCode: created.body.data.roomCode });
    expect(response.status).toBe(409);
  });
});

//interview status

describe("Interview status management", () => {
  test("allows an interviewer to start a waiting interview", async () => {
    const created = await createInterview(interviewerToken);
    await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ roomCode: created.body.data.roomCode });
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/start`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("active");
    const savedInterview = await InterviewSession.findById(
      created.body.data._id,
    );
    expect(savedInterview.status).toBe("active");
    expect(savedInterview.startedAt).not.toBeNull();
  });
  test("prevents a candidate from starting an interview", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/start`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(response.status).toBe(403);
  });
  test("rejects starting an interview that is not waiting", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/start`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(400);
  });
  test("allows an interviewer to complete an active interview", async () => {
    const created = await createInterview(interviewerToken);
    await request(app)
      .post("/api/interviews/join")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ roomCode: created.body.data.roomCode });
    await request(app)
      .patch(`/api/interviews/${created.body.data._id}/start`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/complete`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");
    const savedInterview = await InterviewSession.findById(
      created.body.data._id,
    );
    expect(savedInterview.status).toBe("completed");
    expect(savedInterview.endedAt).not.toBeNull();
  });
  test("allows an interviewer to cancel a scheduled interview", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${interviewerToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("cancelled");
  });
  test("prevents a candidate from cancelling an interview", async () => {
    const created = await createInterview(interviewerToken);
    const response = await request(app)
      .patch(`/api/interviews/${created.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(response.status).toBe(403);
  });
});