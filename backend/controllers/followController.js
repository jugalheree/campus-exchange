import Follow from "../models/Follow.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// POST /api/follow/:userId — toggle follow
export const toggleFollow = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      res.status(400); throw new Error("Cannot follow yourself");
    }
    const existing = await Follow.findOne({ follower: req.user._id, following: userId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, following: false });
    }
    await Follow.create({ follower: req.user._id, following: userId });
    res.status(201).json({ success: true, following: true });
  } catch (err) { next(err); }
};

// GET /api/follow/check/:userId
export const checkFollow = async (req, res, next) => {
  try {
    const item = await Follow.findOne({ follower: req.user._id, following: req.params.userId });
    res.status(200).json({ success: true, following: !!item });
  } catch (err) { next(err); }
};

// GET /api/follow/counts/:userId
export const getFollowCounts = async (req, res, next) => {
  try {
    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower: req.params.userId }),
    ]);
    res.status(200).json({ success: true, followers, following });
  } catch (err) { next(err); }
};

// GET /api/follow/feed — products from followed sellers
export const getFollowFeed = async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.user._id }).select("following");
    const sellerIds = follows.map(f => f.following);
    const products = await Product.find({ seller: { $in: sellerIds }, status: "available" })
      .populate("seller", "name university")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, products });
  } catch (err) { next(err); }
};

// GET /api/follow/public/:userId — public profile
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("name university createdAt role");
    if (!user) { res.status(404); throw new Error("User not found"); }

    const [listings, followers, following] = await Promise.all([
      Product.find({ seller: req.params.userId, status: "available" }).populate("seller", "name").sort({ createdAt: -1 }).limit(12),
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower: req.params.userId }),
    ]);

    const isFollowing = await Follow.findOne({ follower: req.user._id, following: req.params.userId });

    res.status(200).json({ success: true, user, listings, followers, following, isFollowing: !!isFollowing });
  } catch (err) { next(err); }
};

/* GET /api/follow/list/:userId?type=followers|following */
export const getFollowList = async (req, res, next) => {
  try {
    const { type } = req.query; // "followers" | "following"
    const query = type === "followers"
      ? { following: req.params.userId }
      : { follower: req.params.userId };

    const field = type === "followers" ? "follower" : "following";

    const records = await Follow.find(query)
      .populate(field, "name university")
      .sort({ createdAt: -1 })
      .limit(100);

    const users = records.map(r => r[field]).filter(Boolean);
    res.status(200).json({ success: true, users });
  } catch (err) { next(err); }
};
