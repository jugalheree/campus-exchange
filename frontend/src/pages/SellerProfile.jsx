import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function SellerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");
  const [startingChat, setStartingChat] = useState(false);
  const currentUser = authStore(s => s.user);

  useEffect(() => {
    api.get(`/follow/profile/${userId}`)
      .then(r => { setData(r.data); setFollowing(r.data.isFollowing); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggleFollow = async () => {
    setToggling(true);
    try {
      const res = await api.post(`/follow/${userId}`);
      setFollowing(res.data.following);
      setData(d => ({ ...d, followers: res.data.following ? d.followers + 1 : d.followers - 1 }));
    } catch { alert("Failed to update follow"); }
    finally { setToggling(false); }
  };

  const handleMessage = async () => {
    setStartingChat(true);
    try {
      const res = await api.post("/messages/conversation/start", { recipientId: userId });
      navigate(`/messages/${res.data.conversationId}`);
    } catch { navigate("/messages"); }
    finally { setStartingChat(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
      <p className="text-gray-400">User not found.</p>
    </div>
  );

  const { user, listings, followers, following: followingCount } = data;
  const isOwn = currentUser?.id === userId || currentUser?._id === userId;
  const products = listings || [];

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-6 pb-24">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        {/* ── Profile Header ── */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl font-black text-white ${following ? "p-[3px] bg-gradient-to-tr from-violet-500 via-indigo-500 to-purple-600" : "bg-gradient-to-br from-violet-500/80 to-indigo-600/80"}`}>
                {following ? (
                  <div className="w-full h-full rounded-full bg-[#080808] flex items-center justify-center">
                    <span className="text-3xl font-black">{user.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                ) : (
                  user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <h1 className="text-lg font-bold">{user.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-gray-400 capitalize">{user.role}</span>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-base font-bold leading-none">{products.length}</p>
                  <p className="text-gray-500 text-xs mt-1">listings</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold leading-none">{followers}</p>
                  <p className="text-gray-500 text-xs mt-1">followers</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold leading-none">{followingCount}</p>
                  <p className="text-gray-500 text-xs mt-1">following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">🎓 {user.university}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Action buttons */}
          {!isOwn ? (
            <div className="flex gap-2">
              <button onClick={handleToggleFollow} disabled={toggling}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
                  following
                    ? "bg-white/[0.08] border border-white/10 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                    : "bg-white text-black hover:bg-gray-100"
                }`}>
                {toggling ? "..." : following ? "Following" : "Follow"}
              </button>
              <button onClick={handleMessage} disabled={startingChat}
                className="flex-1 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-sm font-medium hover:bg-white/[0.14] transition disabled:opacity-60">
                {startingChat ? "Opening..." : "Message"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/profile" className="flex-1 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-sm font-medium text-center hover:bg-white/[0.12] transition">
                Edit profile
              </Link>
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-t border-white/[0.07] mb-1">
          <button onClick={() => setActiveTab("grid")}
            className={`flex-1 flex justify-center py-3 transition border-t-2 -mt-px ${activeTab === "grid" ? "border-white text-white" : "border-transparent text-gray-600 hover:text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        {/* ── Grid ── */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">No active listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {products.map(p => (
              <Link key={p._id} to={`/products/${p._id}`} className="relative aspect-square overflow-hidden group">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-3xl">📦</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition text-center px-2">
                    <p className="text-white font-bold text-sm leading-tight line-clamp-2">{p.title}</p>
                    <p className="text-white/80 text-xs mt-1">₹{p.price?.toLocaleString()}</p>
                  </div>
                </div>
                {p.status === "sold" && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">SOLD</span>
                  </div>
                )}
                {p.boosted && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded">⚡</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
