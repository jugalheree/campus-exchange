import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    condition: { type: String, required: true, enum: ["new", "like_new", "good", "fair"] },
    price: { type: Number, required: true, min: 0 },
    university: { type: String, required: true, index: true },
    images: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
      index: true,
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Analytics
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },

    // Boost
    boosted: { type: Boolean, default: false },
    boostedUntil: { type: Date, default: null },

    // Listing expiry (30 days from creation by default)
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    archived: { type: Boolean, default: false },

    // Rating cache
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
