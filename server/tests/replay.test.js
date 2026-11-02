const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

const User = require("../src/models/User");
const InterviewSession = require("../src/models/InterviewSession");
const ReplaySession = require("../src/models/ReplaySession");
const ReplayEvent = require("../src/models/ReplayEvent");

let mongoServer;

let interviewer;
let candidate;
let unauthorizedUser;
let admin;

let interview;

let interviewerToken;
let candidateToken;
let unauthorizedToken;
let adminToken;

const generateToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

const replayUrl = (interviewId) =>
  `/api/replays/${interviewId}`;

const startReplay = (token, interviewId, body = {}) =>
  request(app)
    .post(`${replayUrl(interviewId)}/start`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const recordCodeChange = (token, interviewId, body = {}) =>
  request(app)
    .post(`${replayUrl(interviewId)}/code-change`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const recordLanguageChange = (token, interviewId, body = {}) =>
  request(app)
    .post(`${replayUrl(interviewId)}/language-change`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const createSnapshot = (token, interviewId, body = {}) =>
  request(app)
    .post(`${replayUrl(interviewId)}/snapshot`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const getReplayEvents = (token, interviewId, query = {}) =>
  request(app)
    .get(`${replayUrl(interviewId)}/events`)
    .set("Authorization", `Bearer ${token}`)
    .query(query);

const completeReplay = (token, interviewId) =>
  request(app)
    .patch(`${replayUrl(interviewId)}/complete`)
    .set("Authorization", `Bearer ${token}`);

describe("Session Replay API Tests", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "SUPER_SECRET_KEY";

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    interviewer = await User.create({
      name: "Replay Interviewer",
      email: "replay-interviewer@example.com",
      passwordHash: "TestPassword@123",
      role: "interviewer",
    });

    candidate = await User.create({
      name: "Replay Candidate",
      email: "replay-candidate@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    unauthorizedUser = await User.create({
      name: "Unauthorized User",
      email: "replay-unauthorized@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    admin = await User.create({
      name: "Replay Admin",
      email: "replay-admin@example.com",
      passwordHash: "TestPassword@123",
      role: "admin",
    });

    interviewerToken = generateToken(interviewer);
    candidateToken = generateToken(candidate);
    unauthorizedToken = generateToken(unauthorizedUser);
    adminToken = generateToken(admin);

    interview = await InterviewSession.create({
      title: "Session Replay Testing",
      interviewer: interviewer._id,
      candidate: candidate._id,
      status: "active",
      durationMinutes: 60,
    });
  });

  beforeEach(async () => {
    await ReplayEvent.deleteMany({});
    await ReplaySession.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ==========================================
  // 1. START REPLAY
  // ==========================================

  describe("Start Replay Recording", () => {
    test("should allow interviewer to start replay recording", async () => {
      const response = await startReplay(
        interviewerToken,
        interview._id,
        {
          initialCode: "console.log('Hello');",
          initialLanguage: "javascript",
        }
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.status).toBe("recording");

      expect(response.body.data.initialCode).toBe(
        "console.log('Hello');"
      );

      expect(response.body.data.initialLanguage).toBe("javascript");
    });

    test("should allow admin to start replay recording", async () => {
      const response = await startReplay(
        adminToken,
        interview._id
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test("should reject candidate from starting replay", async () => {
      const response = await startReplay(
        candidateToken,
        interview._id
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should reject unauthorized user", async () => {
      const response = await startReplay(
        unauthorizedToken,
        interview._id
      );

      expect(response.status).toBe(403);
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app)
        .post(`${replayUrl(interview._id)}/start`);

      expect(response.status).toBe(401);
    });

    test("should reject invalid interview ID", async () => {
      const response = await startReplay(
        interviewerToken,
        "invalid-id"
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid interview ID");
    });

    test("should reject nonexistent interview", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await startReplay(
        interviewerToken,
        fakeId
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Interview not found");
    });

    test("should reject starting replay when interview is not active", async () => {
      const scheduledInterview = await InterviewSession.create({
        title: "Scheduled Interview",
        interviewer: interviewer._id,
        candidate: candidate._id,
        status: "scheduled",
        durationMinutes: 60,
      });

      const response = await startReplay(
        interviewerToken,
        scheduledInterview._id
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Interview must be active to start replay"
      );
    });

    test("should reject unsupported initial language", async () => {
      const response = await startReplay(
        interviewerToken,
        interview._id,
        {
          initialLanguage: "ruby",
        }
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Unsupported language");
    });

    test("should reject initial code exceeding 50 KB", async () => {
      const response = await startReplay(
        interviewerToken,
        interview._id,
        {
          initialCode: "a".repeat(50001),
        }
      );

      expect(response.status).toBe(413);
    });

    test("should create initial interview started and snapshot events", async () => {
      await startReplay(
        interviewerToken,
        interview._id,
        {
          initialCode: "console.log('Start');",
          initialLanguage: "javascript",
        }
      );

      const events = await ReplayEvent.find({
        interview: interview._id,
      }).sort({ sequence: 1 });

      expect(events).toHaveLength(2);

      expect(events[0].eventType).toBe("interview_started");
      expect(events[1].eventType).toBe("snapshot");

      expect(events[0].sequence).toBe(1);
      expect(events[1].sequence).toBe(2);
    });

    test("should not create duplicate replay sessions", async () => {
      const firstResponse = await startReplay(
        interviewerToken,
        interview._id
      );

      const secondResponse = await startReplay(
        interviewerToken,
        interview._id
      );

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);

      const sessions = await ReplaySession.find({
        interview: interview._id,
      });

      expect(sessions).toHaveLength(1);
    });
  });

  // ==========================================
  // 2. CODE CHANGE EVENTS
  // ==========================================

  describe("Record Code Changes", () => {
    beforeEach(async () => {
      await startReplay(interviewerToken, interview._id);
    });

    test("should record valid code change", async () => {
      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "console.log('Updated');",
          language: "javascript",
        }
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.eventType).toBe("code_change");

      expect(response.body.data.payload.code).toBe(
        "console.log('Updated');"
      );
    });

    test("should reject non-string code", async () => {
      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: 123,
          language: "javascript",
        }
      );

      expect(response.status).toBe(400);
    });

    test("should reject unsupported language", async () => {
      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "print('Hello')",
          language: "ruby",
        }
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Unsupported language");
    });

    test("should reject code exceeding 50 KB", async () => {
      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "a".repeat(50001),
          language: "javascript",
        }
      );

      expect(response.status).toBe(413);
    });

    test("should store the user who made the code change", async () => {
      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "let x = 10;",
          language: "javascript",
        }
      );

      expect(response.body.data.user).toBe(
        candidate._id.toString()
      );
    });

    test("should reject code change before recording starts", async () => {
      await ReplaySession.deleteMany({
        interview: interview._id,
      });

      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "console.log('Hello');",
          language: "javascript",
        }
      );

      expect(response.status).toBe(409);
    });
  });

  // ==========================================
  // 3. LANGUAGE CHANGE EVENTS
  // ==========================================

  describe("Record Language Changes", () => {
    beforeEach(async () => {
      await startReplay(interviewerToken, interview._id);
    });

    test("should record valid language change", async () => {
      const response = await recordLanguageChange(
        candidateToken,
        interview._id,
        {
          language: "python",
        }
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.eventType).toBe(
        "language_change"
      );

      expect(response.body.data.payload.language).toBe("python");
    });

    test("should reject unsupported language", async () => {
      const response = await recordLanguageChange(
        candidateToken,
        interview._id,
        {
          language: "ruby",
        }
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("unsupported language");
    });

    test("should reject language change before recording starts", async () => {
      await ReplaySession.deleteMany({
        interview: interview._id,
      });

      const response = await recordLanguageChange(
        candidateToken,
        interview._id,
        {
          language: "python",
        }
      );

      expect(response.status).toBe(409);
    });
  });

  // ==========================================
  // 4. SNAPSHOT EVENTS
  // ==========================================

  describe("Create Editor Snapshots", () => {
    beforeEach(async () => {
      await startReplay(interviewerToken, interview._id);
    });

    test("should create valid snapshot", async () => {
      const response = await createSnapshot(
        candidateToken,
        interview._id,
        {
          code: "function add(a, b) { return a + b; }",
          language: "javascript",
        }
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.eventType).toBe("snapshot");
    });

    test("should associate snapshot with authenticated user", async () => {
      const response = await createSnapshot(
        candidateToken,
        interview._id,
        {
          code: "print('Hello')",
          language: "python",
        }
      );

      expect(response.body.data.user).toBe(
        candidate._id.toString()
      );
    });

    test("should reject snapshot before replay starts", async () => {
      await ReplaySession.deleteMany({
        interview: interview._id,
      });

      const response = await createSnapshot(
        candidateToken,
        interview._id,
        {
          code: "console.log('Hello');",
          language: "javascript",
        }
      );

      expect(response.status).toBe(409);
    });
  });

  // ==========================================
  // 5. REPLAY EVENT SEQUENCING
  // ==========================================

  describe("Replay Event Sequencing", () => {
    test("should assign incrementing sequence numbers", async () => {
      await startReplay(interviewerToken, interview._id);

      await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "let x = 1;",
          language: "javascript",
        }
      );

      await recordLanguageChange(
        candidateToken,
        interview._id,
        {
          language: "python",
        }
      );

      const events = await ReplayEvent.find({
        interview: interview._id,
      }).sort({ sequence: 1 });

      expect(events).toHaveLength(4);

      expect(events.map((event) => event.sequence)).toEqual([
        1, 2, 3, 4,
      ]);
    });

    test("should maintain unique event sequence numbers", async () => {
      await startReplay(interviewerToken, interview._id);

      await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "let a = 1;",
          language: "javascript",
        }
      );

      const events = await ReplayEvent.find({
        interview: interview._id,
      });

      const sequences = events.map((event) => event.sequence);

      expect(new Set(sequences).size).toBe(sequences.length);
    });

    test("should store elapsed time for events", async () => {
      await startReplay(interviewerToken, interview._id);

      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "let x = 1;",
          language: "javascript",
        }
      );

      expect(response.body.data.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================
  // 6. RETRIEVE REPLAY EVENTS
  // ==========================================

  describe("Retrieve Replay Events", () => {
    beforeEach(async () => {
      await startReplay(interviewerToken, interview._id);

      await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "let x = 1;",
          language: "javascript",
        }
      );

      await recordLanguageChange(
        candidateToken,
        interview._id,
        {
          language: "python",
        }
      );

      await createSnapshot(
        candidateToken,
        interview._id,
        {
          code: "print('Hello')",
          language: "python",
        }
      );
    });

    test("should allow interviewer to retrieve replay", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(5);
    });

    test("should allow candidate to retrieve replay", async () => {
      const response = await getReplayEvents(
        candidateToken,
        interview._id
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should allow admin to retrieve replay", async () => {
      const response = await getReplayEvents(
        adminToken,
        interview._id
      );

      expect(response.status).toBe(200);
    });

    test("should reject unauthorized user", async () => {
      const response = await getReplayEvents(
        unauthorizedToken,
        interview._id
      );

      expect(response.status).toBe(403);
    });

    test("should return events in sequence order", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id
      );

      const sequences = response.body.data.events.map(
        (event) => event.sequence
      );

      expect(sequences).toEqual([1, 2, 3, 4, 5]);
    });

    test("should support afterSequence filtering", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id,
        {
          afterSequence: 2,
        }
      );

      expect(response.status).toBe(200);

      const sequences = response.body.data.events.map(
        (event) => event.sequence
      );

      expect(sequences).toEqual([3, 4, 5]);
    });

    test("should support event pagination using limit", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id,
        {
          limit: 2,
        }
      );

      expect(response.status).toBe(200);

      expect(response.body.data.events).toHaveLength(2);
      expect(response.body.data.nextAfterSequence).toBe(2);
      expect(response.body.data.hasMore).toBe(true);
    });

    test("should reject invalid sequence number", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id,
        {
          afterSequence: -1,
        }
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid sequence number");
    });

    test("should reject invalid pagination limit", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id,
        {
          limit: 1001,
        }
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Limit must be between 1 and 1000"
      );
    });

    test("should return correct hasMore value", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        interview._id,
        {
          afterSequence: 4,
        }
      );

      expect(response.body.data.hasMore).toBe(false);
    });

    test("should reject invalid interview ID", async () => {
      const response = await getReplayEvents(
        interviewerToken,
        "invalid-id"
      );

      expect(response.status).toBe(400);
    });
  });

  // ==========================================
  // 7. COMPLETE REPLAY
  // ==========================================

  describe("Complete Replay Recording", () => {
    beforeEach(async () => {
      await startReplay(interviewerToken, interview._id);
    });

    test("should allow interviewer to complete replay", async () => {
      const response = await completeReplay(
        interviewerToken,
        interview._id
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.status).toBe("completed");
    });

    test("should allow admin to complete replay", async () => {
      const response = await completeReplay(
        adminToken,
        interview._id
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("completed");
    });

    test("should reject candidate from completing replay", async () => {
      const response = await completeReplay(
        candidateToken,
        interview._id
      );

      expect(response.status).toBe(403);
    });

    test("should reject completing replay twice", async () => {
      await completeReplay(
        interviewerToken,
        interview._id
      );

      const response = await completeReplay(
        interviewerToken,
        interview._id
      );

      expect(response.status).toBe(404);
    });

    test("should prevent recording events after completion", async () => {
      await completeReplay(
        interviewerToken,
        interview._id
      );

      const response = await recordCodeChange(
        candidateToken,
        interview._id,
        {
          code: "console.log('After completion');",
          language: "javascript",
        }
      );

      expect(response.status).toBe(409);
    });

    test("should preserve replay events after completion", async () => {
      await completeReplay(
        interviewerToken,
        interview._id
      );

      const response = await getReplayEvents(
        candidateToken,
        interview._id
      );

      expect(response.status).toBe(200);
      expect(response.body.data.session.status).toBe("completed");
      expect(response.body.data.events).toHaveLength(2);
    });
  });
});