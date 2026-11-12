
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const createInterviewSocket = (token) => {
  if (!SOCKET_URL) {
    throw new Error("VITE_SOCKET_URL is not configured.");
  }

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  return io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
};
