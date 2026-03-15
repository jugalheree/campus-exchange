import express from "express";
import { addReview, getReviews, deleteReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/:productId", getReviews);
router.post("/:productId", addReview);
router.delete("/:reviewId", deleteReview);
export default router;
