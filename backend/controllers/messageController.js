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

    // Validation
    if (!recipientId) {
      res.status(400);
      throw new Error("Recipient ID is required");
    }

    if (!content || !content.trim()) {
      res.status(400);
      throw new Error("Message content is required");
    }

    // Prevent self-messaging
    if (senderId.toString() === recipientId.toString()) {
      res.status(400);
      throw new Error("Cannot send message to yourself");
    }

    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400);
      throw new Error("Invalid recipient ID");
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      relatedTo: relatedType && relatedId ? {
        type: relatedType,
        id: relatedId,
      } : null,
    });

    // Populate sender details
    await message.populate("sender", "name email university");

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, recipientId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        lastMessage: message._id,
        lastMessageTime: message.createdAt,
        lastMessagePreview: content.substring(0, 50),
      });
    } else {
      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessageTime = message.createdAt;
      conversation.lastMessagePreview = content.substring(0, 50);
      await conversation.save();
    }

    // Emit via Socket.io (if available)
    // io.to(recipientId.toString()).emit("message:new", {
    //   message,
    //   conversation
    // });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message,
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Messages with Recipient
========================================= */
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400);
      throw new Error("Invalid conversation ID");
    }

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403);
      throw new Error("You are not a participant in this conversation");
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        {
          sender: userId,
          recipient: { $in: conversation.participants },
          deletedBySender: false,
        },
        {
          recipient: userId,
          sender: { $in: conversation.participants },
          deletedByRecipient: false,
        },
      ],
    })
      .populate("sender", "name email university avatar")
      .populate("recipient", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      $or: [
        {
          sender: userId,
          recipient: { $in: conversation.participants },
          deletedBySender: false,
        },
        {
          recipient: userId,
          sender: { $in: conversation.participants },
          deletedByRecipient: false,
        },
      ],
    });

    // Mark messages as read
    await Message.updateMany(
      {
        recipient: userId,
        sender: { $in: conversation.participants },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Populate participants for the frontend
    const populatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name university email");

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      conversation: populatedConversation,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Conversations List
========================================= */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name email university avatar",
        match: { _id: { $ne: userId } },
      })
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      participants: userId,
    });

    // Get unread count for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          recipient: userId,
          sender: { $in: conv.participants.map((p) => p._id) },
          isRead: false,
        });

        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: enrichedConversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Mark Message as Read
========================================= */
export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400);
      throw new Error("Invalid conversation ID");
    }

    const result = await Message.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
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

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      res.status(400);
      throw new Error("Invalid message ID");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Only sender or recipient can delete
    const isSender = message.sender.toString() === userId.toString();
    const isRecipient = message.recipient.toString() === userId.toString();

    if (!isSender && !isRecipient) {
      res.status(403);
      throw new Error("You cannot delete this message");
    }

    if (isSender) {
      message.deletedBySender = true;
    }

    if (isRecipient) {
      message.deletedByRecipient = true;
    }

    // If both deleted, remove from database
    if (message.deletedBySender && message.deletedByRecipient) {
      await Message.findByIdAndDelete(messageId);
    } else {
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Block User
========================================= */
export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const blockerUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    if (blockerUserId.toString() === userId.toString()) {
      res.status(400);
      throw new Error("Cannot block yourself");
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [blockerUserId, userId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [blockerUserId, userId],
      });
    }

    conversation.isBlocked = {
      blockedBy: blockerUserId,
      blockedUser: userId,
    };

    await conversation.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Unblock User
========================================= */
export const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const blockerUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    const conversation = await Conversation.findOne({
      participants: {
        $all: [blockerUserId, userId],
      },
    });

    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found");
    }

    conversation.isBlocked = null;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
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

    if (!search) {
      res.status(400);
      throw new Error("Search query is required");
    }

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name email university",
        match: {
          _id: { $ne: userId },
          name: { $regex: search, $options: "i" },
        },
      })
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 });

    const filtered = conversations.filter(
      (conv) => conv.participants.length > 0
    );

    res.status(200).json({
      success: true,
      conversations: filtered,
    });
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

    const unreadCount = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================
   Start or Get Conversation with a User
   POST /api/messages/conversation/start
========================================= */
export const startConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) { res.status(400); throw new Error("Recipient ID required"); }
    if (senderId.toString() === recipientId.toString()) {
      res.status(400); throw new Error("Cannot message yourself");
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400); throw new Error("Invalid recipient ID");
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    // Create one if none exists (with a silent opener message)
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        lastMessageTime: new Date(),
        lastMessagePreview: "",
      });
    }

    res.status(200).json({ success: true, conversationId: conversation._id });
  } catch (err) { next(err); }
};
