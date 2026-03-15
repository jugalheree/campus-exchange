import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ===============================
   Protect Middleware
   Verifies Access Token
================================= */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401);
    next(new Error("Not authorized, token failed"));
  }
};

/* ===============================
   Role Middleware
   Restrict By Role
================================= */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Access denied: insufficient permissions");
    }
    next();
  };
};