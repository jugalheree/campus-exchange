import multer from "multer";

const storage = multer.memoryStorage();

// ── Images only (products) ──
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Please upload an image file (JPG, PNG, etc.)"), false);
  }
};

export const uploadImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

// ── PDFs only (notes) ──
const pdfFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.originalname?.toLowerCase().endsWith(".pdf")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Please upload a PDF file."), false);
  }
};

export const uploadPDF = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for PDFs
  fileFilter: pdfFilter,
});
