import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wishlist")
      .then(r => setWishlist(r.data.wishlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.post(`/wishlist/${productId}`);
      setWishlist(prev => prev.filter(p => p._id !== productId));
    } catch { alert("Failed to remove"); }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2">Saved Items</h1>
          <p className="text-gray-500">Products you've saved for later</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-5xl mb-4">♡</p>
            <p className="text-gray-400 text-lg mb-2">No saved items yet</p>
            <p className="text-gray-600 text-sm mb-8">Tap the heart icon on any listing to save it here.</p>
            <Link to="/products" className="btn-primary px-8 py-3 rounded-xl inline-block text-sm">Browse Marketplace</Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-6">{wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {wishlist.map(product => (
                <div key={product._id} className="relative group">
                  <ProductCard product={product} />
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-pink-400 flex items-center justify-center text-sm hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 z-10"
                    title="Remove from wishlist"
                  >✕</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
