import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offerPrice: { type: Number, required: true, min: 0 },
    message: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ["pending", "accepted", "declined", "withdrawn"], default: "pending" },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
