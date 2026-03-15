import Review from "../models/Review.js";
import Product from "../models/Product.js";

// POST /api/reviews/:productId — add review
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller.toString() === req.user._id.toString()) {
      res.status(400); throw new Error("You cannot review your own listing");
    }

    const existing = await Review.findOne({ product: productId, reviewer: req.user._id });
    if (existing) { res.status(400); throw new Error("You have already reviewed this product"); }

    const review = await Review.create({
      product: productId,
      reviewer: req.user._id,
      rating: Number(rating),
      comment,
    });

    // Recalculate avg rating
    const reviews = await Review.find({ product: productId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { avgRating: avg.toFixed(1), reviewCount: reviews.length });

    const populated = await review.populate("reviewer", "name university");
    res.status(201).json({ success: true, review: populated });
  } catch (err) { next(err); }
};

// GET /api/reviews/:productId — get reviews
export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("reviewer", "name university")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, reviews });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/:reviewId — delete own review
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) { res.status(404); throw new Error("Review not found"); }
    if (review.reviewer.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    const productId = review.product;
    await review.deleteOne();

    const reviews = await Review.find({ product: productId });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(productId, { avgRating: avg.toFixed(1), reviewCount: reviews.length });

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) { next(err); }
};
