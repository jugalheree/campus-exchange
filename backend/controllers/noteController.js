import Note from "../models/Note.js";
import cloudinary from "../config/cloudinary.js";

/* =========================================
   Create Note (With PDF Upload)
========================================= */
export const createNote = async (req, res, next) => {
  try {
    const { title, description, subject, semester, price } = req.body;

    if (!title || !description || !subject || !semester) {
      res.status(400);
      throw new Error("All required fields must be provided");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("PDF file is required");
    }

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "campus-exchange/notes",
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(req.file.buffer);
      });

    const uploadResult = await streamUpload();

    const note = await Note.create({
      title,
      description,
      subject,
      semester: Number(semester),
      university: req.user.university,
      price: price || 0,
      fileURL: uploadResult.secure_url,
      seller: req.user._id,
    });

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get All Notes (Filtered + Paginated)
========================================= */
export const getNotes = async (req, res, next) => {
  try {
    const { subject, semester, minPrice, maxPrice, search, page = 1 } =
      req.query;

    const limit = 10;
    const skip = (page - 1) * limit;

    let query = {
      university: req.user.university,
    };

    if (subject) query.subject = subject;
    if (semester) query.semester = Number(semester);

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const notes = await Note.find(query)
      .populate("seller", "name university")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      notes,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Single Note
========================================= */
export const getSingleNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "seller",
      "name university"
    );

    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }

    if (note.university !== req.user.university) {
      res.status(403);
      throw new Error("Access denied for this university");
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Delete Note (Owner Only)
========================================= */
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }

    if (note.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own notes");
    }

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================
   Update Note (Owner Only)
========================================= */
export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }

    if (note.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own notes");
    }

    const { title, description, subject, semester, price } = req.body;

    if (title) note.title = title;
    if (description) note.description = description;
    if (subject) note.subject = subject;
    if (semester) note.semester = Number(semester);
    if (price !== undefined) note.price = Number(price);

    // If new PDF uploaded, replace
    if (req.file) {
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "campus-exchange/notes" },
            (error, result) => { if (result) resolve(result); else reject(error); }
          );
          stream.end(req.file.buffer);
        });
      const result = await streamUpload();
      note.fileURL = result.secure_url;
    }

    const updated = await note.save();
    res.status(200).json({ success: true, note: updated });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get My Notes
========================================= */
export const getMyNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notes.length, notes });
  } catch (error) {
    next(error);
  }
};