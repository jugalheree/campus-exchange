import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageTime: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastMessagePreview: String,

    unreadCount: {
      type: {
        userId: mongoose.Schema.Types.ObjectId,
        count: Number,
      },
      default: { userId: null, count: 0 },
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    isMuted: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        mutedUntil: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fast retrieval
conversationSchema.index({
  "participants._id": 1,
  lastMessageTime: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;