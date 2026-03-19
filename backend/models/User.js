import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      // NOT required — Google users have no password
      minlength: 6,
      select: false,
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
    },

    avatar: {
      type: String,
      default: "",
    },

    university: {
      type: String,
      required: [true, "University is required"],
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    upiId: { type: String, trim: true, default: "" },

    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    bio: { type: String, trim: true, maxlength: 200 },
    responseRate: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    sellerScore: { type: Number, default: 0 },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ university: 1 });

// Only hash password if it exists and was modified
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;