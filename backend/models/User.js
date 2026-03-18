import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] },
    password: { type: String, required: true, minlength: 6, select: false },
    university: { type: String, required: true, trim: true, index: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    upiId: { type: String, trim: true, default: "" },

    // Profile photo — stored as Cloudinary URL
    avatar: { type: String, default: "" },

    // Seller stats
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    bio: { type: String, trim: true, maxlength: 200 },
    responseRate: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    sellerScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ university: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
