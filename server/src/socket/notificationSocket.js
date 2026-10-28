let ioInstance = null;

const initializeNotificationSocket = (io) => {
    ioInstance = io;
};

const emitNotifications = (userId ,  notification) => {
    if(!ioInstance){
        console.warn("Socket.IO is not initialized; Notification was not emitted");
        return false;
    }

    if(!userId || !notification){
        return false;
    }

    ioInstance.to(`user:${userId.toString()}`).emit("notification:new", notification);

    return true;
};

module.exports = {
    initializeNotificationSocket,
    emitNotifications,
};