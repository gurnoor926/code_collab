import { connectSocket, disconnectSocket } from "./services/socket";

const token = localStorage.getItem("token");

if (!token) {
  console.error("No JWT found. Log in first.");
} else {
  const socket = connectSocket(token);

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  window.disconnectCodeCollabSocket = disconnectSocket;
}