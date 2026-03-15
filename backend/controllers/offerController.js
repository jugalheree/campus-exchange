import { createNotification } from "../controllers/notificationController.js";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js";

// POST /api/offers/:productId — make offer
export const makeOffer = async (req, res, next) => {
  try {
    const { offerPrice, message } = req.body;
    const product = await Product.findById(req.params.productId).populate("seller", "name");
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller._id.toString() === req.user._id.toString()) {
      res.status(400); throw new Error("You cannot make an offer on your own product");
    }
    if (product.status === "sold") { res.status(400); throw new Error("Product is already sold"); }

    // cancel existing pending offer from same buyer on same product
    await Offer.deleteOne({ product: req.params.productId, buyer: req.user._id, status: "pending" });

    const offer = await Offer.create({
      product: req.params.productId,
      buyer: req.user._id,
      seller: product.seller._id,
      offerPrice: Number(offerPrice),
      message,
    });
    const pop = await offer.populate([
      { path: "buyer", select: "name university" },
      { path: "product", select: "title price images" },
    ]);
    // Notify seller
    createNotification(
      product.seller._id,
      "offer_received",
      "New offer received",
      `${req.user.name} offered ₹${Number(offerPrice).toLocaleString()} for "${product.title}"`,
      `/products/${req.params.productId}`,
      { offerId: offer._id, productId: req.params.productId }
    );
    res.status(201).json({ success: true, offer: pop });
  } catch (err) { next(err); }
};

// GET /api/offers/received — seller sees incoming
export const getReceivedOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ seller: req.user._id, status: "pending" })
      .populate("buyer", "name university")
      .populate("product", "title price images status")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (err) { next(err); }
};

// GET /api/offers/sent — buyer sees sent
export const getSentOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ buyer: req.user._id })
      .populate("seller", "name university")
      .populate("product", "title price images status")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (err) { next(err); }
};

// PUT /api/offers/:offerId/respond — accept/decline
export const respondOffer = async (req, res, next) => {
  try {
    const { status } = req.body; // "accepted" | "declined"
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) { res.status(404); throw new Error("Offer not found"); }
    if (offer.seller.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    offer.status = status;
    await offer.save();
    const populated = await offer.populate([
      { path: "product", select: "title" },
    ]);
    const productTitle = populated.product?.title || "your item";
    createNotification(
      offer.buyer,
      status === "accepted" ? "offer_accepted" : "offer_declined",
      status === "accepted" ? "Offer accepted! 🎉" : "Offer declined",
      status === "accepted"
        ? `Your offer for "${productTitle}" was accepted. Message the seller to arrange pickup.`
        : `Your offer for "${productTitle}" was declined.`,
      status === "accepted" ? `/messages` : `/products/${offer.product}`,
      { offerId: offer._id }
    );
    res.status(200).json({ success: true, offer });
  } catch (err) { next(err); }
};

// DELETE /api/offers/:offerId — withdraw offer (buyer)
export const withdrawOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) { res.status(404); throw new Error("Offer not found"); }
    if (offer.buyer.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    offer.status = "withdrawn";
    await offer.save();
    res.status(200).json({ success: true, message: "Offer withdrawn" });
  } catch (err) { next(err); }
};
