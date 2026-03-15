import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["offer_received", "offer_accepted", "offer_declined", "price_drop", "new_message", "listing_expiring"],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String }, // e.g. /products/:id
    read: { type: Boolean, default: false, index: true },
    meta: { type: mongoose.Schema.Types.Mixed }, // extra data (productId, offerId, etc.)
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
