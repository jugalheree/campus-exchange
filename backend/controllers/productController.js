import { recordPrice } from "../controllers/priceHistoryController.js";
import { firePriceDropNotifications } from "../controllers/notificationController.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* =========================================
   Create Product (Multiple Images to Cloudinary)
========================================= */
export const createProduct = async (req, res, next) => {
  try {
    const { title, description, category, condition, price } = req.body;

    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("At least one image required");
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-exchange/products",
            transformation: [{ width: 1000, crop: "scale", quality: "auto" }],
          },
          (error, result) => {
            if (result) resolve(result.secure_url);
            else reject(error);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploadPromises = req.files.map((file) => streamUpload(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    const product = await Product.create({
      title,
      description,
      category,
      condition,
      price: Number(price),
      university: req.user.university,
      images: imageUrls,
      seller: req.user._id,
    });

    recordPrice(product._id, product.price);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get All Products (Filtered by University)
========================================= */
export const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user?.university) {
      query.university = req.user.university;
    }

    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get Single Product
========================================= */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name university email upiId"
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Get My Products
========================================= */
export const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   Delete Product (Owner Only)
========================================= */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own products");
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};
/* =========================================
   Update Product (Owner Only)
========================================= */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own products");
    }

    const { title, description, category, condition, price } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (category) product.category = category;
    if (condition) product.condition = condition;
    const oldPrice = product.price;
    if (price !== undefined) product.price = Number(price);
    const newPrice = product.price;
    const priceDropped = price !== undefined && newPrice < oldPrice;

    // If new images uploaded, replace
    if (req.files && req.files.length > 0) {
      const streamUpload = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "campus-exchange/products", transformation: [{ width: 1000, crop: "scale", quality: "auto" }] },
            (error, result) => { if (result) resolve(result.secure_url); else reject(error); }
          );
          stream.end(fileBuffer);
        });

      const imageUrls = await Promise.all(req.files.map((f) => streamUpload(f.buffer)));
      product.images = imageUrls;
    }

    const updated = await product.save();
    recordPrice(updated._id, updated.price);
    if (priceDropped && updated.wishlistCount > 0) {
      firePriceDropNotifications(updated._id, updated.title, oldPrice, newPrice);
    }
    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};
/* =========================================
   Mark Product as Sold (Owner Only)
========================================= */
export const markAsSold = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    product.status = product.status === "sold" ? "available" : "sold";
    await product.save();
    res.status(200).json({ success: true, product });
  } catch (err) { next(err); }
};

/* =========================================
   Boost Product (Owner Only) — 7 day boost
========================================= */
export const boostProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    product.boosted = true;
    product.boostedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await product.save();
    res.status(200).json({ success: true, product });
  } catch (err) { next(err); }
};

/* =========================================
   Track View
========================================= */
export const trackView = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/* =========================================
   Advanced Search
========================================= */
export const searchProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, condition, sortBy, page = 1 } = req.query;
    const limit = 12;
    const skip = (page - 1) * limit;

    let query = { status: "available" };
    if (req.user?.university) query.university = req.user.university;
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (q) query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];

    let sort = { createdAt: -1 };
    if (sortBy === "price_asc") sort = { price: 1 };
    if (sortBy === "price_desc") sort = { price: -1 };
    if (sortBy === "rating") sort = { avgRating: -1 };
    if (sortBy === "popular") sort = { wishlistCount: -1 };

    // Boosted products first unless sorting by price/rating
    const boosted = await Product.find({ ...query, boosted: true, boostedUntil: { $gte: new Date() } })
      .populate("seller", "name university")
      .sort(sort)
      .limit(3);

    const regularQuery = { ...query };
    if (boosted.length) regularQuery._id = { $nin: boosted.map(p => p._id) };

    const [regular, total] = await Promise.all([
      Product.find(regularQuery).populate("seller", "name university").sort(sort).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    const products = skip === 0 ? [...boosted, ...regular] : regular;

    res.status(200).json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

/* =========================================
   Renew Listing (extend expiry by 30 days)
========================================= */
export const renewListing = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error("Product not found"); }
    if (product.seller.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Not authorized");
    }
    product.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    product.archived = false;
    await product.save();
    res.status(200).json({ success: true, product });
  } catch (err) { next(err); }
};

/* =========================================
   Trending Products (most viewed this week)
========================================= */
export const getTrending = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = { status: "available" };
    if (req.user?.university) query.university = req.user.university;

    const trending = await Product.find({ ...query, updatedAt: { $gte: since } })
      .populate("seller", "name university")
      .sort({ views: -1, wishlistCount: -1 })
      .limit(8);

    res.status(200).json({ success: true, products: trending });
  } catch (err) { next(err); }
};

/* =========================================
   Recently Listed (last 48h, for home feed)
========================================= */
export const getRecentlyListed = async (req, res, next) => {
  try {
    const query = { status: "available" };
    if (req.user?.university) query.university = req.user.university;

    const recent = await Product.find(query)
      .populate("seller", "name university")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({ success: true, products: recent });
  } catch (err) { next(err); }
};

/* =========================================
   Recommendations (same category as wishlisted items)
========================================= */
export const getRecommendations = async (req, res, next) => {
  try {
    const Wishlist = (await import("../models/Wishlist.js")).default;
    const saved = await Wishlist.find({ user: req.user._id }).populate("product", "category");
    const categories = [...new Set(saved.map(w => w.product?.category).filter(Boolean))];

    let products = [];
    if (categories.length > 0) {
      products = await Product.find({
        status: "available",
        category: { $in: categories },
        seller: { $ne: req.user._id },
        university: req.user.university,
      })
        .populate("seller", "name university")
        .sort({ avgRating: -1, views: -1 })
        .limit(6);
    }

    // Fallback to top-rated if no wishlist
    if (products.length === 0) {
      products = await Product.find({ status: "available", university: req.user.university })
        .populate("seller", "name university")
        .sort({ avgRating: -1, reviewCount: -1 })
        .limit(6);
    }

    res.status(200).json({ success: true, products });
  } catch (err) { next(err); }
};
