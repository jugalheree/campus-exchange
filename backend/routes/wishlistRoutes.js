import express from "express";
import { toggleWishlist, getWishlist, checkWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/", getWishlist);
router.get("/check/:productId", checkWishlist);
router.post("/:productId", toggleWishlist);
export default router;
