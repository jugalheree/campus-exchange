import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";

/* GET /api/feed — mixed activity feed for logged-in user */
export const getCampusFeed = async (req, res, next) => {
  try {
    const university = req.user.university;
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000); // last 3 days

    // Get followed seller IDs
    const follows = await Follow.find({ follower: req.user._id }).select("following");
    const followedIds = follows.map(f => f.following);

    // New listings from followed sellers
    const followedListings = await Product.find({
      seller: { $in: followedIds },
      status: "available",
      createdAt: { $gte: since },
    }).populate("seller", "name").sort({ createdAt: -1 }).limit(5);

    // New listings from same university (not own)
    const campusListings = await Product.find({
      university,
      seller: { $ne: req.user._id },
      status: "available",
      createdAt: { $gte: since },
    }).populate("seller", "name").sort({ createdAt: -1 }).limit(10);

    // Hot items (many views/saves today)
    const hotItems = await Product.find({
      university,
      status: "available",
      $or: [{ views: { $gte: 5 } }, { wishlistCount: { $gte: 2 } }],
    }).populate("seller", "name").sort({ views: -1, wishlistCount: -1 }).limit(5);

    // Assemble feed events
    const feed = [];

    followedListings.forEach(p => feed.push({
      type: "followed_listing", product: p,
      text: `${p.seller?.name} listed a new item`,
      time: p.createdAt,
    }));

    campusListings.forEach(p => feed.push({
      type: "campus_listing", product: p,
      text: `New on campus — ${p.category}`,
      time: p.createdAt,
    }));

    hotItems.forEach(p => feed.push({
      type: "hot_item", product: p,
      text: `Trending · ${p.views} views`,
      time: p.updatedAt,
    }));

    // Sort by time desc, dedupe by product id
    const seen = new Set();
    const unique = feed
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .filter(item => {
        const id = item.product._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 20);

    res.status(200).json({ success: true, feed: unique });
  } catch (err) { next(err); }
};
