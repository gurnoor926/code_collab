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

const io = new Server(httpServer,{
    cors:{
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods:["GET","POST"],
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