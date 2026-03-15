import jwt from "jsonwebtoken";

/* ===============================
   Generate Access Token
================================= */
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m", // short-lived
  });
};

/* ===============================
   Generate Refresh Token
================================= */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // long-lived
  });
};