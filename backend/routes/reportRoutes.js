import express from "express";
import { submitReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.post("/", submitReport);
export default router;
