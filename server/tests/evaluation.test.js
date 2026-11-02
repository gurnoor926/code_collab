const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../src/utils/interviewNotifications", () => ({
    notifyUser: jest.fn().mockResolvedValue(true),
}));

const { notifyUser } = require("../src/utils/interviewNotifications");

const User = require("../src/models/User");
const InterviewSession = require("../src/models/InterviewSession");
const InterviewEvaluation = require("../src/models/InterviewEvaluation");

const {
    calculateOverallScore,
} = require("../src/services/evaluationService");

let mongoServer;
let app;

let interviewer;
let candidate;
let anotherUser;
let admin;

let interviewerToken;
let candidateToken;
let anotherUserToken;
let adminToken;

let interview;

const generateToken = (user) =>
    jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "5d" }
    );

const authHeader = (token) => ({
    Authorization: `Bearer ${token}`,
});

const validEvaluationPayload = {
    technicalSkills: 4,
    problemSolving: 5,
    communication: 4,
    codeQuality: 4,
    strengths: ["Good problem-solving", "Clean code"],
    areasForImprovement: ["Time complexity analysis"],
    interviewerNotes: "Good overall performance.",
    recommendation: "hire",
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    app = require("../src/app");
});

beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        InterviewSession.deleteMany({}),
        InterviewEvaluation.deleteMany({}),
    ]);

    jest.clearAllMocks();

    interviewer = await User.create({
        name: "Interviewer",
        email: "interviewer@test.com",
        passwordHash: "TestPassword@123",
        role: "interviewer",
    });

    candidate = await User.create({
        name: "Candidate",
        email: "candidate@test.com",
        passwordHash: "TestPassword@123",
        role: "candidate",
    });

    anotherUser = await User.create({
        name: "Another User",
        email: "another@test.com",
        passwordHash: "TestPassword@123",
        role: "candidate",
    });

    admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        passwordHash: "TestPassword@123",
        role: "admin",
    });

    interviewerToken = generateToken(interviewer);
    candidateToken = generateToken(candidate);
    anotherUserToken = generateToken(anotherUser);
    adminToken = generateToken(admin);

    interview = await InterviewSession.create({
        title: "Technical Interview",
        interviewer: interviewer._id,
        candidate: candidate._id,
        status: "completed",
        problems: [],
    });
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe("Evaluation API Tests", () => {

    // =========================================
    // GET /api/evaluations/:interviewId
    // =========================================

    describe("GET /api/evaluations/:interviewId", () => {

        test("should reject unauthenticated requests", async () => {
            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`);

            expect(response.status).toBe(401);
        });

        test("should allow interviewer to retrieve evaluation", async () => {
            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(interviewerToken));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.evaluation.status).toBe("draft");
        });

        test("should allow admin to retrieve evaluation", async () => {
            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(adminToken));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test("should prevent candidate from accessing draft evaluation", async () => {
            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(candidateToken));

            expect(response.status).toBe(403);
            expect(response.body.message).toBe(
                "Evaluation is not yet available"
            );

            const evaluationCount =
                await InterviewEvaluation.countDocuments({
                    interview: interview._id,
                });

            expect(evaluationCount).toBe(0);
        });

        test("should prevent unrelated users from accessing evaluation", async () => {
            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(anotherUserToken));

            expect(response.status).toBe(403);
        });

        test("should return 404 for nonexistent interview", async () => {
            const nonexistentId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/evaluations/${nonexistentId}`)
                .set(authHeader(interviewerToken));

            expect(response.status).toBe(404);
        });

        test("should reject invalid interview ID", async () => {
            const response = await request(app)
                .get("/api/evaluations/invalid-id")
                .set(authHeader(interviewerToken));

            expect(response.status).toBe(400);
        });

        test("should allow candidate to retrieve submitted evaluation", async () => {
            await InterviewEvaluation.create({
                interview: interview._id,
                candidate: candidate._id,
                interviewer: interviewer._id,
                codingScore: 80,
                technicalSkills: 4,
                problemSolving: 5,
                communication: 4,
                codeQuality: 4,
                strengths: ["Good problem-solving"],
                areasForImprovement: ["Optimization"],
                interviewerNotes: "Private notes",
                recommendation: "hire",
                overallScore: 85,
                status: "submitted",
                submittedAt: new Date(),
            });

            const response = await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(candidateToken));

            expect(response.status).toBe(200);
            expect(response.body.data.evaluation.status).toBe("submitted");

            expect(
                response.body.data.evaluation.codingScore
            ).toBe(80);

            // Private interviewer notes must not be exposed.
            expect(
                response.body.data.evaluation.interviewerNotes
            ).toBeUndefined();
        });

        test("should not create duplicate evaluation drafts", async () => {
            await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(interviewerToken));

            await request(app)
                .get(`/api/evaluations/${interview._id}`)
                .set(authHeader(interviewerToken));

            const count = await InterviewEvaluation.countDocuments({
                interview: interview._id,
            });

            expect(count).toBe(1);
        });
    });

    // =========================================
    // POST /api/evaluations/:interviewId/submit
    // =========================================

    describe("POST /api/evaluations/:interviewId/submit", () => {

        test("should reject unauthenticated requests", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .send(validEvaluationPayload);

            expect(response.status).toBe(401);
        });

        test("should successfully submit evaluation", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(response.body.data.evaluation.status).toBe("submitted");

            expect(
                response.body.data.evaluation.recommendation
            ).toBe("hire");

            const savedEvaluation =
                await InterviewEvaluation.findOne({
                    interview: interview._id,
                });

            expect(savedEvaluation.status).toBe("submitted");
            expect(savedEvaluation.technicalSkills).toBe(4);

            expect(notifyUser).toHaveBeenCalled();
        });

        test("should allow admin to submit evaluation", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(adminToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(200);
        });

        test("should prevent candidate from submitting evaluation", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(candidateToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(403);
        });

        test("should prevent unrelated user from submitting evaluation", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(anotherUserToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(403);
        });

        test("should reject evaluation for incomplete interview", async () => {
            interview.status = "active";
            await interview.save();

            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(409);
        });

        test("should reject invalid rating values", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send({
                    ...validEvaluationPayload,
                    technicalSkills: 6,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                "technicalSkills must be an integer from 1 to 5"
            );
        });

        test("should reject decimal rating values", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send({
                    ...validEvaluationPayload,
                    communication: 3.5,
                });

            expect(response.status).toBe(400);
        });

        test("should reject invalid recommendation", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send({
                    ...validEvaluationPayload,
                    recommendation: "maybe",
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                "Invalid recommendation"
            );
        });

        test("should reject invalid feedback format", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send({
                    ...validEvaluationPayload,
                    strengths: "Good communication",
                });

            expect(response.status).toBe(400);
        });

        test("should reject feedback exceeding allowed limits", async () => {
            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send({
                    ...validEvaluationPayload,
                    strengths: Array(21).fill("Good work"),
                });

            expect(response.status).toBe(400);
        });

        test("should prevent duplicate evaluation submission", async () => {
            await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            const response = await request(app)
                .post(`/api/evaluations/${interview._id}/submit`)
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe(
                "Evaluation has already been submitted"
            );
        });

        test("should reject invalid interview ID", async () => {
            const response = await request(app)
                .post("/api/evaluations/invalid-id/submit")
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(400);
        });

        test("should return 404 for nonexistent interview", async () => {
            const nonexistentId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post(`/api/evaluations/${nonexistentId}/submit`)
                .set(authHeader(interviewerToken))
                .send(validEvaluationPayload);

            expect(response.status).toBe(404);
        });
    });

    // =========================================
    // Evaluation score calculations
    // =========================================

    describe("Evaluation score calculation", () => {

        test("should calculate overall score correctly", () => {
            const score = calculateOverallScore({
                codingScore: 80,
                technicalSkills: 4,
                problemSolving: 5,
                communication: 4,
                codeQuality: 4,
            });

            expect(score).toBe(82);
        });

        test("should return null for invalid ratings", () => {
            const score = calculateOverallScore({
                codingScore: 80,
                technicalSkills: 6,
                problemSolving: 5,
                communication: 4,
                codeQuality: 4,
            });

            expect(score).toBeNull();
        });
    });
});