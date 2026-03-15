import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";
import { LOST_FOUND_CATEGORIES } from "../config/categories";

function PostCard({ post, onResolve, isOwner }) {
  const isLost = post.type === "lost";
  const daysAgo = Math.floor((Date.now() - new Date(post.createdAt)) / 86400000);
  const timeStr = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

  return (
    <Link to={`/lost-found/${post._id}`}
      className={`block card card-hover overflow-hidden ${post.status === "resolved" ? "opacity-60" : ""}`}>
      {post.images?.[0] && (
        <div className="h-36 overflow-hidden">
          <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isLost ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-green-500/15 text-green-400 border border-green-500/20"}`}>
            {isLost ? "🔍 Lost" : "📦 Found"}
          </span>
          {post.status === "resolved" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Resolved</span>
          )}
        </div>
        <h3 className="text-sm font-semibold line-clamp-1 mb-1">{post.title}</h3>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{post.description}</p>
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {post.location}
          </span>
          <span>{timeStr}</span>
        </div>
      </div>
    </Link>
  );
}

export default function LostFound() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // "all" | "lost" | "found"
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const user = authStore(s => s.user);

  const fetchPosts = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (tab !== "all") params.append("type", tab);
      if (category) params.append("category", category);
      if (search) params.append("q", search);
      const res = await api.get(`/lost-found?${params}`);
      setPosts(res.data.posts || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(1); setPage(1); }, [tab, category]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchPosts(1); };

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">Lost & Found</h1>
            <p className="text-gray-500 text-sm">Help your campus community find lost items</p>
          </div>
          <Link to="/lost-found/new" className="btn-primary px-5 py-2.5 rounded-xl text-sm">+ Post</Link>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit mb-5">
          {[["all", "All"], ["lost", "🔍 Lost"], ["found", "📦 Found"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === v ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search items, location..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-base pl-10" />
          </div>
          <button type="submit" className="btn-primary px-4 rounded-xl text-sm">Search</button>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setCategory("")}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${!category ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
            All
          </button>
          {LOST_FOUND_CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(category === c.value ? "" : c.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${category === c.value ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
              {c.icon} {c.value}
            </button>
          ))}
        </div>

        {!loading && <p className="text-gray-600 text-xs mb-4">{total} post{total !== 1 ? "s" : ""}</p>}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 mb-2">No posts found</p>
            <p className="text-gray-600 text-sm mb-6">Lost something or found something? Post it here.</p>
            <Link to="/lost-found/new" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">Post Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map(p => <PostCard key={p._id} post={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => { setPage(p => Math.max(1, p-1)); fetchPosts(page-1); }} disabled={page===1}
              className="btn-ghost px-4 py-2 text-sm disabled:opacity-30">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => { setPage(p => p+1); fetchPosts(page+1); }} disabled={page===totalPages}
              className="btn-ghost px-4 py-2 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
