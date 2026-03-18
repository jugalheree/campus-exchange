import { useEffect, useState, useRef } from "react";
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
    <div className="bottom-sheet">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bottom-sheet-panel relative z-10 shadow-2xl">
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-1" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <p className="font-semibold text-sm">{title}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-t-white border-r-2 border-r-transparent" /></div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center"><p className="text-gray-500 text-sm">No {type} yet.</p></div>
          ) : users.map(u => (
            <Link key={u._id} to={`/seller/${u._id}`} onClick={onClose}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : u.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">🎓 {u.university}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const user = authStore((s) => s.user);
  const setUser = authStore((s) => s.setUser);

  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("grid");
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [sellerStats, setSellerStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", university: "", bio: "", upiId: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modal, setModal] = useState(null);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

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
      const res = await api.put("/auth/profile", { name: formData.name, university: formData.university, upiId: formData.upiId, bio: formData.bio });
      setUser(res.data.user);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/auth/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload photo");
    } finally { setUploadingAvatar(false); }
  };

  if (!user) return (
    <div className="page flex items-center justify-center">
      <p className="text-gray-400">Please sign in to view your profile.</p>
    </div>
  );

  const score = sellerStats?.sellerScore || 0;
  const scoreBadge = score >= 70 ? { label: "Top Seller", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" }
    : score >= 40 ? { label: "Active Seller", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" }
    : null;
  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const soldCount = products.filter(p => p.status === "sold").length;

  return (
    <div className="page">
      {modal && (
        <FollowListModal
          title={modal === "followers" ? "Followers" : "Following"}
          userId={user.id || user._id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-6">

        {/* ── Profile header ── */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">

            {/* Avatar with upload button */}
            <div className="relative shrink-0">
              <svg width="88" height="88" className="absolute -inset-2 rotate-[-90deg]">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                <circle cx="44" cy="44" r="38" fill="none"
                  stroke={score >= 70 ? "#4ade80" : score >= 40 ? "#a78bfa" : "#334155"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 239} 239`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white relative z-10 overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.name?.charAt(0)?.toUpperCase()
                }
              </div>
              {/* Upload button */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 transition active:scale-95"
                title="Change photo"
              >
                {uploadingAvatar ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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

          {/* Bio / edit form */}
          {!editing ? (
            <div className="mb-4">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">🎓 {user.university}</p>
              {user.bio && <p className="text-gray-400 text-sm mt-1 leading-relaxed">{user.bio}</p>}
              <p className="text-gray-500 text-xs mt-1">{user.email}</p>
              {user.upiId && <p className="text-gray-500 text-xs mt-0.5 font-mono">💳 {user.upiId}</p>}
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-base text-sm" placeholder="Full Name" />
              <input value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })}
                className="input-base text-sm" placeholder="University" />
              <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="input-base text-sm resize-none" placeholder="Bio (CS final year · sells notes + books)" rows={2} maxLength={200} />
              <p className="text-gray-600 text-xs text-right -mt-1">{formData.bio.length}/200</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">💳</span>
                <input value={formData.upiId} onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                  className="input-base text-sm pl-10" placeholder="UPI ID (e.g. name@gpay)" />
              </div>
              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm font-medium hover:bg-white/[0.11] transition">
                  Edit profile
                </button>
                <Link to="/dashboard"
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm font-medium text-center hover:bg-white/[0.11] transition">
                  Dashboard
                </Link>
                <Link to="/wishlist" className="py-2.5 px-3.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm hover:bg-white/[0.11] transition">♥</Link>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setSaveError(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-sm hover:bg-white/[0.11] transition">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Seller stats ── */}
        {!loadingStats && sellerStats && (
          <div className="grid grid-cols-4 gap-2 mb-6 pb-6 border-b border-white/[0.06]">
            {[
              { label: "Score", value: score },
              { label: "Sold", value: soldCount },
              { label: "Rating", value: sellerStats.avgRating > 0 ? `★ ${sellerStats.avgRating}` : "—" },
              { label: "Value", value: `₹${(totalValue / 1000).toFixed(1)}k` },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 text-center">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Highlights strip ── */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { label: "Products", icon: "📦", action: () => setActiveTab("grid") },
            { label: "Notes", icon: "📝", action: () => setActiveTab("notes") },
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

        {/* ── Tabs ── */}
        <div className="flex border-t border-white/[0.06] mb-1">
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

        {/* ── Content grid ── */}
        {loadingStats ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : activeTab === "grid" ? (
          products.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-3xl mb-3">📦</p>
              <p className="text-gray-400 text-sm mb-4">No products yet.</p>
              <Link to="/create-product" className="text-sm text-white underline underline-offset-4">List your first item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {products.map(p => {
                const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
                const imgSrc = p.images?.[0] ? (p.images[0].startsWith("http") ? p.images[0] : `${BASE_URL}${p.images[0]}`) : null;
                return (
                  <Link key={p._id} to={`/products/${p._id}`} className="relative aspect-square overflow-hidden group bg-white/[0.03]">
                    {imgSrc ? <img src={imgSrc} alt={p.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-2">
                      <div className="opacity-0 group-hover:opacity-100 transition w-full">
                        <p className="text-white font-bold text-xs truncate">{p.title}</p>
                        <p className="text-white/80 text-[10px]">₹{p.price?.toLocaleString()}</p>
                      </div>
                    </div>
                    {p.status === "sold" && <div className="absolute top-1.5 left-1.5"><span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">SOLD</span></div>}
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          notes.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-3xl mb-3">📝</p>
              <p className="text-gray-400 text-sm mb-4">No notes yet.</p>
              <Link to="/create-note" className="text-sm text-white underline underline-offset-4">Upload your first note</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {notes.map(n => (
                <Link key={n._id} to={`/notes/${n._id}`}
                  className="relative aspect-square bg-white/[0.03] overflow-hidden group flex flex-col items-center justify-center gap-1.5 p-3 hover:bg-white/[0.06] transition">
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
