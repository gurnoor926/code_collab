const request = require("supertest");
const mongoose = require("mongoose");
const {MongoMemoryServer} = require("mongodb-memory-server");

let mongoServer;
let app;
let User;

const TEST_PASSWORD = "TestPassword@123";

beforeAll(async () =>{
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri(), {
        dbName : "CodeCollab_auth_test",
    });

    app = require("../src/app");
    User = require("../src/models/User");
},30000);

beforeEach(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();

    if(mongoServer){
        await mongoServer.stop();
    }
},30000);

describe("Authentication API", () =>{
    describe("POST /api/auth/register" , () => {
        test("register a new candidate" , async () => {
            const response = await request(app).post("/api/auth/register").send({
                name: "Test Candidate",
                email :"candidate@example.com",
                password : TEST_PASSWORD,
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(
                "candidate@example.com"
            );
            expect(response.body.user.role).toBe("candidate");

            const savedUser = await User.findOne({
                email : "candidate@example.com"
            });

            expect(savedUser).not.toBeNull();
            expect(savedUser.passwordHash).not.toBe(TEST_PASSWORD);
        });

        test("rejects duplicate email addresses" , async () => {
            const firstResponse = await request(app).post("/api/auth/register").send({
                name : "First Candidate",
                email : "duplicate@example.com",
                password: TEST_PASSWORD,
            });

            expect(firstResponse.status).toBe(201);

            const secondResponse = await request(app).post("/api/auth/register").send({
                name:"Second Candidate",
                email: "duplicate@example.com",
                password :TEST_PASSWORD,
            });

            expect(secondResponse.status).toBe(400);
            expect(secondResponse.body.success).toBe(false);
        });

        test("rejects a password longer than bcrypt's 72-byte limit" , async  () => {
            const response = await request(app).post("/api/auth/register").send({
                name : "Long Password User",
                email : "longpassword@example.com",
                password : "a".repeat(73),
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/login", () =>{
        beforeEach(async () => {
            const user = new User({
                name: "Login Candidate",
                email:"login@example.com",
            });

            await user.setPassword(TEST_PASSWORD);
            await user.save();
        });

        test("logs in with valid credentials" , async () => {
            const response = await request(app).post("/api/auth/login").send({
                email: "login@example.com",
                password : TEST_PASSWORD,
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(
                "login@example.com"
            );
        });

        test("rejects an incorrect password" , async () =>{
            const response = await request(app).post("/api/auth/login").send({
                email:"login@example.com",
                password: "WrongPassword@123"
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test("rejects unknown email address" , async () => {
            const response = await request(app).post("/api/auth/login").send({
                email : "unknown@example.com",
                password : TEST_PASSWORD
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/auth/me" , () => {
        test("rejects arequest without token" , async () =>{
            const response = await request(app).get("/api/auth/me");
            expect(response.status).toBe(401);
        });

        test("rejects an invalid token" , async () =>{
            const response = await request(app).get("/api/auth/me").set("Authorization" , "Bearer invalid-token");

            expect(response.status).toBe(401);
        });

        test("returns the authenticated user's profile", async () =>{
            const user = new User({
                name: "Protected Route Candidate",
                email : "protected@example.com"
            });

            await user.setPassword(TEST_PASSWORD);
            await user.save();

            const loginResponse = await request(app).post("/api/auth/login").send({
                email :"protected@example.com",
                password : TEST_PASSWORD
            });

            expect(loginResponse.status).toBe(200);

            const response = await request(app).get("/api/auth/me").set("Authorization" , `Bearer ${loginResponse.body.token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe(
                "protected@example.com"
            );
            expect(response.body.user.passwordHash).toBeUndefined();
        });
    });
});