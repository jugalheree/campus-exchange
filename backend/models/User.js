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
      minlength: 6,
      select: false,
      // Not required — Google users won't have a password
    },

    // Google OAuth fields
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

    bio: { type: String, default: "", maxlength: 300 },
    upiId: { type: String, default: "" },
    verified: { type: Boolean, default: false },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Hash password before saving (skip if no password — Google users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
