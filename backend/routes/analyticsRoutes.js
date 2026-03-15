import express from "express";
import { getProductAnalytics, getDashboardAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/dashboard", getDashboardAnalytics);
router.get("/product/:productId", getProductAnalytics);
export default router;
