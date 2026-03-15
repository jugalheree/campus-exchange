import express from "express";
import { getPriceHistory } from "../controllers/priceHistoryController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/:productId", protect, getPriceHistory);
export default router;
