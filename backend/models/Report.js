import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    reason: { type: String, required: true, enum: ["spam", "inappropriate", "wrong_info", "scam", "other"] },
    details: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
