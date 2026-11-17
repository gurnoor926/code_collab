require("dotenv").config();

const http = require("http");
const {Server} = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const initializeSocket = require("./socket/socketHandler");
const {
  initializeNotificationSocket,
} = require("./socket/notificationSocket");

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const allowedOrigins = (
    process.env.CLIENT_URL || "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            if (process.env.NODE_ENV !== "production") {
                if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }
            }
            return callback(new Error("Not allowed by CORS"), false);
        },
        methods: ["GET", "POST"],
        credentials: true
    },

    maxHttpBufferSize: 100_000,

    pingInterval:25_000,
    pingTimeout:20_000,
});

//Register Socket.io event handlers
initializeSocket(io);
initializeNotificationSocket(io);

const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () =>{
            console.log(`Server running on port ${PORT}`);
            console.log("Socket.io initialized successfully");
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();