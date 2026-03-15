import express from "express";
const router = express.Router();
import {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  deleteProduct,
  updateProduct,
  markAsSold,
  boostProduct,
  trackView,
  searchProducts,
  getTrending,
  renewListing,
  getRecentlyListed,
  getRecommendations,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadImages } from "../middleware/uploadMiddleware.js";

router.get("/search", protect, searchProducts);
router.get("/trending", protect, getTrending);
router.get("/recent", protect, getRecentlyListed);
router.get("/recommendations", protect, getRecommendations);
router.get("/my", protect, getMyProducts);

router
  .route("/")
  .get(protect, getProducts)
  .post(protect, uploadImages.array("images", 5), createProduct);

router.patch("/:id/sold", protect, markAsSold);
router.patch("/:id/boost", protect, boostProduct);
router.patch("/:id/renew", protect, renewListing);
router.post("/:id/view", protect, trackView);

router
  .route("/:id")
  .get(protect, getProductById)
  .put(protect, uploadImages.array("images", 5), updateProduct)
  .delete(protect, deleteProduct);

export default router;
