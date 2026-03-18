import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerUser, loginUser, getMe, updateProfile, uploadAvatar } from "../controllers/authController.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

// Avatar upload — single image, field name "avatar"
router.post("/avatar", protect, uploadImages.single("avatar"), uploadAvatar);

// Refresh — reads token from body OR cookie
router.post("/refresh", async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id, name: user.name, email: user.email,
        university: user.university, role: user.role,
        upiId: user.upiId || "", bio: user.bio || "", avatar: user.avatar || "",
      },
    });
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true });
});

export default router;
