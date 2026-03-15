import express from "express";
import {
  createNote,
  getNotes,
  getSingleNote,
  deleteNote,
  updateNote,
  getMyNotes,
} from "../controllers/noteController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadPDF } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyNotes);
router.post("/", protect, uploadPDF.single("images"), createNote);
router.get("/", protect, getNotes);
router.get("/:id", protect, getSingleNote);
router.put("/:id", protect, uploadPDF.single("images"), updateNote);
router.delete("/:id", protect, deleteNote);

export default router;
