import express from "express";
import { getCampusFeed } from "../controllers/feedController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/", protect, getCampusFeed);
export default router;
