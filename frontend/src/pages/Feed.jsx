import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const TYPE_META = {
  followed_listing: { label: "Following", color: "text-violet-400", dot: "bg-violet-400" },
  campus_listing:   { label: "New on campus", color: "text-indigo-400", dot: "bg-indigo-400" },
  hot_item:         { label: "Trending", color: "text-amber-400", dot: "bg-amber-400" },
};

function FeedCard({ item }) {
  const meta = TYPE_META[item.type] || {};
  const p = item.product;
  if (!p) return null;

  return (
    <div className="flex gap-4 py-4 border-b border-white/[0.05] last:border-0 group">
      {/* Thumbnail */}
      <Link to={`/products/${p._id}`} className="shrink-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.04]">
          {p.images?.[0]
            ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
          }
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`flex items-center gap-1.5 text-[10px] font-medium ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <span className="text-gray-600 text-[10px]">{formatTime(item.time)}</span>
        </div>
        <Link to={`/products/${p._id}`} className="text-sm font-medium text-gray-200 hover:text-white transition line-clamp-1">
          {p.title}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{item.text}</p>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-white">₹{p.price?.toLocaleString()}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">{p.category}</p>
      </div>
    </div>
  );
}

function formatTime(date) {
  const diff = Date.now() - new Date(date);
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function Feed() {
  const [feed, setFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [feedRes, trendRes, recRes] = await Promise.all([
          api.get("/feed"),
          api.get("/products/trending"),
          api.get("/products/recommendations"),
        ]);
        setFeed(feedRes.data.feed || []);
        setTrending(trendRes.data.products || []);
        setRecommendations(recRes.data.products || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 pb-24">

        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Campus Feed</h1>
          <p className="text-gray-500 text-sm">Activity from your campus community</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit mb-8">
          {[
            { id: "feed", label: "Activity" },
            { id: "trending", label: "Trending" },
            { id: "for-you", label: "For You" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : (
          <>
            {/* Activity feed */}
            {tab === "feed" && (
              feed.length === 0 ? (
                <div className="card p-16 text-center">
                  <p className="text-4xl mb-3">👋</p>
                  <p className="text-gray-400 mb-2">Your feed is quiet</p>
                  <p className="text-gray-600 text-sm mb-6">Follow sellers and save items to see activity here</p>
                  <Link to="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">Browse Marketplace</Link>
                </div>
              ) : (
                <div className="card px-5 py-2">
                  {feed.map((item, i) => <FeedCard key={i} item={item} />)}
                </div>
              )
            )}

            {/* Trending */}
            {tab === "trending" && (
              trending.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-gray-400">No trending items this week yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trending.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
              )
            )}

            {/* For You (recommendations) */}
            {tab === "for-you" && (
              recommendations.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">💡</p>
                  <p className="text-gray-400 mb-2">Save items to get recommendations</p>
                  <p className="text-gray-600 text-sm">We'll suggest listings based on what you've saved</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-5">Based on your saved items</p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendations.map(p => <ProductCard key={p._id} product={p} />)}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
