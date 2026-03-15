import mongoose from "mongoose";

const lostFoundSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ["lost", "found"], required: true, index: true },
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    category:    {
      type: String,
      required: true,
      enum: ["Electronics", "ID & Documents", "Keys", "Wallet & Bag", "Clothing", "Books", "Sports", "Other"],
    },
    location:    { type: String, required: true, trim: true }, // e.g. "Library Block B, 2nd floor"
    date:        { type: Date, required: true },               // when lost/found
    images:      [{ type: String }],
    contact:     { type: String, trim: true },                 // optional phone/UPI/etc
    status:      { type: String, enum: ["open", "resolved"], default: "open", index: true },
    university:  { type: String, required: true, index: true },
    postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

lostFoundSchema.index({ university: 1, type: 1, status: 1 });

const LostFound = mongoose.model("LostFound", lostFoundSchema);
export default LostFound;
