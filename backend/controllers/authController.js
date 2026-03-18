import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { v2 as cloudinary } from "cloudinary";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  university: user.university,
  role: user.role,
  upiId: user.upiId || "",
  bio: user.bio || "",
  avatar: user.avatar || "",
});

/* Register */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, university } = req.body;
    if (!name || !email || !password || !university) { res.status(400); throw new Error("All fields are required"); }
    if (await User.findOne({ email })) { res.status(400); throw new Error("User already exists"); }
    const user = await User.create({ name, email, password, university });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.status(201).json({ success: true, accessToken, refreshToken, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* Login */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400); throw new Error("Email and password required"); }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) { res.status(401); throw new Error("Invalid credentials"); }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.status(200).json({ success: true, accessToken, refreshToken, user: userPayload(user) });
  } catch (error) { next(error); }
};

/* Get current user */
export const getMe = async (req, res, next) => {
  try { res.status(200).json({ success: true, user: req.user }); }
  catch (error) { next(error); }
};

/* Update profile (text fields) */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, university, upiId, bio } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); throw new Error("User not found"); }
    if (name) user.name = name;
    if (university) user.university = university;
    if (upiId !== undefined) user.upiId = upiId.trim();
    if (bio !== undefined) user.bio = bio.trim();
    const updated = await user.save();
    res.status(200).json({ success: true, user: userPayload(updated) });
  } catch (error) { next(error); }
};

/* Upload avatar — multipart/form-data, field: "avatar" */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) { res.status(400); throw new Error("No image provided"); }

    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "campus_exchange/avatars", transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }] },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const user = await User.findById(req.user._id);
    user.avatar = result.secure_url;
    await user.save();

    res.status(200).json({ success: true, avatar: result.secure_url, user: userPayload(user) });
  } catch (error) { next(error); }
};
