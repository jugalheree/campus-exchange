import express from "express";
import { makeOffer, getReceivedOffers, getSentOffers, respondOffer, withdrawOffer } from "../controllers/offerController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
// specific named routes BEFORE param routes
router.get("/received", getReceivedOffers);
router.get("/sent", getSentOffers);
router.post("/:productId", makeOffer);
router.put("/:offerId/respond", respondOffer);
router.delete("/:offerId", withdrawOffer);
export default router;
