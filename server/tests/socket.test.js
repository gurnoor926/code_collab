const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");

const { MongoMemoryServer } = require("mongodb-memory-server");

const initializeSocket = require("../src/socket/socketHandler");

const {
  initializeNotificationSocket,
  emitNotifications,
} = require("../src/socket/notificationSocket");

const User = require("../src/models/User");
const InterviewSession = require("../src/models/InterviewSession");

let mongoServer;
let httpServer;
let ioServer;
let serverAddress;

let interviewer;
let candidate;
let unauthorizedUser;
let admin;

let interview;

let interviewerToken;
let candidateToken;
let unauthorizedToken;
let adminToken;

let clients = [];

const generateToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "5d" }
  );

const connectClient = (token) => {
  const client = createClient(serverAddress, {
    auth: { token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });

  clients.push(client);

  return client;
};

const waitForEvent = (socket, eventName, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeout);

    const handler = (data) => {
      clearTimeout(timer);
      resolve(data);
    };

    socket.once(eventName, handler);
  });
};

const emitWithAck = (socket, eventName, payload) => {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

const connectSuccessfully = (token) => {
  return new Promise((resolve, reject) => {
    const client = connectClient(token);

    client.once("connect", () => resolve(client));

    client.once("connect_error", (error) => reject(error));
  });
};

const expectConnectionFailure = (token) => {
  return new Promise((resolve) => {
    const client = connectClient(token);

    client.once("connect_error", (error) => {
      resolve(error);
    });
  });
};

describe("Socket.IO Tests", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "SUPER_SECRET_KEY";

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    httpServer = http.createServer();

    ioServer = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    initializeSocket(ioServer);
    initializeNotificationSocket(ioServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();

        serverAddress = `http://127.0.0.1:${address.port}`;

        resolve();
      });
    });

    interviewer = await User.create({
      name: "Interviewer",
      email: "interviewer@example.com",
      passwordHash: "TestPassword@123",
      role: "interviewer",
    });

    candidate = await User.create({
      name: "Candidate",
      email: "candidate@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    unauthorizedUser = await User.create({
      name: "Unauthorized User",
      email: "unauthorized@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "TestPassword@123",
      role: "admin",
    });

    interviewerToken = generateToken(interviewer);
    candidateToken = generateToken(candidate);
    unauthorizedToken = generateToken(unauthorizedUser);
    adminToken = generateToken(admin);

    interview = await InterviewSession.create({
      title: "Socket Testing Interview",
      interviewer: interviewer._id,
      candidate: candidate._id,
      status: "waiting",
      durationMinutes: 60,
    });
  });

  afterEach(() => {
    clients.forEach((client) => {
      if (client.connected) {
        client.disconnect();
      }
    });

    clients = [];
  });

  afterAll(async () => {
    if (ioServer) {
      await ioServer.close();
    }

    if (httpServer?.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }

    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ==========================================
  // 1. SOCKET AUTHENTICATION
  // ==========================================

  describe("Socket Authentication", () => {
    test("should connect with a valid JWT", async () => {
      const client = await connectSuccessfully(interviewerToken);

      expect(client.connected).toBe(true);
    });

    test("should reject connection without a token", async () => {
      const error = await expectConnectionFailure(null);

      expect(error.message).toBe("Authentication required");
    });

    test("should reject an invalid JWT", async () => {
      const error = await expectConnectionFailure("invalid-token");

      expect(error.message).toBe(
        "Invalid or Expired authentication token"
      );
    });

    test("should reject a user who no longer exists", async () => {
      const deletedUserId = new mongoose.Types.ObjectId();

      const deletedUserToken = jwt.sign(
        { userId: deletedUserId.toString() },
        process.env.JWT_SECRET
      );

      const error = await expectConnectionFailure(deletedUserToken);

      expect(error.message).toBe("user no longer exists");
    });

    test("should accept Bearer-prefixed JWT", async () => {
      const client = await connectSuccessfully(
        `Bearer ${interviewerToken}`
      );

      expect(client.connected).toBe(true);
    });
  });

  // ==========================================
  // 2. PRIVATE USER NOTIFICATION ROOM
  // ==========================================

  describe("Private Notification Room", () => {
    test("should automatically join authenticated user's private room", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const serverSocket = ioServer.sockets.sockets.get(client.id);

      expect(serverSocket).toBeDefined();

      expect(
        serverSocket.rooms.has(`user:${interviewer._id}`)
      ).toBe(true);
    });

    test("should deliver notifications to the correct user", async () => {
      const interviewerClient = await connectSuccessfully(
        interviewerToken
      );

      const candidateClient = await connectSuccessfully(
        candidateToken
      );

      const notificationPromise = waitForEvent(
        interviewerClient,
        "notification:new"
      );

      const notification = {
        title: "Interview Scheduled",
        message: "Your interview has been scheduled.",
      };

      const result = emitNotifications(
        interviewer._id,
        notification
      );

      expect(result).toBe(true);

      const receivedNotification = await notificationPromise;

      expect(receivedNotification.title).toBe(
        "Interview Scheduled"
      );

      expect(candidateClient.connected).toBe(true);
    });

    test("should reject notification emission without notification data", () => {
      expect(
        emitNotifications(interviewer._id, null)
      ).toBe(false);
    });
  });

  // ==========================================
  // 3. INTERVIEW ROOM MANAGEMENT
  // ==========================================

  describe("Interview Room Management", () => {
    test("should allow interviewer to join assigned interview", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const joinedPromise = waitForEvent(
        client,
        "interview:joined"
      );

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: interview._id.toString(),
        }
      );

      expect(response.success).toBe(true);

      const joinedData = await joinedPromise;

      expect(joinedData.interviewId).toBe(
        interview._id.toString()
      );
    });

    test("should allow assigned candidate to join interview", async () => {
      const client = await connectSuccessfully(candidateToken);

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: interview._id.toString(),
        }
      );

      expect(response.success).toBe(true);
    });

    test("should reject unauthorized user from joining interview", async () => {
      const client = await connectSuccessfully(unauthorizedToken);

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: interview._id.toString(),
        }
      );

      expect(response.success).toBe(false);

      expect(response.message).toBe(
        "you do not have access to this interview"
      );
    });

    test("should allow admin to join interview", async () => {
      const client = await connectSuccessfully(adminToken);

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: interview._id.toString(),
        }
      );

      expect(response.success).toBe(true);
    });

    test("should reject invalid interview ID", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: "invalid-id",
        }
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe("Invalid interview ID");
    });

    test("should reject joining a completed interview", async () => {
      const completedInterview = await InterviewSession.create({
        title: "Completed Interview",
        interviewer: interviewer._id,
        candidate: candidate._id,
        status: "completed",
        durationMinutes: 60,
      });

      const client = await connectSuccessfully(interviewerToken);

      const response = await emitWithAck(
        client,
        "interview:join",
        {
          interviewId: completedInterview._id.toString(),
        }
      );

      expect(response.success).toBe(false);

      expect(response.message).toBe(
        "This interview is no longer active"
      );
    });

    test("should prevent duplicate interview room joins", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const payload = {
        interviewId: interview._id.toString(),
      };

      await emitWithAck(client, "interview:join", payload);

      const secondResponse = await emitWithAck(
        client,
        "interview:join",
        payload
      );

      expect(secondResponse.success).toBe(true);

      expect(secondResponse.message).toBe(
        "Already joined interview"
      );
    });
  });

  // ==========================================
  // 4. EDITOR CODE SYNCHRONIZATION
  // ==========================================

  describe("Editor Code Synchronization", () => {
    test("should broadcast code changes to other room participants", async () => {
      const interviewerClient = await connectSuccessfully(
        interviewerToken
      );

      const candidateClient = await connectSuccessfully(
        candidateToken
      );

      const payload = {
        interviewId: interview._id.toString(),
      };

      await emitWithAck(
        interviewerClient,
        "interview:join",
        payload
      );

      await emitWithAck(
        candidateClient,
        "interview:join",
        payload
      );

      const changePromise = waitForEvent(
        candidateClient,
        "editor:change"
      );

      const response = await emitWithAck(
        interviewerClient,
        "editor:change",
        {
          interviewId: interview._id.toString(),
          code: "console.log('Hello CodeCollab');",
          language: "javascript",
        }
      );

      expect(response.success).toBe(true);

      const receivedChange = await changePromise;

      expect(receivedChange.code).toBe(
        "console.log('Hello CodeCollab');"
      );

      expect(receivedChange.language).toBe("javascript");

      expect(receivedChange.updatedBy).toBe(
        interviewer._id.toString()
      );
    });

    test("should reject code changes before joining interview", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const response = await emitWithAck(
        client,
        "editor:change",
        {
          interviewId: interview._id.toString(),
          code: "console.log('test');",
          language: "javascript",
        }
      );

      expect(response.success).toBe(false);
    });

    test("should reject unsupported programming language", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await emitWithAck(client, "interview:join", {
        interviewId: interview._id.toString(),
      });

      const response = await emitWithAck(
        client,
        "editor:change",
        {
          interviewId: interview._id.toString(),
          code: "print('test')",
          language: "ruby",
        }
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe(
        "Unsupported programming language"
      );
    });

    test("should reject code exceeding 50KB", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await emitWithAck(client, "interview:join", {
        interviewId: interview._id.toString(),
      });

      const response = await emitWithAck(
        client,
        "editor:change",
        {
          interviewId: interview._id.toString(),
          code: "a".repeat(50001),
          language: "javascript",
        }
      );

      expect(response.success).toBe(false);

      expect(response.message).toBe(
        "Code exceeds the maximum allowed size"
      );
    });
  });

  // ==========================================
  // 5. CURSOR SYNCHRONIZATION
  // ==========================================

  describe("Editor Cursor Synchronization", () => {
    test("should broadcast cursor position to other participants", async () => {
      const interviewerClient = await connectSuccessfully(
        interviewerToken
      );

      const candidateClient = await connectSuccessfully(
        candidateToken
      );

      const payload = {
        interviewId: interview._id.toString(),
      };

      await emitWithAck(interviewerClient, "interview:join", payload);
      await emitWithAck(candidateClient, "interview:join", payload);

      const cursorPromise = waitForEvent(
        candidateClient,
        "editor:cursor"
      );

      const response = await emitWithAck(
        interviewerClient,
        "editor:cursor",
        {
          interviewId: interview._id.toString(),
          position: {
            lineNumber: 10,
            column: 5,
          },
        }
      );

      expect(response.success).toBe(true);

      const cursorData = await cursorPromise;

      expect(cursorData.position).toEqual({
        lineNumber: 10,
        column: 5,
      });
    });

    test("should reject invalid cursor position", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await emitWithAck(client, "interview:join", {
        interviewId: interview._id.toString(),
      });

      const response = await emitWithAck(
        client,
        "editor:cursor",
        {
          interviewId: interview._id.toString(),
          position: {
            lineNumber: 0,
            column: 5,
          },
        }
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe("Invalid cursor position");
    });
  });

  // ==========================================
  // 6. LANGUAGE SYNCHRONIZATION
  // ==========================================

  describe("Editor Language Synchronization", () => {
    test("should broadcast language changes", async () => {
      const interviewerClient = await connectSuccessfully(
        interviewerToken
      );

      const candidateClient = await connectSuccessfully(
        candidateToken
      );

      const payload = {
        interviewId: interview._id.toString(),
      };

      await emitWithAck(interviewerClient, "interview:join", payload);
      await emitWithAck(candidateClient, "interview:join", payload);

      const languagePromise = waitForEvent(
        candidateClient,
        "editor:language"
      );

      const response = await emitWithAck(
        interviewerClient,
        "editor:language",
        {
          interviewId: interview._id.toString(),
          language: "python",
        }
      );

      expect(response.success).toBe(true);

      const languageData = await languagePromise;

      expect(languageData.language).toBe("python");
    });

    test("should reject unsupported language", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await emitWithAck(client, "interview:join", {
        interviewId: interview._id.toString(),
      });

      const response = await emitWithAck(
        client,
        "editor:language",
        {
          interviewId: interview._id.toString(),
          language: "ruby",
        }
      );

      expect(response.success).toBe(false);
    });
  });

  // ==========================================
  // 7. DISCONNECTION
  // ==========================================

  describe("Socket Disconnection", () => {
    test("should disconnect authenticated client", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const disconnectedPromise = waitForEvent(
        client,
        "disconnect"
      );

      client.disconnect();

      await disconnectedPromise;

      expect(client.connected).toBe(false);
    });
  });
});