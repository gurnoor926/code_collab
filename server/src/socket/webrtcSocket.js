const mongoose = require("mongoose");
const InterviewSession = require("../models/InterviewSession");

const MAX_SDP_LENGTH = 100_000;
const MAX_CANDIDATE_LENGTH = 4_000;
const MAX_PEERS_PER_ROOM = 2;

const socketRooms = new Map();
const roomPeers = new Map();

const getRoomName = (interviewId) => `webrtc:${interviewId}`;

const emitError = (socket, message) => {
    socket.emit("webrtc:error", {
        success: false,
        message,
    });
};

const isValidInterviewId = (id) =>
    typeof id === "string" &&
    mongoose.isValidObjectId(id);

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
    if (!interview || !user) {
        return false;
    }

    const userId = String(user.userId);

    return (
        user.role === "admin" ||
        String(interview.interviewer) === userId ||
        String(interview.candidate || "") === userId
    );
};

const registerWebRTCHandlers = (io, socket) => {
    socket.on("webrtc:join", async (payload = {}, ack) => {
        try {
            const { interviewId } = payload;

            if (!isValidInterviewId(interviewId)) {
                return emitError(socket, "Invalid interview ID");
            }

            const currentRoom = socketRooms.get(socket.id);

            if (currentRoom) {
                if (currentRoom === interviewId) {
                    if (typeof ack === "function") {
                        return ack({
                            success: true,
                            message: "Already joined WebRTC room",
                        });
                    }

                    return;
                }

                return emitError(
                    socket,
                    "Leave the current WebRTC room first"
                );
            }

            const interview = await InterviewSession.findById(
                interviewId
            )
                .select("_id interviewer candidate status")
                .lean();

            if (!interview) {
                return emitError(socket, "Interview not found");
            }

            if (!canAccessInterview(interview, socket.user)) {
                return emitError(
                    socket,
                    "You are not authorized for this interview"
                );
            }

            if (!["waiting", "active"].includes(interview.status)) {
                return emitError(
                    socket,
                    "This interview is not open for WebRTC"
                );
            }

            // Only the assigned interviewer and candidate participate
            // in the audio/video call. Admins can manage interviews but
            // cannot occupy a media participant slot.
            const userId = String(socket.user.userId);

            const isInterviewer =
                String(interview.interviewer) === userId;

            const isCandidate =
                String(interview.candidate || "") === userId;

            if (!isInterviewer && !isCandidate) {
                return emitError(
                    socket,
                    "Only the interviewer and assigned candidate can join the call"
                );
            }

            const peers =
                roomPeers.get(interviewId) || new Map();

            // Prevent two simultaneous connections for the same user
            // from occupying both participant slots.
            const alreadyConnected = Array.from(peers.values()).some(
                (peer) => peer.userId === userId
            );

            if (alreadyConnected) {
                return emitError(
                    socket,
                    "This user already has a connection in the interview call"
                );
            }

            if (peers.size >= MAX_PEERS_PER_ROOM) {
                return emitError(
                    socket,
                    "The interview call already has two participants"
                );
            }

            const roomName = getRoomName(interviewId);

            const existingPeers = Array.from(peers.values()).map(
                (peer) => ({
                    peerId: peer.socketId,
                    userId: peer.userId,
                    name: peer.name,
                })
            );

            const peer = {
                socketId: socket.id,
                userId,
                name: socket.user.name,
            };

            await socket.join(roomName);

            if (!roomPeers.has(interviewId)) {
                roomPeers.set(interviewId, peers);
            }

            peers.set(socket.id, peer);
            socketRooms.set(socket.id, interviewId);

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
            });
        } catch (error) {
            console.error("WebRTC join error:", error.message);

            emitError(socket, "Failed to join WebRTC room");
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

    socket.on("webrtc:answer", (payload = {} ,ack) => {
        relayToPeer({
            io,
            socket,
            payload,
            eventName: "webrtc:answer",
            validate: (data) => isValidSdp(data.sdp, "answer"),
            ack,
        });
    });

    socket.on("webrtc:ice-candidate", (payload = {} ,ack) => {
        relayToPeer({
            io,
            socket,
            payload,
            eventName: "webrtc:ice-candidate",
            validate: (data) => isValidCandidate(data.candidate),
            ack,
        });
    });

    socket.on("webrtc:leave", () => {
        leaveWebRTCRoom(socket);
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

    if (
        typeof peerId !== "string" ||
        peerId === socket.id
    ) {
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
            "Target peer is not in your interview room"
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

    return respond(true, "Signaling message relayed successfully");
};

const leaveWebRTCRoom = (socket) => {
    const interviewId = socketRooms.get(socket.id);

    if (!interviewId) {
        return;
    }

    const roomName = getRoomName(interviewId);
    const peers = roomPeers.get(interviewId);

    socketRooms.delete(socket.id);

    if (peers) {
        peers.delete(socket.id);

        if (peers.size === 0) {
            roomPeers.delete(interviewId);
        }
    }

    socket.leave(roomName);

    // Broadcast to remaining peers, excluding the departing socket.
    socket.to(roomName).emit("webrtc:peer-left", {
        peerId: socket.id,
    });
};

module.exports = registerWebRTCHandlers;