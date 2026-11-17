import { useCallback, useEffect, useRef, useState } from "react";
import { createInterviewSocket } from "../services/socketService";
import toast from "react-hot-toast";

function useInterviewSocket({ interviewId, currentUser }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);

  const participantIdsRef = useRef(new Set());
  const wasDisconnectedRef = useRef(false);

  const userId = currentUser?._id || currentUser?.id;

  const joinInterviewRoom = useCallback(
    (activeSocket, isActive) => {
      activeSocket
        .timeout(10000)
        .emit(
          "interview:join",
          { interviewId },
          (timeoutError, response) => {
            if (!isActive()) return;

            if (timeoutError) {
              setJoined(false);
              setError(
                "Joining the interview timed out. Please try again.",
              );
              return;
            }

            if (!response?.success) {
              participantIdsRef.current.clear();
              setJoined(false);
              setParticipants([]);
              setError(
                response?.message || "Unable to join interview.",
              );
              return;
            }

            const initialParticipants = response.participants || [];

            participantIdsRef.current = new Set(
              initialParticipants.map((participant) =>
                String(participant.userId || participant._id || participant.id),
              ),
            );

            setParticipants(initialParticipants);
            setJoined(true);
            setError("");

            if (wasDisconnectedRef.current) {
              toast.success(
                "Connection restored. Interview rejoined.",
              );
              wasDisconnectedRef.current = false;
            }
          },
        );
    },
    [interviewId],
  );

  useEffect(() => {
    if (!interviewId) return;

    let active = true;
    let activeSocket = null;

    const isActive = () => active;

    const token = localStorage.getItem("token");

    if (!token) {
      queueMicrotask(() => {
        if (active) {
          setError(
            "Authentication token not found. Please log in again.",
          );
        }
      });

      return () => {
        active = false;
      };
    }

    const isAuthenticationError = (message = "") =>
      /authentication required|invalid.*token|expired.*token|user no longer exists/i.test(
        message,
      );

    try {
      activeSocket = createInterviewSocket(token);

      queueMicrotask(() => {
        if (active) {
          setSocket(activeSocket);
        }
      });

      const handleConnect = () => {
        if (!active) return;

        console.log(
          "Interview socket connected:",
          activeSocket.id,
        );

        setConnected(true);
        setJoined(false);
        setError("");

        joinInterviewRoom(activeSocket, isActive);
      };

      const handleDisconnect = (reason) => {
        if (!active) return;

        console.log("Socket disconnected:", reason);

        wasDisconnectedRef.current = true;

        setConnected(false);
        setJoined(false);
        setParticipants([]);
        participantIdsRef.current.clear();

        // Socket.IO does not automatically reconnect after
        // a server-initiated disconnect.
        if (reason === "io server disconnect") {
          activeSocket.connect();
        }
      };

      const handleConnectError = (err) => {
        if (!active) return;

        console.error(
          "Socket connection error:",
          err.message,
        );

        setConnected(false);
        setJoined(false);
        setError(err.message || "Socket connection failed.");

        if (isAuthenticationError(err.message)) {
          activeSocket.io.reconnection(false);
          activeSocket.disconnect();

          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth:logout"));
        }
      };

      const handleReconnectAttempt = (attempt) => {
        console.log("Socket reconnect attempt:", attempt);
      };

      const handleReconnect = (attempt) => {
        console.log(
          "Socket transport reconnected after attempts:",
          attempt,
        );
        // The connect handler performs the actual room rejoin.
      };

      const handleReconnectError = (err) => {
        console.error("Socket reconnect error:", err.message);
      };

      const handleJoined = (data) => {
        if (!active) return;

        console.log("Interview room joined event:", data);
        // The acknowledgement in joinInterviewRoom is authoritative.
      };

      const handlePresenceJoined = ({ user } = {}) => {
        if (!active || !user) return;

        const participantId = String(user.userId || user._id || user.id || "");

        if (!participantId || participantId === String(userId)) return;

        const isNewParticipant = !participantIdsRef.current.has(participantId);
        participantIdsRef.current.add(participantId);

        setParticipants((previous) => {
          const filtered = previous.filter(
            (p) => String(p.userId || p._id || p.id) !== participantId,
          );
          return [...filtered, user];
        });

        if (isNewParticipant) {
          toast.success(
            `${user.name || "Participant"} joined the interview`,
          );
        }
      };

      const handlePresenceLeft = (data = {}) => {
        const user = data.user || data;

        if (!active || !user) return;

        const participantId = String(user.userId || user._id || user.id || "");

        if (!participantId) return;

        participantIdsRef.current.delete(participantId);

        setParticipants((previous) =>
          previous.filter(
            (participant) =>
              String(participant.userId || participant._id || participant.id) !== participantId,
          ),
        );
      };

      const handleServerError = (data) => {
        if (!active) return;

        console.error("Interview socket error:", data);

        setError(data?.message || "Interview socket error.");
      };

      activeSocket.on("connect", handleConnect);
      activeSocket.on("disconnect", handleDisconnect);
      activeSocket.on("connect_error", handleConnectError);
      activeSocket.on("interview:joined", handleJoined);
      activeSocket.on(
        "presence:user-joined",
        handlePresenceJoined,
      );
      activeSocket.on(
        "presence:user-left",
        handlePresenceLeft,
      );
      activeSocket.on("interview:error", handleServerError);

      activeSocket.io.on(
        "reconnect_attempt",
        handleReconnectAttempt,
      );
      activeSocket.io.on("reconnect", handleReconnect);
      activeSocket.io.on(
        "reconnect_error",
        handleReconnectError,
      );

      console.log("Connecting to interview socket...");
      activeSocket.connect();

      return () => {
        active = false;

        console.log(
          "Interview socket cleanup:",
          activeSocket.id,
        );

        activeSocket.off("connect", handleConnect);
        activeSocket.off("disconnect", handleDisconnect);
        activeSocket.off(
          "connect_error",
          handleConnectError,
        );
        activeSocket.off("interview:joined", handleJoined);
        activeSocket.off(
          "presence:user-joined",
          handlePresenceJoined,
        );
        activeSocket.off(
          "presence:user-left",
          handlePresenceLeft,
        );
        activeSocket.off(
          "interview:error",
          handleServerError,
        );

        activeSocket.io.off(
          "reconnect_attempt",
          handleReconnectAttempt,
        );
        activeSocket.io.off("reconnect", handleReconnect);
        activeSocket.io.off(
          "reconnect_error",
          handleReconnectError,
        );

        activeSocket.disconnect();
      };
    } catch (err) {
      console.error("Socket initialization error:", err);

      queueMicrotask(() => {
        if (active) {
          setError(
            err.message || "Unable to initialize socket.",
          );
        }
      });

      return () => {
        active = false;
      };
    }
  }, [interviewId, userId, joinInterviewRoom]);

  return {
    socket,
    connected,
    joined,
    error,
    participants,
  };
}

export default useInterviewSocket;