import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    if (userId) socket.emit("user:join", userId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinConversation = (conversationId) => {
  socket?.emit("conversation:join", conversationId);
};

export const leaveConversation = (conversationId) => {
  socket?.emit("conversation:leave", conversationId);
};

export const emitTypingStart = (conversationId, userId, userName) => {
  socket?.emit("typing:start", { conversationId, userId, userName });
};

export const emitTypingStop = (conversationId, userId) => {
  socket?.emit("typing:stop", { conversationId, userId });
};
