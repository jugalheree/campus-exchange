import express from "express";
import { getSellerStats, updateBio, getLeaderboard } from "../controllers/sellerController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/leaderboard", getLeaderboard);
router.put("/bio", updateBio);
router.get("/:userId/stats", getSellerStats);
export default router;
