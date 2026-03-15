import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Follow from "../models/Follow.js";

/* Compute seller score (0–100) */
const computeScore = (reviews, totalSales, followers) => {
  const reviewScore = Math.min(reviews.length * 5, 40);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingScore = (avgRating / 5) * 30;
  const salesScore = Math.min(totalSales * 2, 20);
  const followerScore = Math.min(followers, 10);
  return Math.round(reviewScore + ratingScore + salesScore + followerScore);
};

/* GET /api/sellers/:userId/stats */
export const getSellerStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("name university verified bio responseRate totalSales sellerScore createdAt role");
    if (!user) { res.status(404); throw new Error("User not found"); }

    const [listings, soldListings, allReviews, followers] = await Promise.all([
      Product.countDocuments({ seller: req.params.userId, status: "available" }),
      Product.countDocuments({ seller: req.params.userId, status: "sold" }),
      Review.find({ product: { $in: await Product.find({ seller: req.params.userId }).distinct("_id") } }),
      Follow.countDocuments({ following: req.params.userId }),
    ]);

    const avgRating = allReviews.length
      ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : 0;
    const score = computeScore(allReviews, soldListings, followers);

    // Persist updated score
    await User.findByIdAndUpdate(req.params.userId, { sellerScore: score, totalSales: soldListings });

    res.status(200).json({
      success: true,
      stats: {
        user,
        activeListings: listings,
        soldListings,
        totalReviews: allReviews.length,
        avgRating,
        followers,
        sellerScore: score,
      },
    });
  } catch (err) { next(err); }
};

/* PUT /api/sellers/bio — update own bio */
export const updateBio = async (req, res, next) => {
  try {
    const { bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio },
      { new: true }
    ).select("-password");
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

/* GET /api/sellers/leaderboard — top sellers by score */
export const getLeaderboard = async (req, res, next) => {
  try {
    const university = req.user?.university;
    const query = university ? { university } : {};
    const top = await User.find({ ...query, sellerScore: { $gt: 0 } })
      .select("name university sellerScore verified totalSales")
      .sort({ sellerScore: -1 })
      .limit(10);
    res.status(200).json({ success: true, leaderboard: top });
  } catch (err) { next(err); }
};
