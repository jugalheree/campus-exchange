import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  price: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
});

priceHistorySchema.index({ product: 1, recordedAt: -1 });
const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);
export default PriceHistory;
