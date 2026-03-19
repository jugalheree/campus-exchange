import "./config/env.js"; // MUST be first

import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Store io instance globally so controllers can use it
global.io = io;

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins with their userId
  socket.on("user:join", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // join a room named after their userId
    console.log(`User ${userId} joined, online: ${onlineUsers.size}`);

    // Broadcast updated online users list
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  // User joins a conversation room
  socket.on("conversation:join", (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  // User leaves a conversation room
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  // Typing indicators
  socket.on("typing:start", ({ conversationId, userId, userName }) => {
    socket.to(`conv:${conversationId}`).emit("typing:start", { userId, userName });
  });

  socket.on("typing:stop", ({ conversationId, userId }) => {
    socket.to(`conv:${conversationId}`).emit("typing:stop", { userId });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove user from online map
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected, online: ${onlineUsers.size}`);
        break;
      }
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });
});

connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready`);
});
