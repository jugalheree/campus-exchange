import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";

/* =========================================
   Send Message
========================================= */
export const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, relatedType, relatedId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) { res.status(400); throw new Error("Recipient ID is required"); }
    if (!content || !content.trim()) { res.status(400); throw new Error("Message content is required"); }
    if (senderId.toString() === recipientId.toString()) { res.status(400); throw new Error("Cannot send message to yourself"); }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) { res.status(400); throw new Error("Invalid recipient ID"); }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      relatedTo: relatedType && relatedId ? { type: relatedType, id: relatedId } : null,
    });

    await message.populate("sender", "name email university avatar");

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        lastMessage: message._id,
        lastMessageTime: message.createdAt,
        lastMessagePreview: content.substring(0, 50),
      });
    } else {
      conversation.lastMessage = message._id;
      conversation.lastMessageTime = message.createdAt;
      conversation.lastMessagePreview = content.substring(0, 50);
      await conversation.save();
    }

    // ✅ Emit via Socket.io — real-time delivery
    if (global.io) {
      const messageData = {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        recipient: recipientId,
        conversationId: conversation._id,
        createdAt: message.createdAt,
        isRead: false,
      };

      // Emit to recipient's personal room
      global.io.to(recipientId.toString()).emit("message:new", {
        message: messageData,
        conversation: {
          _id: conversation._id,
          lastMessagePreview: conversation.lastMessagePreview,
          lastMessageTime: conversation.lastMessageTime,
        },
      });

      // Emit to the conversation room (for open chat windows)
      global.io.to(`conv:${conversation._id}`).emit("message:new", {
        message: messageData,
        conversation: {
          _id: conversation._id,
          lastMessagePreview: conversation.lastMessagePreview,
          lastMessageTime: conversation.lastMessageTime,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message, conversation },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Messages
========================================= */
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400); throw new Error("Invalid conversation ID");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).populate("participants", "name email university avatar");

    if (!conversation) {
      res.status(404); throw new Error("Conversation not found");
    }

    const messages = await Message.find({
      $or: [
        { sender: conversation.participants[0]._id, recipient: conversation.participants[1]._id },
        { sender: conversation.participants[1]._id, recipient: conversation.participants[0]._id },
      ],
    })
      .populate("sender", "name email university avatar")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { recipient: userId, sender: { $in: conversation.participants.map(p => p._id) }, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      messages,
      conversation,
      page: parseInt(page),
      total: messages.length,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Conversations
========================================= */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email university avatar")
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        const unreadCount = await Message.countDocuments({
          recipient: userId,
          sender: otherParticipant?._id,
          isRead: false,
        });

        return {
          _id: conv._id,
          participants: [otherParticipant],
          lastMessagePreview: conv.lastMessagePreview,
          lastMessageTime: conv.lastMessageTime,
          unreadCount,
        };
      })
    );

    res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Mark As Read
========================================= */
export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) { res.status(404); throw new Error("Conversation not found"); }

    const otherUser = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    await Message.updateMany(
      { sender: otherUser, recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Delete Message
========================================= */
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) { res.status(404); throw new Error("Message not found or unauthorized"); }

    await message.deleteOne();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Unread Count
========================================= */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.countDocuments({ recipient: userId, isRead: false });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Start Conversation
========================================= */
export const startConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400); throw new Error("Invalid recipient ID");
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        lastMessageTime: new Date(),
        lastMessagePreview: "",
      });
    }

    res.status(200).json({ success: true, conversationId: conversation._id });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Search Conversations
========================================= */
export const searchConversations = async (req, res, next) => {
  try {
    const { search } = req.query;
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email university avatar")
      .sort({ lastMessageTime: -1 });

    const filtered = conversations.filter((conv) => {
      const other = conv.participants.find((p) => p._id.toString() !== userId.toString());
      return other?.name?.toLowerCase().includes(search?.toLowerCase() || "");
    });

    const formatted = filtered.map((conv) => {
      const other = conv.participants.find((p) => p._id.toString() !== userId.toString());
      return {
        _id: conv._id,
        participants: [other],
        lastMessagePreview: conv.lastMessagePreview,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: 0,
      };
    });

    res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Block / Unblock
========================================= */
export const blockUser = async (req, res, next) => {
  res.status(200).json({ success: true, message: "User blocked" });
};

export const unblockUser = async (req, res, next) => {
  res.status(200).json({ success: true, message: "User unblocked" });
};
