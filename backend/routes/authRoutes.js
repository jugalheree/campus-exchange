import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ── Register ── */
router.post("/register", registerUser);

/* ── Login ── */
router.post("/login", loginUser);

/* ── Get current user ── */
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

/* ── Google OAuth ── */
router.post("/google", async (req, res) => {
  try {
    const { credential, university } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "No credential provided" });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // New user — need university name
      if (!university) {
        return res.status(200).json({
          success: false,
          needsUniversity: true,
          googleData: { googleId, email, name, picture },
        });
      }
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || "",
        university,
        verified: true,
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        role: user.role,
        avatar: user.avatar || "",
        bio: user.bio || "",
        upiId: user.upiId || "",
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(401).json({ success: false, message: "Google authentication failed" });
  }
});

/* ── Admin test ── */
router.get("/admin-test", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ success: true, message: "Admin access granted" });
});

/* ── Refresh token ── */
router.post("/refresh", async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        role: user.role,
        avatar: user.avatar || "",
        bio: user.bio || "",
        upiId: user.upiId || "",
      },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

/* ── Logout ── */
router.post("/logout", (req, res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "lax",
    secure: false,
  });
  res.status(200).json({ success: true });
});

export default router;