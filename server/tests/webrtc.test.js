const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");

const { MongoMemoryServer } = require("mongodb-memory-server");

const initializeSocket = require("../src/socket/socketHandler");

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
  jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });

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

const connectSuccessfully = (token) =>
  new Promise((resolve, reject) => {
    const client = connectClient(token);

    client.once("connect", () => resolve(client));

    client.once("connect_error", reject);
  });

const waitForEvent = (socket, eventName, timeout = 5000) =>
  new Promise((resolve, reject) => {
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

const emitWithAck = (socket, eventName, payload) =>
  new Promise((resolve, reject) => {
    socket.timeout(5000).emit(eventName, payload, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });

const emitAndWaitError = async (socket, eventName, payload) => {
  const errorPromise = waitForEvent(socket, "webrtc:error");

  socket.emit(eventName, payload);

  return errorPromise;
};

const joinWebRTC = async (socket, interviewId) => {
  return emitWithAck(socket, "webrtc:join", {
    interviewId: interviewId.toString(),
  });
};

const joinBothParticipants = async () => {
  const interviewerClient = await connectSuccessfully(interviewerToken);

  const candidateClient = await connectSuccessfully(candidateToken);

  await joinWebRTC(interviewerClient, interview._id);
  await joinWebRTC(candidateClient, interview._id);

  return {
    interviewerClient,
    candidateClient,
  };
};

describe("WebRTC Signaling Tests", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "SUPER_SECRET_KEY";

    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    httpServer = http.createServer();

    ioServer = new Server(httpServer);

    initializeSocket(ioServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        serverAddress = `http://127.0.0.1:${httpServer.address().port}`;
        resolve();
      });
    });

    interviewer = await User.create({
      name: "Interviewer",
      email: "interviewer-webrtc@example.com",
      passwordHash: "TestPassword@123",
      role: "interviewer",
    });

    candidate = await User.create({
      name: "Candidate",
      email: "candidate-webrtc@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    unauthorizedUser = await User.create({
      name: "Unauthorized",
      email: "unauthorized-webrtc@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    admin = await User.create({
      name: "Admin",
      email: "admin-webrtc@example.com",
      passwordHash: "TestPassword@123",
      role: "admin",
    });

    interviewerToken = generateToken(interviewer);
    candidateToken = generateToken(candidate);
    unauthorizedToken = generateToken(unauthorizedUser);
    adminToken = generateToken(admin);

    interview = await InterviewSession.create({
      title: "WebRTC Testing Interview",
      interviewer: interviewer._id,
      candidate: candidate._id,
      status: "waiting",
      durationMinutes: 60,
    });
  });

  afterEach(async () => {
    clients.forEach((client) => {
      if (client.connected) {
        client.disconnect();
      }
    });

    clients = [];

    // Allow the server to process disconnecting events.
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  afterAll(async () => {
    if (ioServer) {
      await ioServer.close();
    }

    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ==========================================
  // 1. WEBRTC ROOM JOIN
  // ==========================================

  describe("WebRTC Room Joining", () => {
    test("should allow interviewer to join WebRTC room", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const joinedPromise = waitForEvent(client, "webrtc:joined");

      const response = await joinWebRTC(client, interview._id);

      expect(response.success).toBe(true);

      const joinedData = await joinedPromise;

      expect(joinedData.interviewId).toBe(interview._id.toString());

      expect(joinedData.peers).toHaveLength(0);
    });

    test("should allow candidate to join WebRTC room", async () => {
      const client = await connectSuccessfully(candidateToken);

      const response = await joinWebRTC(client, interview._id);

      expect(response.success).toBe(true);
    });

    test("should notify existing peer when another participant joins", async () => {
      const interviewerClient = await connectSuccessfully(interviewerToken);

      await joinWebRTC(interviewerClient, interview._id);

      const peerJoinedPromise = waitForEvent(
        interviewerClient,
        "webrtc:peer-joined",
      );

      const candidateClient = await connectSuccessfully(candidateToken);

      await joinWebRTC(candidateClient, interview._id);

      const peerData = await peerJoinedPromise;

      expect(peerData.userId).toBe(candidate._id.toString());
      expect(peerData.name).toBe("Candidate");
    });

    test("should reject unauthorized user", async () => {
      const client = await connectSuccessfully(unauthorizedToken);

      const errorPromise = emitAndWaitError(client, "webrtc:join", {
        interviewId: interview._id.toString(),
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);

      expect(error.message).toBe("You are not authorized for this interview");
    });

    test("should reject admin from joining media room", async () => {
      const client = await connectSuccessfully(adminToken);

      const errorPromise = emitAndWaitError(client, "webrtc:join", {
        interviewId: interview._id.toString(),
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);

      expect(error.message).toBe(
        "Only the interviewer and assigned candidate can join the call",
      );
    });

    test("should reject invalid interview ID", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const errorPromise = emitAndWaitError(client, "webrtc:join", {
        interviewId: "invalid-id",
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);
      expect(error.message).toBe("Invalid interview ID");
    });

    test("should reject nonexistent interview", async () => {
      const client = await connectSuccessfully(interviewerToken);

      const fakeId = new mongoose.Types.ObjectId();

      const errorPromise = emitAndWaitError(client, "webrtc:join", {
        interviewId: fakeId.toString(),
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);
      expect(error.message).toBe("Interview not found");
    });

    test("should reject completed interview", async () => {
      const completedInterview = await InterviewSession.create({
        title: "Completed WebRTC Interview",
        interviewer: interviewer._id,
        candidate: candidate._id,
        status: "completed",
        durationMinutes: 60,
      });

      const client = await connectSuccessfully(interviewerToken);

      const errorPromise = emitAndWaitError(client, "webrtc:join", {
        interviewId: completedInterview._id.toString(),
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);

      expect(error.message).toBe("This interview is not open for WebRTC");
    });

    test("should prevent duplicate connection by the same user", async () => {
      const firstClient = await connectSuccessfully(interviewerToken);

      const secondClient = await connectSuccessfully(interviewerToken);

      await joinWebRTC(firstClient, interview._id);

      const errorPromise = emitAndWaitError(secondClient, "webrtc:join", {
        interviewId: interview._id.toString(),
      });

      const error = await errorPromise;

      expect(error.success).toBe(false);

      expect(error.message).toBe(
        "This user already has a connection in the interview call",
      );
    });

    test("should handle duplicate join from the same socket", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await joinWebRTC(client, interview._id);

      const response = await joinWebRTC(client, interview._id);

      expect(response.success).toBe(true);

      expect(response.message).toBe("Already joined WebRTC room");
    });
  });

  // ==========================================
  // 2. SDP OFFER
  // ==========================================

  describe("WebRTC SDP Offer", () => {
    test("should relay valid SDP offer to peer", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const offerPromise = waitForEvent(candidateClient, "webrtc:offer");

      const sdp = {
        type: "offer",
        sdp: "v=0\r\no=- 123 456 IN IP4 127.0.0.1",
      };

      const response = await emitWithAck(interviewerClient, "webrtc:offer", {
        peerId: candidateClient.id,
        sdp,
      });

      expect(response.success).toBe(true);

      const receivedOffer = await offerPromise;

      expect(receivedOffer.peerId).toBe(interviewerClient.id);
      expect(receivedOffer.sdp).toEqual(sdp);
    });

    test("should reject invalid SDP offer", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const response = await emitWithAck(interviewerClient, "webrtc:offer", {
        peerId: candidateClient.id,
        sdp: {
          type: "answer",
          sdp: "invalid offer",
        },
      });

      expect(response.success).toBe(false);
      expect(response.message).toBe("Invalid WebRTC payload");
    });
  });

  // ==========================================
  // 3. SDP ANSWER
  // ==========================================

  describe("WebRTC SDP Answer", () => {
    test("should relay valid SDP answer to peer", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const answerPromise = waitForEvent(interviewerClient, "webrtc:answer");

      const sdp = {
        type: "answer",
        sdp: "v=0\r\no=- 123 456 IN IP4 127.0.0.1",
      };

      const response = await emitWithAck(candidateClient, "webrtc:answer", {
        peerId: interviewerClient.id,
        sdp,
      });

      expect(response.success).toBe(true);

      const receivedAnswer = await answerPromise;

      expect(receivedAnswer.peerId).toBe(candidateClient.id);
      expect(receivedAnswer.sdp).toEqual(sdp);
    });

    test("should reject invalid SDP answer", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const response = await emitWithAck(candidateClient, "webrtc:answer", {
        peerId: interviewerClient.id,
        sdp: {
          type: "offer",
          sdp: "invalid answer",
        },
      });

      expect(response.success).toBe(false);
    });
  });

  // ==========================================
  // 4. ICE CANDIDATE
  // ==========================================

  describe("WebRTC ICE Candidate", () => {
    test("should relay valid ICE candidate to peer", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const candidatePromise = waitForEvent(
        candidateClient,
        "webrtc:ice-candidate",
      );

      const iceCandidate = {
        candidate: "candidate:1 1 UDP 2122260223 192.168.1.1 5000 typ host",
        sdpMid: "0",
        sdpMLineIndex: 0,
      };

      const response = await emitWithAck(
        interviewerClient,
        "webrtc:ice-candidate",
        {
          peerId: candidateClient.id,
          candidate: iceCandidate,
        },
      );

      expect(response.success).toBe(true);

      const receivedCandidate = await candidatePromise;

      expect(receivedCandidate.peerId).toBe(interviewerClient.id);

      expect(receivedCandidate.candidate).toEqual(iceCandidate);
    });

    test("should reject invalid ICE candidate", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const response = await emitWithAck(
        interviewerClient,
        "webrtc:ice-candidate",
        {
          peerId: candidateClient.id,
          candidate: {
            candidate: 123,
          },
        },
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe("Invalid WebRTC payload");
    });
  });

  // ==========================================
  // 5. PEER VALIDATION
  // ==========================================

  describe("WebRTC Peer Validation", () => {
    test("should reject signaling to an unknown peer", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await joinWebRTC(client, interview._id);

      const response = await emitWithAck(client, "webrtc:offer", {
        peerId: "unknown-peer",
        sdp: {
          type: "offer",
          sdp: "test",
        },
      });

      expect(response.success).toBe(false);

      expect(response.message).toBe(
        "Target peer is not in your interview room",
      );
    });


    test("should reject signaling to itself", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await joinWebRTC(client, interview._id);

      const response = await emitWithAck(client, "webrtc:offer", {
        peerId: client.id,
        sdp: {
          type: "offer",
          sdp: "test",
        },
      });

      expect(response.success).toBe(false);

      expect(response.message).toBe("Invalid target peer");
    });
  });

  // ==========================================
  // 6. LEAVE WEBRTC ROOM
  // ==========================================

  describe("WebRTC Room Leaving", () => {
    test("should notify peer when participant leaves", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const peerLeftPromise = waitForEvent(candidateClient, "webrtc:peer-left");

      interviewerClient.emit("webrtc:leave");

      const peerLeft = await peerLeftPromise;

      expect(peerLeft.peerId).toBe(interviewerClient.id);
    });

    test("should allow participant to rejoin after leaving", async () => {
      const client = await connectSuccessfully(interviewerToken);

      await joinWebRTC(client, interview._id);

      client.emit("webrtc:leave");

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await joinWebRTC(client, interview._id);

      expect(response.success).toBe(true);
    });

    test("should notify remaining peer when participant disconnects", async () => {
      const { interviewerClient, candidateClient } =
        await joinBothParticipants();

      const peerLeftPromise = waitForEvent(candidateClient, "webrtc:peer-left");

      const expectedPeerId = interviewerClient.id;

      interviewerClient.disconnect();

      const peerLeft = await peerLeftPromise;

      expect(peerLeft).toEqual({
        peerId: expectedPeerId,
      });
    });

    test("should allow reconnection after disconnect", async () => {
      const firstClient = await connectSuccessfully(interviewerToken);

      await joinWebRTC(firstClient, interview._id);

      firstClient.disconnect();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondClient = await connectSuccessfully(interviewerToken);

      const response = await joinWebRTC(secondClient, interview._id);

      expect(response.success).toBe(true);
    });
  });
});
