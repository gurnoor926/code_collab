const mongoose = require("mongoose");
const InterviewSession = require("../models/InterviewSession");

const MAX_SDP_LENGTH = 100_000;
const MAX_CANDIDATE_LENGTH = 4_000;
const MAX_PEERS_PER_ROOM = 2;

const socketRooms = new Map();
const roomPeers = new Map();
const pendingJoins = new Set();

const getRoomName = (interviewId) => `webrtc:${interviewId}`;

const emitError = (socket, message, ack) => {
  const response = {
    success: false,
    message,
  };

  if (typeof ack === "function") {
    ack(response);
  }

  socket.emit("webrtc:error", response);
};

const isValidInterviewId = (id) =>
  typeof id === "string" && mongoose.isValidObjectId(id);

const isValidSdp = (sdp, expectedType) =>
  sdp !== null &&
  typeof sdp === "object" &&
  sdp.type === expectedType &&
  typeof sdp.sdp === "string" &&
  sdp.sdp.length > 0 &&
  sdp.sdp.length <= MAX_SDP_LENGTH;

const isValidCandidate = (candidate) =>
  candidate !== null &&
  typeof candidate === "object" &&
  typeof candidate.candidate === "string" &&
  candidate.candidate.length <= MAX_CANDIDATE_LENGTH;

const canAccessInterview = (interview, user) => {
  if (!interview || !user) return false;

  const userId = String(user.userId);

  return (
    user.role === "admin" ||
    String(interview.interviewer) === userId ||
    String(interview.candidate || "") === userId
  );
};

const getExistingPeers = (peers, currentSocketId) =>
  Array.from(peers?.values() || [])
    .filter((peer) => peer.socketId !== currentSocketId)
    .map((peer) => ({
      peerId: peer.socketId,
      userId: peer.userId,
      name: peer.name,
      cameraEnabled: peer.cameraEnabled,
      micEnabled: peer.micEnabled,
    }));

const registerWebRTCHandlers = (io, socket) => {
  socket.on("webrtc:join", async (payload = {}, ack) => {
    // Prevent concurrent join attempts from the same socket.
    if (pendingJoins.has(socket.id)) {
      return emitError(
        socket,
        "A WebRTC join request is already being processed.",
        ack,
      );
    }

    pendingJoins.add(socket.id);

    try {
      const {
        interviewId,
        cameraEnabled = true,
        micEnabled = true,
      } = payload;

      if (!isValidInterviewId(interviewId)) {
        return emitError(socket, "Invalid interview ID", ack);
      }

      if (
        typeof cameraEnabled !== "boolean" ||
        typeof micEnabled !== "boolean"
      ) {
        return emitError(
          socket,
          "Invalid initial media state",
          ack,
        );
      }

      const currentRoom = socketRooms.get(socket.id);

      // Rejoining the same room returns the current peer list.
      if (currentRoom) {
        if (currentRoom === interviewId) {
          const peers = roomPeers.get(interviewId);

          const response = {
            success: true,
            message: "Already joined WebRTC room",
            interviewId,
            peers: getExistingPeers(peers, socket.id),
          };

          if (typeof ack === "function") {
            return ack(response);
          }

          return socket.emit("webrtc:joined", response);
        }

        return emitError(
          socket,
          "Leave the current WebRTC room first",
          ack,
        );
      }

      const interview = await InterviewSession.findById(interviewId)
        .select("_id interviewer candidate status")
        .lean();

      if (!interview) {
        return emitError(socket, "Interview not found", ack);
      }

      if (!canAccessInterview(interview, socket.user)) {
        return emitError(
          socket,
          "You are not authorized for this interview",
          ack,
        );
      }

      if (!["waiting", "active"].includes(interview.status)) {
        return emitError(
          socket,
          "This interview is not open for WebRTC",
          ack,
        );
      }

      const userId = String(socket.user.userId);
      const isInterviewer =
        String(interview.interviewer) === userId;
      const isCandidate =
        String(interview.candidate || "") === userId;

      if (!isInterviewer && !isCandidate) {
        return emitError(
          socket,
          "Only the interviewer and assigned candidate can join the call",
          ack,
        );
      }

      // Recheck after the database await, since another request
      // from this socket may have changed its room membership.
      const latestRoom = socketRooms.get(socket.id);

      if (latestRoom) {
        if (latestRoom === interviewId) {
          const currentPeers = roomPeers.get(interviewId);

          const response = {
            success: true,
            message: "Already joined WebRTC room",
            interviewId,
            peers: getExistingPeers(currentPeers, socket.id),
          };

          if (typeof ack === "function") {
            return ack(response);
          }

          return socket.emit("webrtc:joined", response);
        }

        return emitError(
          socket,
          "Leave the current WebRTC room first",
          ack,
        );
      }

      const peers = roomPeers.get(interviewId) || new Map();
      const roomName = getRoomName(interviewId);

      // If this user already has an existing connection in the room (e.g. from
      // a previous socket before connection was lost and restored, or a refreshed tab),
      // clean up and replace the stale connection.
      const existingUserPeer = Array.from(peers.values()).find(
        (peer) => peer.userId === userId,
      );

      if (existingUserPeer) {
        const oldSocketId = existingUserPeer.socketId;

        peers.delete(oldSocketId);
        socketRooms.delete(oldSocketId);

        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          try {
            oldSocket.leave(roomName);
            emitError(
              oldSocket,
              "Your connection was replaced by a newer session",
            );
          } catch (e) {
            // ignore
          }
        }

        // Notify the remaining peer that the old socket disconnected
        socket.to(roomName).emit("webrtc:peer-left", {
          peerId: oldSocketId,
        });
      }

      // Check if the call already has maximum allowed other participants
      const otherPeers = Array.from(peers.values()).filter(
        (peer) => peer.userId !== userId,
      );

      if (otherPeers.length >= MAX_PEERS_PER_ROOM) {
        return emitError(
          socket,
          "The interview call already has two participants",
          ack,
        );
      }

      const existingPeers = getExistingPeers(peers, socket.id);

      const peer = {
        socketId: socket.id,
        userId,
        name: socket.user.name,
        cameraEnabled,
        micEnabled,
      };

      // Reserve the participant slot before awaiting socket.join().
      // This prevents concurrent sockets from exceeding the room limit.
      if (!roomPeers.has(interviewId)) {
        roomPeers.set(interviewId, peers);
      }

      peers.set(socket.id, peer);
      socketRooms.set(socket.id, interviewId);

      try {
        await socket.join(roomName);
      } catch (joinError) {
        socketRooms.delete(socket.id);
        peers.delete(socket.id);

        if (peers.size === 0) {
          roomPeers.delete(interviewId);
        }

        throw joinError;
      }

      // A disconnect may have happened while socket.join was pending.
      if (!socket.connected) {
        leaveWebRTCRoom(socket);

        return emitError(
          socket,
          "Socket disconnected while joining the call",
          ack,
        );
      }

      const response = {
        success: true,
        interviewId,
        peers: existingPeers,
      };

      socket.emit("webrtc:joined", response);

      if (typeof ack === "function") {
        ack(response);
      }

      socket.to(roomName).emit("webrtc:peer-joined", {
        peerId: socket.id,
        userId: peer.userId,
        name: peer.name,
        cameraEnabled: peer.cameraEnabled,
        micEnabled: peer.micEnabled,
      });
    } catch (error) {
      console.error("WebRTC join error:", error);

      emitError(
        socket,
        "Failed to join WebRTC room",
        ack,
      );
    } finally {
      pendingJoins.delete(socket.id);
    }
  });

  socket.on("webrtc:offer", (payload = {}, ack) => {
    relayToPeer({
      io,
      socket,
      payload,
      eventName: "webrtc:offer",
      validate: (data) => isValidSdp(data.sdp, "offer"),
      ack,
    });
  });

  socket.on("webrtc:answer", (payload = {}, ack) => {
    relayToPeer({
      io,
      socket,
      payload,
      eventName: "webrtc:answer",
      validate: (data) => isValidSdp(data.sdp, "answer"),
      ack,
    });
  });

  socket.on("webrtc:ice-candidate", (payload = {}, ack) => {
    relayToPeer({
      io,
      socket,
      payload,
      eventName: "webrtc:ice-candidate",
      validate: (data) => isValidCandidate(data.candidate),
      ack,
    });
  });

  socket.on("webrtc:camera-state", (payload = {}, ack) => {
    const { peerId, cameraEnabled } = payload;
    const interviewId = socketRooms.get(socket.id);

    if (!interviewId) {
      return ack?.({
        success: false,
        message: "Join a WebRTC room first",
      });
    }

    if (typeof cameraEnabled !== "boolean") {
      return ack?.({
        success: false,
        message: "Invalid camera state payload",
      });
    }

    const peers = roomPeers.get(interviewId);
    const currentPeer = peers?.get(socket.id);

    if (!currentPeer) {
      return ack?.({
        success: false,
        message: "Peer not found in interview room",
      });
    }

    currentPeer.cameraEnabled = cameraEnabled;

    if (!peerId) {
      return ack?.({ success: true });
    }

    if (
      typeof peerId !== "string" ||
      !peers.has(peerId) ||
      peerId === socket.id
    ) {
      return ack?.({
        success: false,
        message: "Target peer is not in your interview room",
      });
    }

    io.to(peerId).emit("webrtc:camera-state", {
      peerId: socket.id,
      cameraEnabled,
    });

    ack?.({ success: true });
  });

  socket.on("webrtc:mic-state", (payload = {}, ack) => {
    const { peerId, micEnabled } = payload;
    const interviewId = socketRooms.get(socket.id);

    if (!interviewId) {
      return ack?.({
        success: false,
        message: "Join a WebRTC room first",
      });
    }

    if (typeof micEnabled !== "boolean") {
      return ack?.({
        success: false,
        message: "Invalid microphone state payload",
      });
    }

    const peers = roomPeers.get(interviewId);
    const currentPeer = peers?.get(socket.id);

    if (!currentPeer) {
      return ack?.({
        success: false,
        message: "Peer not found in interview room",
      });
    }

    currentPeer.micEnabled = micEnabled;

    if (!peerId) {
      return ack?.({ success: true });
    }

    if (
      typeof peerId !== "string" ||
      !peers.has(peerId) ||
      peerId === socket.id
    ) {
      return ack?.({
        success: false,
        message: "Target peer is not in your interview room",
      });
    }

    io.to(peerId).emit("webrtc:mic-state", {
      peerId: socket.id,
      micEnabled,
    });

    ack?.({ success: true });
  });

  socket.on("webrtc:leave", (ack) => {
    leaveWebRTCRoom(socket);

    if (typeof ack === "function") {
      ack({ success: true });
    }
  });

  socket.on("disconnecting", () => {
    leaveWebRTCRoom(socket);
  });
};

const relayToPeer = ({
  io,
  socket,
  payload,
  eventName,
  validate,
  ack,
}) => {
  const respond = (success, message) => {
    if (typeof ack === "function") {
      ack({ success, message });
    }
  };

  const interviewId = socketRooms.get(socket.id);

  if (!interviewId) {
    return respond(false, "Join a WebRTC room first");
  }

  if (!payload || !validate(payload)) {
    return respond(false, "Invalid WebRTC payload");
  }

  const { peerId } = payload;

  if (typeof peerId !== "string" || peerId === socket.id) {
    return respond(false, "Invalid target peer");
  }

  const peers = roomPeers.get(interviewId);

  if (
    !peers ||
    !peers.has(socket.id) ||
    !peers.has(peerId)
  ) {
    return respond(
      false,
      "Target peer is not in your interview room",
    );
  }

  const message = {
    peerId: socket.id,
  };

  if (
    eventName === "webrtc:offer" ||
    eventName === "webrtc:answer"
  ) {
    message.sdp = payload.sdp;
  } else {
    message.candidate = payload.candidate;
  }

  io.to(peerId).emit(eventName, message);

  return respond(
    true,
    "Signaling message relayed successfully",
  );
};

const leaveWebRTCRoom = (socket) => {
  const interviewId = socketRooms.get(socket.id);

  if (!interviewId) return;

  const roomName = getRoomName(interviewId);
  const peers = roomPeers.get(interviewId);

  // Make cleanup idempotent.
  socketRooms.delete(socket.id);

  if (peers) {
    peers.delete(socket.id);

    if (peers.size === 0) {
      roomPeers.delete(interviewId);
    }
  }

  socket.leave(roomName);

  socket.to(roomName).emit("webrtc:peer-left", {
    peerId: socket.id,
  });
};

module.exports = registerWebRTCHandlers;