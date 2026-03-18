import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";
import { LOST_FOUND_CATEGORIES } from "../config/categories";

function PostCard({ post, onDelete, onResolve, isOwner }) {
  const isLost = post.type === "lost";
  const daysAgo = Math.floor((Date.now() - new Date(post.createdAt)) / 86400000);
  const timeStr = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

  return (
    <div className={`card card-hover overflow-hidden relative ${post.status === "resolved" ? "opacity-60" : ""}`}>
      <Link to={`/lost-found/${post._id}`} className="block">
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

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-1.5 px-4 pb-3">
          <Link to={`/lost-found/${post._id}`}
            className="flex-1 py-1.5 text-center rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition">
            Edit
          </Link>
          {post.status !== "resolved" && (
            <button onClick={() => onResolve(post._id)}
              className="flex-1 py-1.5 rounded-lg border border-green-500/20 text-green-400 text-xs hover:bg-green-500/10 transition">
              Resolved
            </button>
          )}
          <button onClick={() => onDelete(post._id)}
            className="py-1.5 px-2.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500 hover:text-white transition">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function LostFound() {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [viewTab, setViewTab] = useState("all"); // "all" | "mine"
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const user = authStore(s => s.user);
  const navigate = useNavigate();

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

  const fetchMyPosts = async () => {
    try {
      const res = await api.get("/lost-found/my");
      setMyPosts(res.data.posts || []);
    } catch { setMyPosts([]); }
  };

  useEffect(() => { fetchPosts(1); setPage(1); }, [tab, category]);

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchPosts(1); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/lost-found/${id}`);
      setMyPosts(p => p.filter(x => x._id !== id));
      setPosts(p => p.filter(x => x._id !== id));
    } catch { alert("Failed to delete"); }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/lost-found/${id}/resolve`);
      setMyPosts(p => p.map(x => x._id === id ? { ...x, status: "resolved" } : x));
      setPosts(p => p.map(x => x._id === id ? { ...x, status: "resolved" } : x));
    } catch { alert("Failed to mark as resolved"); }
  };

  const userId = user?.id || user?._id;

  return (
    <div className="page">
      <div className="container-page">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="section-label">Campus</p>
            <h1 className="text-xl font-bold mt-0.5">Lost & Found</h1>
          </div>
          <Link to="/lost-found/new" className="flex items-center gap-1.5 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-2xl hover:bg-gray-100 transition active:scale-95">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            Post
          </Link>
        </div>

        {/* View toggle: All / My Posts */}
        {user && (
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-4 w-fit">
            {[["all", "All Posts"], ["mine", "My Posts"]].map(([v, l]) => (
              <button key={v} onClick={() => setViewTab(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewTab === v ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>
                {l} {v === "mine" && myPosts.length > 0 && <span className="ml-1 text-xs opacity-60">{myPosts.length}</span>}
              </button>
            ))}
          </div>
        )}

        {viewTab === "mine" ? (
          /* My Posts view */
          <div>
            {myPosts.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-gray-400 text-sm mb-4">No posts yet</p>
                <Link to="/lost-found/new" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex">Post something</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myPosts.map(p => (
                  <PostCard
                    key={p._id}
                    post={p}
                    isOwner={true}
                    onDelete={handleDelete}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* All Posts view */
          <>
            {/* Type filter */}
            <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit mb-4">
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
              <button type="submit" className="btn-primary px-4 min-h-0 h-[52px] rounded-xl text-sm">Search</button>
            </form>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setCategory("")}
                className={`px-3.5 py-2 rounded-xl text-xs shrink-0 border transition ${!category ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                All
              </button>
              {LOST_FOUND_CATEGORIES?.map(c => (
                <button key={c.value} onClick={() => setCategory(category === c.value ? "" : c.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs shrink-0 border transition ${category === c.value ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {c.icon} {c.value}
                </button>
              ))}
            </div>

            {!loading && <p className="text-gray-600 text-xs mb-3">{total} post{total !== 1 ? "s" : ""}</p>}

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-gray-400 mb-2 text-sm">No posts found</p>
                <p className="text-gray-600 text-xs mb-5">Lost something or found something? Post it here.</p>
                <Link to="/lost-found/new" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex">Post Now</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {posts.map(p => (
                  <PostCard
                    key={p._id}
                    post={p}
                    isOwner={p.poster?._id === userId || p.poster?.id === userId}
                    onDelete={handleDelete}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => { setPage(p => Math.max(1,p-1)); fetchPosts(page-1); }} disabled={page===1}
                  className="btn-ghost px-4 py-2 text-sm min-h-0 h-11 rounded-xl disabled:opacity-30">← Prev</button>
                <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => { setPage(p => p+1); fetchPosts(page+1); }} disabled={page===totalPages}
                  className="btn-ghost px-4 py-2 text-sm min-h-0 h-11 rounded-xl disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
