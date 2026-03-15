import LostFound from "../models/LostFound.js";
import cloudinary from "../config/cloudinary.js";

/* POST /api/lost-found */
export const createPost = async (req, res, next) => {
  try {
    const { type, title, description, category, location, date, contact } = req.body;

    let images = [];
    if (req.files?.length > 0) {
      const uploads = req.files.map(f => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "campus-exchange/lost-found", transformation: [{ width: 800, crop: "scale", quality: "auto" }] },
          (err, result) => { if (result) resolve(result.secure_url); else reject(err); }
        );
        stream.end(f.buffer);
      }));
      images = await Promise.all(uploads);
    }

    const post = await LostFound.create({
      type, title, description, category, location,
      date: new Date(date),
      contact,
      images,
      university: req.user.university,
      postedBy: req.user._id,
    });

    res.status(201).json({ success: true, post });
  } catch (err) { next(err); }
};

/* GET /api/lost-found */
export const getPosts = async (req, res, next) => {
  try {
    const { type, category, status = "open", page = 1, q } = req.query;
    const limit = 15;
    const skip = (page - 1) * limit;

    const query = { university: req.user.university, status };
    if (type) query.type = type;
    if (category) query.category = category;
    if (q) query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];

    const [posts, total] = await Promise.all([
      LostFound.find(query)
        .populate("postedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      LostFound.countDocuments(query),
    ]);

    res.status(200).json({ success: true, posts, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

/* GET /api/lost-found/:id */
export const getPostById = async (req, res, next) => {
  try {
    const post = await LostFound.findById(req.params.id).populate("postedBy", "name university");
    if (!post) { res.status(404); throw new Error("Post not found"); }
    res.status(200).json({ success: true, post });
  } catch (err) { next(err); }
};

/* PATCH /api/lost-found/:id/resolve — mark resolved */
export const resolvePost = async (req, res, next) => {
  try {
    const post = await LostFound.findById(req.params.id);
    if (!post) { res.status(404); throw new Error("Not found"); }
    if (post.postedBy.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    post.status = "resolved";
    await post.save();
    res.status(200).json({ success: true, post });
  } catch (err) { next(err); }
};

/* DELETE /api/lost-found/:id */
export const deletePost = async (req, res, next) => {
  try {
    const post = await LostFound.findById(req.params.id);
    if (!post) { res.status(404); throw new Error("Not found"); }
    if (post.postedBy.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    await post.deleteOne();
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/* GET /api/lost-found/my */
export const getMyPosts = async (req, res, next) => {
  try {
    const posts = await LostFound.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
  } catch (err) { next(err); }
};
