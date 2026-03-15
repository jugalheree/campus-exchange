import Report from "../models/Report.js";

// POST /api/reports — submit report
export const submitReport = async (req, res, next) => {
  try {
    const { productId, noteId, reason, details } = req.body;
    if (!productId && !noteId) { res.status(400); throw new Error("Must report a product or note"); }

    const report = await Report.create({
      reporter: req.user._id,
      product: productId || undefined,
      note: noteId || undefined,
      reason,
      details,
    });
    res.status(201).json({ success: true, report });
  } catch (err) { next(err); }
};
