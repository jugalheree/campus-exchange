import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: 5000,
    },

    attachments: [
      {
        type: String, // Cloudinary URL
        fileType: String, // image, document, etc.
        fileName: String,
      },
    ],

    relatedTo: {
      type: {
        type: String,
        enum: ["product", "note"],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    deletedBySender: {
      type: Boolean,
      default: false,
    },

    deletedByRecipient: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
messageSchema.index({
  sender: 1,
  recipient: 1,
  createdAt: -1,
});

messageSchema.index({
  recipient: 1,
  isRead: 1,
});

messageSchema.index({
  createdAt: -1,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;