import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// POST /api/wishlist/:productId — toggle
export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const existing = await Wishlist.findOne({ user: req.user._id, product: productId });

    if (existing) {
      await existing.deleteOne();
      await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } });
      return res.status(200).json({ success: true, saved: false });
    }

    await Wishlist.create({ user: req.user._id, product: productId });
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });
    res.status(201).json({ success: true, saved: true });
  } catch (err) { next(err); }
};

// GET /api/wishlist — get my wishlist
export const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate({ path: "product", populate: { path: "seller", select: "name university" } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, wishlist: items.map(i => i.product).filter(Boolean) });
  } catch (err) { next(err); }
};

// GET /api/wishlist/check/:productId
export const checkWishlist = async (req, res, next) => {
  try {
    const item = await Wishlist.findOne({ user: req.user._id, product: req.params.productId });
    res.status(200).json({ success: true, saved: !!item });
  } catch (err) { next(err); }
};
