import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import QRModal from "../components/QRModal";
import BuyModal from "../components/BuyModal";
import SellerBadge from "../components/SellerBadge";
import PriceChart from "../components/PriceChart";
import RecentlyViewed, { trackView as rvTrackView } from "../components/RecentlyViewed";
import ExpiryBanner from "../components/ExpiryBanner";
import SoldConfirmModal from "../components/SoldConfirmModal";
import { authStore } from "../store/authStore";

const STARS = [1, 2, 3, 4, 5];

function MessageSellerButton({ sellerId, navigate }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await api.post("/messages/conversation/start", { recipientId: sellerId });
      navigate(`/messages/${res.data.conversationId}`);
    } catch (err) {
      // fallback: just go to messages list
      navigate("/messages");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary py-3.5 rounded-xl text-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Opening chat..." : "Message Seller"}
    </button>
  );
}

function StarRating({ value, onChange, size = "w-5 h-5" }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {STARS.map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(s)}
          className={`${size} transition-colors ${(hover || value) >= s ? "text-amber-400" : "text-gray-600"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, currentUserId, onDelete }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {review.reviewer?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{review.reviewer?.name}</p>
            <p className="text-xs text-gray-500">{review.reviewer?.university}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StarRating value={review.rating} size="w-4 h-4" />
          {review.reviewer?._id === currentUserId && (
            <button onClick={() => onDelete(review._id)} className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
          )}
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
      <p className="text-gray-600 text-xs mt-3">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modals
  const [showQR, setShowQR] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);

  // Wishlist
  const [saved, setSaved] = useState(false);
  const [savingWish, setSavingWish] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Offer
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ offerPrice: "", message: "" });
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState("");

  const currentUser = authStore((state) => state.user);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!id || id === "undefined") throw new Error("Invalid Product ID");
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        // track view
        api.post(`/products/${id}/view`).catch(() => {});
        rvTrackView(data.product);
        // fetch reviews
        const revRes = await api.get(`/reviews/${id}`);
        setReviews(revRes.data.reviews || []);
        // check wishlist
        const wishRes = await api.get(`/wishlist/check/${id}`);
        setSaved(wishRes.data.saved);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing?")) return;
    setDeleting(true);
    try { await api.delete(`/products/${id}`); navigate("/dashboard"); }
    catch { alert("Delete failed"); setDeleting(false); }
  };

  const handleToggleWishlist = async () => {
    setSavingWish(true);
    try {
      const res = await api.post(`/wishlist/${id}`);
      setSaved(res.data.saved);
    } catch { /* ignore */ }
    finally { setSavingWish(false); }
  };

  const handleToggleSold = () => {
    if (product.status === "available") {
      setShowSoldConfirm(true);
    } else {
      // Re-list directly
      api.patch(`/products/${id}/sold`)
        .then(res => setProduct(res.data.product))
        .catch(() => alert("Failed to update status"));
    }
  };

  const handleBoost = async () => {
    try {
      await api.patch(`/products/${id}/boost`);
      setProduct(p => ({ ...p, boosted: true }));
    } catch { alert("Failed to boost listing"); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewError("Please select a rating."); return; }
    setSubmittingReview(true); setReviewError("");
    try {
      const res = await api.post(`/reviews/${id}`, reviewForm);
      setReviews(prev => [res.data.review, ...prev]);
      setReviewForm({ rating: 0, comment: "" });
      setShowReviewForm(false);
      setProduct(p => ({ ...p, avgRating: res.data.review.rating, reviewCount: (p.reviewCount || 0) + 1 }));
    } catch (err) { setReviewError(err.response?.data?.message || "Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch { alert("Failed to delete review"); }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmittingOffer(true); setOfferError("");
    try {
      await api.post(`/offers/${id}`, offerForm);
      setOfferSuccess(true);
      setShowOfferForm(false);
      setOfferForm({ offerPrice: "", message: "" });
    } catch (err) { setOfferError(err.response?.data?.message || "Failed to send offer"); }
    finally { setSubmittingOffer(false); }
  };

  const shareProduct = () => setShowQR(true);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center pt-14">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );
  if (error || !product) return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center gap-4 pt-14">
      <p className="text-5xl">😕</p>
      <h2 className="text-2xl font-bold">{error || "Product not found"}</h2>
      <Link to="/products" className="text-gray-400 hover:text-white underline underline-offset-4 text-sm">← Back to Marketplace</Link>
    </div>
  );

  const isOwner = currentUser?.id === product.seller?._id?.toString();
  const COND = { new: "text-green-400 bg-green-400/10 border-green-400/20", like_new: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", good: "text-blue-400 bg-blue-400/10 border-blue-400/20", fair: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" };
  const condStyle = COND[product.condition] || "text-gray-400 bg-white/5 border-white/10";

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      {showBuy && (
        <BuyModal
          product={product}
          sellerUpi={product.seller?.upiId || ""}
          onClose={() => setShowBuy(false)}
        />
      )}
      {showQR && (
        <QRModal
          url={window.location.href}
          title={product.title}
          onClose={() => setShowQR(false)}
        />
      )}
      {showSoldConfirm && (
        <SoldConfirmModal
          product={product}
          onClose={() => setShowSoldConfirm(false)}
          onConfirm={() => setProduct(p => ({ ...p, status: "sold" }))}
        />
      )}
      <div className="max-w-6xl mx-auto px-6 py-10 pb-24">

        {isOwner && (
          <ExpiryBanner
            product={product}
            isOwner={isOwner}
            onRenewed={() => api.get(`/products/${id}`).then(r => setProduct(r.data.product))}
          />
        )}
        <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* Images */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <div className="aspect-square rounded-2xl overflow-hidden card relative">
              <img src={product.images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
              {product.status === "sold" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-500 text-white text-xl font-black px-6 py-3 rounded-xl rotate-[-12deg]">SOLD</span>
                </div>
              )}
              {product.boosted && (
                <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  ⚡ Boosted
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-white scale-105" : "border-transparent opacity-40 hover:opacity-70"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Analytics (owner only) */}
            {isOwner && (
              <div className="card p-5 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold">{product.views || 0}</p><p className="text-gray-500 text-xs mt-1">Views</p></div>
                <div><p className="text-2xl font-bold">{product.wishlistCount || 0}</p><p className="text-gray-500 text-xs mt-1">Wishlisted</p></div>
                <div><p className="text-2xl font-bold">{product.reviewCount || 0}</p><p className="text-gray-500 text-xs mt-1">Reviews</p></div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <span className="tag">{product.category}</span>
              <span className={`text-xs px-3 py-1 rounded-full border ${condStyle}`}>{product.condition?.replace("_", " ")}</span>
              {product.status === "sold" && <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 bg-red-500/10">Sold</span>}
            </div>

            <div>
              <h1 className="text-4xl font-bold leading-tight mb-3">{product.title}</h1>
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold">₹{product.price?.toLocaleString()}</p>
                {product.avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="font-semibold">{product.avgRating}</span>
                    <span className="text-gray-500 text-sm">({product.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Description</p>
              <p className="text-gray-300 leading-relaxed">{product.description}</p>
            </div>

            <SellerBadge sellerId={product.seller?._id} sellerName={product.seller?.name} />

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">University</p>
                <p className="font-medium text-sm mt-1">{product.university}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Listed On</p>
                <p className="font-medium text-sm mt-1">{new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwner ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Link to={`/edit-product/${product._id}`} className="flex-1 btn-ghost py-3 rounded-xl text-center text-sm">Edit Listing</Link>
                  <button onClick={handleToggleSold} className={`flex-1 py-3 rounded-xl border text-sm transition ${product.status === "sold" ? "border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white" : "border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"}`}>
                    {product.status === "sold" ? "Mark Available" : "Mark as Sold"}
                  </button>
                </div>
                <div className="flex gap-3">
                  {!product.boosted && <button onClick={handleBoost} className="flex-1 py-3 rounded-xl border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500 hover:text-black transition">⚡ Boost for 7 Days</button>}
                  {product.boosted && <div className="flex-1 py-3 rounded-xl border border-amber-500/30 text-amber-400 text-sm text-center opacity-60">⚡ Boosted until {new Date(product.boostedUntil).toLocaleDateString()}</div>}
                  <button onClick={handleDelete} disabled={deleting} className="py-3 px-5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500 hover:text-white transition disabled:opacity-50">Delete</button>
                </div>
                <button onClick={shareProduct} className="btn-ghost py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share Listing
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {product.status !== "sold" && (
                  <>
                    {/* Primary CTA */}
                    <button
                      onClick={() => setShowBuy(true)}
                      className="w-full py-4 rounded-2xl bg-white text-black font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Buy Now
                    </button>

                    {/* Secondary actions */}
                    <div className="flex gap-3">
                      <MessageSellerButton sellerId={product.seller?._id} navigate={navigate} />
                      <button onClick={() => setShowOfferForm(v => !v)} className="btn-ghost py-3 rounded-xl text-sm flex-1">
                        💰 Offer
                      </button>
                    </div>
                    {offerSuccess && <p className="text-green-400 text-sm text-center">✓ Offer sent! Seller will respond soon.</p>}
                    {showOfferForm && (
                      <form onSubmit={handleSubmitOffer} className="card p-5 space-y-3">
                        <p className="text-sm font-medium">Asking price: ₹{product.price?.toLocaleString()}</p>
                        {offerError && <p className="text-red-400 text-xs">{offerError}</p>}
                        <input type="number" placeholder="Your offer (₹)" value={offerForm.offerPrice}
                          onChange={(e) => setOfferForm(f => ({ ...f, offerPrice: e.target.value }))}
                          className="input-base" min="1" required />
                        <input type="text" placeholder="Message (optional)" value={offerForm.message}
                          onChange={(e) => setOfferForm(f => ({ ...f, message: e.target.value }))}
                          className="input-base" maxLength={300} />
                        <button type="submit" disabled={submittingOffer} className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-60">
                          {submittingOffer ? "Sending..." : "Send Offer"}
                        </button>
                      </form>
                    )}
                  </>
                )}
                <div className="flex gap-3">
                  <button onClick={handleToggleWishlist} disabled={savingWish}
                    className={`flex-1 py-3 rounded-xl border text-sm transition flex items-center justify-center gap-2 ${saved ? "border-pink-500/30 text-pink-400 hover:bg-pink-500/10" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                    {saved ? "♥ Saved" : "♡ Save"}
                  </button>
                  <button onClick={shareProduct} className="flex-1 btn-ghost py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                  </button>
                  <Link to={`/report?productId=${id}`} className="py-3 px-4 rounded-xl border border-white/10 text-gray-500 text-sm hover:text-red-400 hover:border-red-500/20 transition">
                    🚩
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Reviews</h2>
              {product.avgRating > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={Math.round(product.avgRating)} />
                  <span className="text-gray-400 text-sm">{product.avgRating} out of 5 · {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            {!isOwner && !reviews.find(r => r.reviewer?._id === currentUser?.id) && (
              <button onClick={() => setShowReviewForm(v => !v)} className="btn-ghost px-5 py-2.5 rounded-xl text-sm">
                {showReviewForm ? "Cancel" : "+ Write a Review"}
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="card p-6 mb-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Rating</label>
                <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm(f => ({ ...f, rating: r }))} size="w-7 h-7" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Comment</label>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this product or seller..." rows={3}
                  className="input-base resize-none" required maxLength={500} />
              </div>
              {reviewError && <p className="text-red-400 text-sm">{reviewError}</p>}
              <button type="submit" disabled={submittingReview} className="btn-primary px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-500">No reviews yet. {!isOwner ? "Be the first to leave one!" : ""}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} currentUserId={currentUser?.id} onDelete={handleDeleteReview} />
              ))}
            </div>
          )}
        </div>

        {/* Price Chart + Recently Viewed */}
        <div className="mt-12 space-y-8">
          <PriceChart productId={id} />
          <RecentlyViewed excludeId={id} />
        </div>
      </div>
    </div>
  );
}
