import Notification from "../models/Notification.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

/* Helper — create a notification (used by other controllers internally) */
export const createNotification = async (userId, type, title, body, link = null, meta = {}) => {
  try {
    await Notification.create({ user: userId, type, title, body, link, meta });
  } catch (err) {
    console.error("Notification creation failed:", err.message);
  }
};

/* GET /api/notifications — get my notifications */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ success: true, notifications, unread });
  } catch (err) { next(err); }
};

/* PUT /api/notifications/read-all — mark all read */
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/* PUT /api/notifications/:id/read — mark one read */
export const markOneRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/* DELETE /api/notifications/:id */
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/* Internal: fire price-drop notifications to all wishlisted users */
export const firePriceDropNotifications = async (productId, productTitle, oldPrice, newPrice) => {
  try {
    const wishlists = await Wishlist.find({ product: productId }).select("user");
    const notifications = wishlists.map(w => ({
      user: w.user,
      type: "price_drop",
      title: "Price drop on a saved item",
      body: `"${productTitle}" dropped from ₹${oldPrice.toLocaleString()} to ₹${newPrice.toLocaleString()}`,
      link: `/products/${productId}`,
      meta: { productId, oldPrice, newPrice },
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Price drop notification failed:", err.message);
  }
};
