import express from "express";
import {
  sendMessage, getMessages, getConversations, markAsRead,
  deleteMessage, blockUser, unblockUser, searchConversations,
  getUnreadCount, startConversation,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", sendMessage);
router.post("/conversation/start", startConversation);   // ← new
router.get("/conversations", getConversations);
router.get("/unread", getUnreadCount);
router.get("/search", searchConversations);
router.get("/:conversationId", getMessages);
router.put("/:conversationId/read", markAsRead);
router.delete("/:messageId", deleteMessage);
router.post("/block/:userId", blockUser);
router.delete("/block/:userId", unblockUser);

export default router;
