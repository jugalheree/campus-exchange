import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

import { generateAccessToken } from "../utils/generateTokens.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===============================
   Register
   POST /api/auth/register
================================= */
router.post("/register", registerUser);

/* ===============================
   Login
   POST /api/auth/login
================================= */
router.post("/login", loginUser);

/* ===============================
   Get Current User
   GET /api/auth/me
================================= */
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

/* ===============================
   Admin Only Route (Test)
================================= */
router.get("/admin-test", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
  });
});

/* ===============================
   Refresh Access Token
   POST /api/auth/refresh
================================= */
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

/* ===============================
   Logout
   POST /api/auth/logout
================================= */
router.post("/logout", (req, res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "lax",
    secure: false,
  });

  res.status(200).json({
    success: true,
  });
});

export default router;