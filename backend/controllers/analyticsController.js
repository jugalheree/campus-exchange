import Product from "../models/Product.js";
import Offer from "../models/Offer.js";
import Wishlist from "../models/Wishlist.js";
import Review from "../models/Review.js";

// GET /api/analytics/product/:productId
export const getProductAnalytics = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    const [offerCount, wishlistCount, reviews] = await Promise.all([
      Offer.countDocuments({ product: req.params.productId }),
      Wishlist.countDocuments({ product: req.params.productId }),
      Review.find({ product: req.params.productId }),
    ]);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        views: product.views,
        wishlistCount,
        offerCount,
        avgRating,
        reviewCount: reviews.length,
        status: product.status,
        boosted: product.boosted,
        daysListed: Math.floor((Date.now() - new Date(product.createdAt)) / 86400000),
      },
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/dashboard — seller's overall stats
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const ids = products.map(p => p._id);
    const [totalOffers, totalWishlists] = await Promise.all([
      Offer.countDocuments({ seller: req.user._id }),
      Wishlist.countDocuments({ product: { $in: ids } }),
    ]);
    const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
    const soldCount = products.filter(p => p.status === "sold").length;
    const activeCount = products.filter(p => p.status === "available").length;

    res.status(200).json({
      success: true,
      analytics: { totalViews, totalWishlists, totalOffers, soldCount, activeCount, totalListings: products.length },
    });
  } catch (err) { next(err); }
};
