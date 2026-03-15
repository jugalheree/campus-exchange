import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 1000,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: 1,
      max: 12,
      index: true,
    },

    university: {
      type: String,
      required: [true, "University is required"],
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    fileURL: {
      type: String,
      required: [true, "File URL is required"],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===============================
   Compound Indexes for Performance
================================= */

// Fast filtering by university + subject + semester
noteSchema.index({
  university: 1,
  subject: 1,
  semester: 1,
});

// Fast sorting by newest
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;