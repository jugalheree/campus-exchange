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
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },

    university: {
      type: String,
      required: [true, "University is required"],
      trim: true,
      index: true, // we will filter by university often
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    upiId: { type: String, trim: true, default: "" }, // e.g. name@upi

    // Seller credibility
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    bio: { type: String, trim: true, maxlength: 200 },
    responseRate: { type: Number, default: 0 },   // 0-100 %
    totalSales: { type: Number, default: 0 },
    sellerScore: { type: Number, default: 0 },    // computed: reviews + sales + response
  },
  {
    timestamps: true,
  }
);

/* ===============================
   Indexes
================================= */

userSchema.index({ email: 1 });
userSchema.index({ university: 1 });

/* ===============================
   Hash Password Before Save
================================= */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ===============================
   Compare Password Method
================================= */

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;