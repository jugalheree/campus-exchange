import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

router.get("/admin-test", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ success: true, message: "Admin access granted" });
});

/* ===============================
   Refresh Access Token
   POST /api/auth/refresh
   Accepts token from body (mobile/web) OR cookie (fallback)
================================= */
router.post("/refresh", async (req, res) => {
  try {
    // Accept from body first (our new approach), fall back to cookie
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id); // rotate it

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // send back so client can store it
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        role: user.role,
        upiId: user.upiId || "",
        bio: user.bio || "",
      },
    });
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

/* ===============================
   Logout
   POST /api/auth/logout
================================= */
router.post("/logout", (req, res) => {
  // Clear cookie too in case old clients still send it
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true });
});

export default router;
