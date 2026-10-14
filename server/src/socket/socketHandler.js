const jwt = require("jsonwebtoken");
const User = require("../models/User");
const InterviewSession = require("../models/InterviewSession");
const { isValidObjectId } = require("mongoose");

const LANGUAGE_ALLOWLIST = new Set([
    "javascript",
    "python",
    "java",
    "cpp",
]);

const ROOM_PREFIX = "interview:";

const getRoomName = (interviewId)=>{
    return`${ROOM_PREFIX}${interviewId}`;
};

const isvalidObjectId = (id)=>{
    return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
};

const sendError = (ack,message) =>{
    if(typeof ack === "function"){
        ack({
            success:false,
            message,
        });
    }
};

const initializeSocket = (io) =>{
    //Authenticate every socket connection
    io.use(async (socket,next)=>{
        try{

            let token = socket.handshake.auth?.token;

            if(typeof token !== "string" || !token.trim()){
                return next(new Error("Authentication required"));
            }

            //also accept token prefixed with "Bearer "
            token = token.replace(/^Bearer\s+/i,"").trim();

            const decoded = jwt.verify(token,process.env.JWT_SECRET);

            if(!decoded.userId){
                return next(new Error("Invalid authentication token"));
            }

            //load the current user and role from mongo db
            const user = await User.findById(decoded.userId).select("_id name email role avatar");

            if(!user){
                return next(new Error("user no longer exists"));
            }

            socket.user = {
                userId:user._id.toString(),
                name:user.name,
                email:user.email,
                role:user.role,
                avatar:user.avatar
            };

            next();

        }catch(error){

            if(
                error.name ==="JsonWebTokenError" ||
                error.name === "TokenExpiredError"
            ){
                return next(new Error("Invalid or Expired authentication token"));
            }
             console.error("Socket authentication error:", error.message);

      next(new Error("Socket authentication failed"));

        }
    });

    io.on("connection",(socket)=>{
        console.log(`Socket connected: ${socket.id} , user: ${socket.user.userId}`);


        //join interview
        socket.io("interview:join",async (payload= {},ack)=>{
            try{
                const {interviewId} = payload;

                if(!isValidObjectId(interviewId)){
                    return sendError(ack,"Invalid interview ID");
                }

                const interview = await InterviewSession.findById(
                    interviewId
                ).select("interviewer candidate status title");

                if(!interview){
                    return sendError(ack,"Interview not found");
                }

                const userId = socket.user.userId;

                const isInterviewer = interview.interviewer.toString() === userId;

                const isCandidate = interview.candidate.toString() ===
                userId;

                const isAdmin = socket.user.role === "admin";

                if(!isInterviewer && !isCandidate && !isAdmin){
                    return sendError(ack,
                        "you do not have access to this interview"
                    );
                }

                if(interview.status === "cancelled"||interview.status ==="completed"){
                    return sendError(
                        ack,
                        "This interview is no longer active"
                    );
                }

                const roomName = getRoomName(interviewId);

                //avoid duplicate joins from the same socket
                if(socket.rooms.has(roomName)){
                    return typeof ack === "function"?
                    ack({
                        success:true,
                        message:"Already joined interview",
                        interviewId,
                        status:interview.status,

                    }):"undefined"
                }

                await socket.join(roomName);

                socket.emit("interview:joined", {
                    interviewId,
                    title:interview.title,
                    status:interview.status,
                });

                socket.to(roomName).emit("presence:user-joined", {
                    user:{
                        userId:socket.user.userId,
                        name:socket.user.name,
                        role:socket.user.role,
                    },
                });

                 if (typeof ack === "function") {
          ack({
            success: true,
            message: "Joined interview successfully",
            interviewId,
            status: interview.status,
          });
        }

            }catch(error){

                console.error("Socket room join error:", error.message);

                sendError(ack,"Failed to join interview");

            }
        });

        //disconnect

        socket.on("disconnecting", () =>{
            for(const room of socket.rooms){
                if(room.startsWith(ROOM_PREFIX)){
                    socket.to(room).emit("presence:user-left",{
                        user:{
                            userId:socket.user.userID,
                            name:socket.user.name,
                        },
                    });
                }
            }
        });

        socket.on("disconnect",(reason)=>{
            console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`)
        });

        //editor code sync
        socket.on("editor:change",(payload={},ack)=>{
            const {interviewId,code,language} = payload;

            if(!isValidObjectId(interviewId)){
                return sendError(ack,"Invalid interview ID");
            }

            if(typeof code !=="string"){
                return sendError(ack,"Code must be a string");
            }

            //keep code updates within a reasonalbe size

            if(Buffer.byteLength(code,"utf8")>50_000){
                return sendError(ack,"Code exceeds the maximum allowed size");
            }

            if(!LANGUAGE_ALLOWLIST.has(language)){
                return sendError(ack,"Unsupported programming language");
            }

            const roomName = getRoomName(interviewId);

            //Never broadcast to a room the socket hasn't joined
            if(!socket.rooms.has(roomName)){
                return sendError(ack,"join the interview befor editing");
            }

            //Broadcast to everyone else in this interview
            socket.to(roomName).emit("editor:change",{
                interviewId,
                code,
                language,
                updatedBy:socket.user.userId
            });

            if(typeof ack === "function"){
                ack({
                    success:true,
                    message:"Code update broadcast successfully"
                });
            }
        });

        //editor cursor sync
        socket.on("editor:cursor",(payload={},ack)=>{
            const {interviewId,position} = payload;

            if(!isValidObjectId(interviewId)){
                return sendError(ack,"Invalid Interview Id");
            }

            if(!position||
                !Number.isInteger(position.lineNumber)||
                !Number.isInteger(position.column)||
                position.lineNumber<1||
                position.column<1
            ){
                return sendError(ack,"Invalid cursor position");

            }

            const roomName = getRoomName(interviewId);

            if(!socket.rooms.has(roomName)){
                return sendError(ack,"Join interview before sharing a cursor");
            }

            socket.to(roomName).emit("editor:cursor",{
                interviewId,
                userId:socket.user.userId,
                name:socket.user.name,
                position :{
                    lineNumber:position.lineNumber,
                    column:position.column,
                },
            });

            if(typeof ack ==="function"){
                ack({
                    success:true
                });
            }
        });

        //programming language sync

        socket.on("editor:language",(payload={},ack)=>{
            const {interviewId,language} =payload;

            if(!isValidObjectId(interviewId)){
                return sendError(ack,"Invalid interview Id");
            }

            if(!LANGUAGE_ALLOWLIST.has(language)){
                return sendError(ack,"Unsupported language");
            }

            const roomName = getRoomName(interviewId);

            if(!socket.rooms.has(roomName)){
                return sendError(ack,"join interview before changing language");
            }

            socket.to(roomName).emit("editor:language",{
                interviewId,
                language,
                updatedBy:socket.user.userId,
            });

            if(typeof ack ==="function"){
                ack({success:true});
            }
        });
    });
};

module.exports = initializeSocket;