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

  const userId = currentUser?._id || currentUser?.id;

  const joinInterviewRoom = useCallback(
  (activeSocket) => {
    console.log("Joining interview room:", interviewId);

    activeSocket.emit("interview:join", { interviewId }, (response) => {
      console.log("Interview join response:", response);

      if (!response?.success) {
        participantIdsRef.current.clear();
        setJoined(false);
        setParticipants([]);
        setError(response?.message || "Unable to join interview.");
        return;
      }

      const initialParticipants = response.participants || [];

      participantIdsRef.current = new Set(
        initialParticipants.map((participant) =>
          String(participant.userId),
        ),
      );

      setParticipants(initialParticipants);
      setJoined(true);
      setError("");
    });
  },
  [interviewId],
);

  useEffect(() => {
    if (!interviewId) return;

    let active = true;
    let activeSocket = null;
    let socketUpdateTimeout = null;
    let errorTimeout = null;

    const token = localStorage.getItem("token");

    if (!token) {
      errorTimeout = setTimeout(() => {
        if (active) {
          setError("Authentication token not found. Please log in again.");
        }
      }, 0);

      return () => {
        active = false;
        clearTimeout(errorTimeout);
      };
    }

    try {
      activeSocket = createInterviewSocket(token);

      // Update socket state asynchronously to satisfy the React Hooks lint rule.
      socketUpdateTimeout = setTimeout(() => {
        if (active) {
          setSocket(activeSocket);
        }
      }, 0);

      // Connection established.
      const handleConnect = () => {
        if (!active) return;

        console.log("Interview socket connected:", activeSocket.id);
        console.log("CONNECTED USER:", {
          socketId: activeSocket.id,
          interviewId,
          userId,
        });

        setConnected(true);
        setJoined(false);
        setError("");

        joinInterviewRoom(activeSocket);
      };

      // Connection disconnected.
      const handleDisconnect = (reason) => {
        if (!active) return;

        console.log("Socket disconnected:", reason);

        setConnected(false);
        setJoined(false);
        setParticipants([]);
        participantIdsRef.current.clear();

        if (reason === "io server disconnect") {
          console.log("Server disconnected socket. Attempting reconnection...");
          activeSocket.connect();
        }
      };

      // Connection error.
      const handleConnectError = (err) => {
        if (!active) return;

        console.error("Socket connection error:", {
          message: err.message,
          description: err.description,
          context: err.context,
        });

        setConnected(false);
        setJoined(false);
        setError(err.message || "Socket connection failed.");
      };

      // Reconnection diagnostics.
      const handleReconnectAttempt = (attempt) => {
        console.log("Socket reconnect attempt:", attempt);
      };

     const handleReconnect = (attempt) => {
  console.log("Socket reconnected after attempts:", attempt);
  toast.success("Connection restored. Rejoining interview...");
};

      const handleReconnectError = (err) => {
        console.error("Socket reconnect error:", err.message);
      };

      // Interview room joined.
      const handleJoined = (data) => {
        if (!active) return;

        console.log("Interview room joined event:", data);

        setJoined(true);
        setError("");
      };

      // Another participant joined.
     const handlePresenceJoined = ({ user } = {}) => {
  if (!active || !user?.userId) return;

  const participantId = String(user.userId);

  if (participantId === String(userId)) return;

  // Ignore duplicate presence events.
  if (participantIdsRef.current.has(participantId)) return;

  // Track the participant before updating React state.
  participantIdsRef.current.add(participantId);

  // Keep the state updater pure.
  setParticipants((previous) => [...previous, user]);

  // Side effects belong outside the state updater.
  toast.success(`${user.name || "Participant"} joined the interview`);
};

      // Backend sends userId and name directly in presence:user-left.
      const handlePresenceLeft = (data = {}) => {
  const user = data.user || data;

  if (!active || !user.userId) return;

  const participantId = String(user.userId);

  participantIdsRef.current.delete(participantId);

  setParticipants((previous) =>
    previous.filter(
      (participant) => String(participant.userId) !== participantId,
    ),
  );
};

      // Server-side interview error.
      const handleServerError = (data) => {
        if (!active) return;

        console.error("Interview socket error:", data);

        setError(data?.message || "Interview socket error.");
      };

      // Register Socket.IO event listeners.
      activeSocket.on("connect", handleConnect);
      activeSocket.on("disconnect", handleDisconnect);
      activeSocket.on("connect_error", handleConnectError);
      activeSocket.on("interview:joined", handleJoined);
      activeSocket.on("presence:user-joined", handlePresenceJoined);
      activeSocket.on("presence:user-left", handlePresenceLeft);
      activeSocket.on("interview:error", handleServerError);

      activeSocket.io.on("reconnect_attempt", handleReconnectAttempt);
      activeSocket.io.on("reconnect", handleReconnect);
      activeSocket.io.on("reconnect_error", handleReconnectError);

      // Connect to the backend.
      console.log("Connecting to interview socket...");
      activeSocket.connect();

      return () => {
        active = false;

        if (socketUpdateTimeout) {
          clearTimeout(socketUpdateTimeout);
        }

        if (errorTimeout) {
          clearTimeout(errorTimeout);
        }

        if (!activeSocket) return;

        console.log("Interview socket cleanup:", activeSocket.id);

        // Remove Socket.IO event listeners.
        activeSocket.off("connect", handleConnect);
        activeSocket.off("disconnect", handleDisconnect);
        activeSocket.off("connect_error", handleConnectError);
        activeSocket.off("interview:joined", handleJoined);
        activeSocket.off("presence:user-joined", handlePresenceJoined);
        activeSocket.off("presence:user-left", handlePresenceLeft);
        activeSocket.off("interview:error", handleServerError);

        activeSocket.io.off("reconnect_attempt", handleReconnectAttempt);
        activeSocket.io.off("reconnect", handleReconnect);
        activeSocket.io.off("reconnect_error", handleReconnectError);

        // Disconnect this component's socket.
        activeSocket.disconnect();
      };
    } catch (err) {
      console.error("Socket initialization error:", err);

      errorTimeout = setTimeout(() => {
        if (active) {
          setError(err.message || "Unable to initialize socket.");
        }
      }, 0);

      return () => {
        active = false;
        clearTimeout(errorTimeout);
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
