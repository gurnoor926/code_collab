import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL||"http:localhost:3000";

let socket;

export const connectSocket = (token) => {
    if(!token){
        throw new Error("Authentication token is required");
    }

    if(socket){
        if(socket.connected){
            return socket;
        }
        socket.auth = {token};
        socket.connect();

        return socket;
    }

    socket = io(SOCKET_URL,{
        autoConnect:false,
        auth:{
            token,
        },
        reconnection:true,
        reconnectionAttempts:5,
        reconnectionDelay:1000,
    });

    socket.connect();

    return socket;
};

export const getSocket = () => socket;

export const disconnctSocket = () => {
    if(socket){
        socket.disconnct();
        socket = undefined;
    }
};