import PriceHistory from "../models/PriceHistory.js";
import Product from "../models/Product.js";

/* Record price on product creation/update (called internally) */
export const recordPrice = async (productId, price) => {
  try {
    await PriceHistory.create({ product: productId, price });
  } catch {}
};

/* GET /api/price-history/:productId */
export const getPriceHistory = async (req, res, next) => {
  try {
    const history = await PriceHistory.find({ product: req.params.productId })
      .sort({ recordedAt: 1 })
      .limit(30);
    const product = await Product.findById(req.params.productId).select("price title");
    res.status(200).json({ success: true, history, currentPrice: product?.price });
  } catch (err) { next(err); }
};
