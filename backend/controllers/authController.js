import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";

/* ===============================
   Register User
================================= */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, university } = req.body;

    if (!name || !email || !password || !university) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({ name, email, password, university });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,   // <-- client stores this in localStorage
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
  } catch (error) {
    next(error);
  }
};

/* ===============================
   Login User
================================= */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,   // <-- client stores this in localStorage
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
  } catch (error) {
    next(error);
  }
};

/* ===============================
   Get Current Logged In User
================================= */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

/* ===============================
   Update Profile
================================= */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, university, upiId, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (name) user.name = name;
    if (university) user.university = university;
    if (upiId !== undefined) user.upiId = upiId.trim();
    if (bio !== undefined) user.bio = bio.trim();

    const updated = await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        university: updated.university,
        role: updated.role,
        upiId: updated.upiId || "",
        bio: updated.bio || "",
      },
    });
  } catch (error) {
    next(error);
  }
};
