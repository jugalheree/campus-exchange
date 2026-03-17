import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { notFound } from "./middleware/notFoundMiddleware.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import priceHistoryRoutes from "./routes/priceHistoryRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import lostFoundRoutes from "./routes/lostFoundRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

/* ===============================
   Allowed Origins
================================= */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  // Add your Vercel URL(s) here — or set ALLOWED_ORIGIN in Render env vars
  process.env.ALLOWED_ORIGIN,
].filter(Boolean); // removes undefined if env var not set

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

/* ===============================
   Core Middleware
================================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

/* ===============================
   Health Check
================================= */
app.get("/", (req, res) => res.status(200).json({ success: true, message: "Campus Exchange API running" }));

/* ===============================
   Routes
================================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/notifications", notificationRoutes);

/* ===============================
   Global Error Handlers
================================= */
app.use(notFound);
app.use(errorHandler);

export default app;