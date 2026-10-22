const { io } = require("socket.io-client");
const readline = require("readline");

const SERVER_URL = "http://localhost:3000";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function main() {
  const token = (await ask("Enter JWT token: ")).trim();
  const interviewId = (await ask("Enter interview ID: ")).trim();

  if (!token || !interviewId) {
    console.error("JWT token and interview ID are required.");
    rl.close();
    return;
  }

  const socket = io(SERVER_URL, {
    auth: { token: token.trim() },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("webrtc:join", { interviewId }, (response) => {
      console.log("Join acknowledgement:", JSON.stringify(response, null, 2));
    });
  });

  socket.on("webrtc:joined", (data) => {
    console.log("Joined WebRTC room:", JSON.stringify(data, null, 2));
  });

  socket.on("webrtc:peer-joined", (data) => {
    console.log("Peer joined:", data);
  });

  socket.on("webrtc:offer", (data) => {
    console.log("Received offer:", data);
  });

  socket.on("webrtc:answer", (data) => {
    console.log("Received answer:", data);
  });

  socket.on("webrtc:ice-candidate", (data) => {
    console.log("Received ICE candidate:", data);
  });

  socket.on("webrtc:peer-left", (data) => {
    console.log("Peer left:", data);
  });

  socket.on("webrtc:error", (data) => {
    console.error("WebRTC error:", data);
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
  });

  console.log("\nCommands:");
  console.log("offer    - Send a test SDP offer");
  console.log("answer   - Send a test SDP answer");
  console.log("candidate - Send a test ICE candidate");
  console.log("leave    - Leave the WebRTC room");
  console.log("exit     - Disconnect and quit");

  rl.on("line", (line) => {
    const [command, peerId] = line.trim().split(/\s+/);

    if (command === "offer") {
      if (!peerId) {
        console.log("Usage: offer PEER_SOCKET_ID");
        return;
      }

      socket.emit(
        "webrtc:offer",
        {
          peerId,
          sdp: {
            type: "offer",
            sdp: "test-sdp",
          },
        },
        (response) => {
          console.log("Offer relay result:", response);
        },
      );
    } else if (command === "answer") {
      if (!peerId) {
        console.log("Usage: answer PEER_SOCKET_ID");
        return;
      }

      socket.emit("webrtc:answer", {
        peerId,
        sdp: {
          type: "answer",
          sdp: "test-sdp",
        },
      });
    } else if (command === "candidate") {
      if (!peerId) {
        console.log("Usage: candidate PEER_SOCKET_ID");
        return;
      }

      socket.emit("webrtc:ice-candidate", {
        peerId,
        candidate: {
          candidate: "test-candidate",
        },
      });
    } else if (command === "leave") {
      socket.emit("webrtc:leave");
      console.log("Leave requested.");
    } else if (command === "exit") {
      socket.disconnect();
      rl.close();
      process.exit(0);
    } else {
      console.log("Unknown command.");
    }
  });
}

main().catch((error) => {
  console.error(error);
  rl.close();
});
