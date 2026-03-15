import { useEffect, useState } from "react";
import api from "../services/api";
import { authStore } from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";

function FollowListModal({ title, userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/follow/list/${userId}?type=${type}`)
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <p className="font-semibold text-sm">{title}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-t-white border-r-2 border-r-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">No {type} yet.</p>
            </div>
          ) : (
            users.map(u => (
              <Link key={u._id} to={`/seller/${u._id}`} onClick={onClose}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500">🎓 {u.university}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const user = authStore((state) => state.user);
  const setUser = authStore((state) => state.setUser);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("grid");
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [sellerStats, setSellerStats] = useState(null);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", university: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [modal, setModal] = useState(null); // "followers" | "following" | null

  useEffect(() => {
    if (!user) return;
    setFormData({ name: user.name, university: user.university, bio: user.bio || "", upiId: user.upiId || "" });

    const fetchAll = async () => {
      try {
        const userId = user.id || user._id;
        const [prodRes, noteRes, followRes, statsRes] = await Promise.all([
          api.get("/products/my"),
          api.get("/notes/my"),
          api.get(`/follow/counts/${userId}`),
          api.get(`/sellers/${userId}/stats`),
        ]);
        setProducts(prodRes.data.products || []);
        setNotes(noteRes.data.notes || []);
        setFollowCounts({ followers: followRes.data.followers, following: followRes.data.following });
        setSellerStats(statsRes.data.stats || null);
      } catch {}
      finally { setLoadingStats(false); }
    };
    fetchAll();
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      const res = await api.put("/auth/profile", { name: formData.name, university: formData.university, upiId: formData.upiId });
      await api.put("/sellers/bio", { bio: formData.bio });
      setUser(res.data.user);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center pt-14">
      <p className="text-gray-400">Please login to view your profile.</p>
    </div>
  );

  const score = sellerStats?.sellerScore || 0;
  const scoreBadge = score >= 70 ? { label: "Top Seller", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" }
    : score >= 40 ? { label: "Active Seller", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" }
    : null;

  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const soldCount = products.filter(p => p.status === "sold").length;

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      {modal && (
        <FollowListModal
          title={modal === "followers" ? "Followers" : "Following"}
          userId={user.id || user._id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-6 pb-24">

        {/* ── Profile header ── */}
        <div className="mb-8">
          <div className="flex items-start gap-5 mb-5">

            {/* Avatar + score ring */}
            <div className="relative shrink-0">
              <svg width="88" height="88" className="absolute -inset-2 rotate-[-90deg]">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                <circle cx="44" cy="44" r="38" fill="none"
                  stroke={score >= 70 ? "#4ade80" : score >= 40 ? "#a78bfa" : "#334155"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 239} 239`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white relative z-10">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h1 className="text-lg font-bold leading-none">{user.name}</h1>
                {scoreBadge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${scoreBadge.color}`}>
                    {scoreBadge.label}
                  </span>
                )}
                {saveSuccess && <span className="text-green-400 text-xs">✓ Saved</span>}
              </div>

              <div className="flex gap-5">
                <div className="text-center">
                  <p className="text-base font-bold leading-none">{products.length + notes.length}</p>
                  <p className="text-gray-500 text-xs mt-1">listings</p>
                </div>
                <button onClick={() => setModal("followers")} className="text-center hover:opacity-70 transition">
                  <p className="text-base font-bold leading-none">{followCounts.followers}</p>
                  <p className="text-gray-500 text-xs mt-1">followers</p>
                </button>
                <button onClick={() => setModal("following")} className="text-center hover:opacity-70 transition">
                  <p className="text-base font-bold leading-none">{followCounts.following}</p>
                  <p className="text-gray-500 text-xs mt-1">following</p>
                </button>
              </div>
            </div>
          </div>

          {/* Bio + details */}
          {!editing ? (
            <div className="mb-4">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">🎓 {user.university}</p>
              {user.bio && <p className="text-gray-400 text-sm mt-1 leading-relaxed">{user.bio}</p>}
              <p className="text-gray-500 text-xs mt-1">{user.email}</p>
              {user.upiId && <p className="text-gray-500 text-xs mt-0.5 font-mono">💳 {user.upiId}</p>}
            </div>
          ) : (
            <div className="mb-4 space-y-2.5">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-base text-sm" placeholder="Full Name" />
              <input value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })}
                className="input-base text-sm" placeholder="University" />
              <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="input-base text-sm resize-none" placeholder="Bio (e.g. CS final year · sells notes + books)" rows={2} maxLength={200} />
              <p className="text-gray-600 text-xs text-right">{formData.bio.length}/200</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input value={formData.upiId} onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                  className="input-base text-sm pl-8" placeholder="UPI ID (e.g. name@gpay)" />
              </div>
              <p className="text-gray-600 text-xs">Add your UPI ID so buyers can pay you directly</p>
              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm font-medium hover:bg-white/[0.11] transition">
                  Edit profile
                </button>
                <Link to="/dashboard"
                  className="flex-1 py-2 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm font-medium text-center hover:bg-white/[0.11] transition">
                  Dashboard
                </Link>
                <Link to="/wishlist" className="py-2 px-3.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm hover:bg-white/[0.11] transition">♥</Link>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setSaveError(""); }}
                  className="flex-1 py-2 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm hover:bg-white/[0.11] transition">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Seller stats strip ── */}
        {!loadingStats && sellerStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 pb-6 border-b border-white/[0.06]">
            {[
              { label: "Score", value: score, sub: "out of 100" },
              { label: "Sold", value: soldCount, sub: "items" },
              { label: "Rating", value: sellerStats.avgRating > 0 ? `★ ${sellerStats.avgRating}` : "—", sub: `${sellerStats.totalReviews} reviews` },
              { label: "Value", value: `₹${(totalValue / 1000).toFixed(1)}k`, sub: "listed" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 text-center">
                <p className="text-base font-bold">{s.value}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Highlights strip ── */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { label: "Products", icon: "📦", to: "#", action: () => setActiveTab("grid") },
            { label: "Notes", icon: "📝", to: "#", action: () => setActiveTab("notes") },
            { label: "Offers", icon: "💰", to: "/offers" },
            { label: "Saved", icon: "♥", to: "/wishlist" },
            { label: "Feed", icon: "📡", to: "/feed" },
          ].map(h => (
            h.action ? (
              <button key={h.label} onClick={h.action} className="flex flex-col items-center gap-1.5 shrink-0 group">
                <div className="w-14 h-14 rounded-full border-2 border-white/[0.08] group-hover:border-white/25 transition bg-white/[0.03] flex items-center justify-center text-xl">
                  {h.icon}
                </div>
                <p className="text-[10px] text-gray-500 group-hover:text-gray-300 transition">{h.label}</p>
              </button>
            ) : (
              <Link key={h.label} to={h.to} className="flex flex-col items-center gap-1.5 shrink-0 group">
                <div className="w-14 h-14 rounded-full border-2 border-white/[0.08] group-hover:border-white/25 transition bg-white/[0.03] flex items-center justify-center text-xl">
                  {h.icon}
                </div>
                <p className="text-[10px] text-gray-500 group-hover:text-gray-300 transition">{h.label}</p>
              </Link>
            )
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-t border-white/[0.06] mb-0.5">
          {[
            { id: "grid", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
            { id: "notes", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex justify-center py-3 transition border-t-2 -mt-px ${activeTab === tab.id ? "border-white text-white" : "border-transparent text-gray-600 hover:text-gray-400"}`}>
              {tab.icon}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loadingStats ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : activeTab === "grid" ? (
          products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-400 text-sm mb-4">No products yet.</p>
              <Link to="/create-product" className="text-sm text-white underline underline-offset-4">List your first item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {products.map(p => (
                <Link key={p._id} to={`/products/${p._id}`} className="relative aspect-square overflow-hidden group bg-white/[0.03]">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-end p-2">
                    <div className="opacity-0 group-hover:opacity-100 transition w-full">
                      <p className="text-white font-bold text-xs truncate">{p.title}</p>
                      <p className="text-white/80 text-[10px]">₹{p.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  {p.status === "sold" && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">SOLD</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )
        ) : (
          notes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-400 text-sm mb-4">No notes yet.</p>
              <Link to="/create-note" className="text-sm text-white underline underline-offset-4">Upload your first note</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {notes.map(n => (
                <Link key={n._id} to={`/notes/${n._id}`}
                  className="relative aspect-square bg-white/[0.03] overflow-hidden group flex flex-col items-center justify-center gap-1.5 p-3 hover:bg-white/[0.06] transition border border-white/[0.04]">
                  <span className="text-2xl">📄</span>
                  <p className="text-[10px] text-center text-gray-400 line-clamp-2 leading-tight">{n.title}</p>
                  <p className={`text-[10px] font-semibold ${n.price === 0 ? "text-green-400" : "text-white"}`}>
                    {n.price === 0 ? "Free" : `₹${n.price}`}
                  </p>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
