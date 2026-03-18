import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { authStore } from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";

/* ── Image Cropper Modal ── */
function ImageCropperModal({ file, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(img, -img.naturalWidth / 2 + crop.x / zoom, -img.naturalHeight / 2 + crop.y / zoom, img.naturalWidth, img.naturalHeight);
    ctx.restore();

    // Dark overlay with circle cutout
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, crop.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Circle border
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, crop.size / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [crop, zoom, rotation, brightness]);

  useEffect(() => { draw(); }, [draw, imgSrc]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const cy = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    dragStart.current = { x: cx, y: cy, cx: crop.x, cy: crop.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const my = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    setCrop(c => ({ ...c, x: dragStart.current.cx + (mx - dragStart.current.x), y: dragStart.current.cy + (my - dragStart.current.y) }));
  };
  const handleMouseUp = () => { isDragging.current = false; };

  const handleSave = async () => {
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const W = canvas.width, H = canvas.height;
      const size = crop.size;
      const out = document.createElement("canvas");
      out.width = 400; out.height = 400;
      const ctx = out.getContext("2d");
      ctx.drawImage(canvas, W / 2 - size / 2, H / 2 - size / 2, size, size, 0, 0, 400, 400);
      out.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        await onSave(formData);
      }, "image/jpeg", 0.92);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#111] border border-white/[0.09] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <p className="font-semibold text-sm">Edit Photo</p>
            <p className="text-xs text-gray-500 mt-0.5">Drag to reposition</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="relative bg-black flex items-center justify-center" style={{ height: 300 }}>
          {imgSrc && (
            <img ref={imgRef} src={imgSrc} alt="" onLoad={draw}
              className="hidden" crossOrigin="anonymous" />
          )}
          <canvas ref={canvasRef} width={300} height={300}
            className="cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-3 border-t border-white/[0.07]">

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500 w-16 shrink-0">Zoom</span>
            <input type="range" min="0.5" max="3" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1 rounded-full" />
            <span className="text-[11px] text-gray-400 w-8 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500 w-16 shrink-0">Rotate</span>
            <input type="range" min="-180" max="180" step="1" value={rotation}
              onChange={e => setRotation(parseInt(e.target.value))}
              className="flex-1 accent-white h-1 rounded-full" />
            <span className="text-[11px] text-gray-400 w-8 text-right">{rotation}°</span>
          </div>

          {/* Brightness */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500 w-16 shrink-0">Brightness</span>
            <input type="range" min="50" max="150" step="1" value={brightness}
              onChange={e => setBrightness(parseInt(e.target.value))}
              className="flex-1 accent-white h-1 rounded-full" />
            <span className="text-[11px] text-gray-400 w-8 text-right">{brightness}%</span>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setZoom(1); setRotation(0); setBrightness(100); setCrop(c => ({ ...c, x: 0, y: 0 })); }}
              className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition">
              Reset
            </button>
            <button onClick={() => setRotation(r => r - 90)}
              className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition">
              ↺ Rotate Left
            </button>
            <button onClick={() => setRotation(r => r + 90)}
              className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition">
              ↻ Rotate Right
            </button>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving || !imgSrc}
            className="btn-primary w-full disabled:opacity-60">
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving...
              </span>
            ) : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Follow List Modal ── */
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
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-t-white border-r-2 border-r-transparent" /></div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center"><p className="text-gray-500 text-sm">No {type} yet.</p></div>
          ) : users.map(u => (
            <Link key={u._id} to={`/seller/${u._id}`} onClick={onClose}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0)?.toUpperCase()}
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

/* ── Logout Confirmation Modal ── */
function LogoutModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#111] border border-white/[0.09] rounded-3xl w-full max-w-xs p-6 animate-scale-in">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <p className="font-bold text-center text-base mb-1">Sign out?</p>
        <p className="text-gray-500 text-sm text-center mb-6">You'll need to log back in to access your account.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Profile Component ── */
export default function Profile() {
  const user = authStore(s => s.user);
  const setUser = authStore(s => s.setUser);
  const logout = authStore(s => s.logout);
  const navigate = useNavigate();
  const fileRef = useRef(null);

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

  const [modal, setModal] = useState(null); // "followers"|"following"|"logout"|null
  const [cropFile, setCropFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
      } catch {} finally { setLoadingStats(false); }
    };
    fetchAll();
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      const res = await api.put("/auth/profile", { name: formData.name, university: formData.university, upiId: formData.upiId, bio: formData.bio });
      setUser(res.data.user);
      setSaveSuccess(true); setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setSaveError(err.response?.data?.message || "Failed to update."); }
    finally { setSaving(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = "";
  };

  const handleAvatarSave = async (formData) => {
    setAvatarUploading(true);
    try {
      const res = await api.post("/auth/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(res.data.user);
      setCropFile(null);
    } catch (err) { alert(err.response?.data?.message || "Upload failed"); }
    finally { setAvatarUploading(false); }
  };

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    navigate("/");
  };

  if (!user) return (
    <div className="page flex items-center justify-center">
      <p className="text-gray-400">Please login to view your profile.</p>
    </div>
  );

  const score = sellerStats?.sellerScore || 0;
  const scoreBadge = score >= 70
    ? { label: "Top Seller", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" }
    : score >= 40
    ? { label: "Active Seller", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" }
    : null;
  const totalListings = products.length + notes.length;
  const soldCount = products.filter(p => p.status === "sold").length;
  const totalValue = products.reduce((s, p) => s + p.price, 0);

  return (
    <div className="page">
      {/* Modals */}
      {cropFile && <ImageCropperModal file={cropFile} onSave={handleAvatarSave} onClose={() => setCropFile(null)} />}
      {modal === "followers" && <FollowListModal title="Followers" userId={user.id || user._id} type="followers" onClose={() => setModal(null)} />}
      {modal === "following" && <FollowListModal title="Following" userId={user.id || user._id} type="following" onClose={() => setModal(null)} />}
      {modal === "logout" && <LogoutModal onConfirm={handleLogout} onClose={() => setModal(null)} />}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      <div className="max-w-xl mx-auto px-4 pt-5 pb-6">

        {/* ── Header card ── */}
        <div className="card p-5 mb-4">

          {/* Avatar + stats row */}
          <div className="flex items-start gap-4 mb-4">

            {/* Avatar */}
            <div className="relative shrink-0">
              {/* Score ring */}
              <svg width="88" height="88" className="absolute -inset-2 rotate-[-90deg]">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
                <circle cx="44" cy="44" r="38" fill="none"
                  stroke={score >= 70 ? "#4ade80" : score >= 40 ? "#a78bfa" : "#334155"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${score / 100 * 239} 239`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
              </svg>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white relative z-10 overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.name?.charAt(0)?.toUpperCase()
                }
              </div>

              {/* Edit photo button */}
              <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 z-20 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 transition active:scale-95">
                {avatarUploading
                  ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                }
              </button>
            </div>

            {/* Name + stats */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-base font-bold leading-tight">{user.name}</h1>
                {scoreBadge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${scoreBadge.color}`}>
                    {scoreBadge.label}
                  </span>
                )}
                {saveSuccess && <span className="text-green-400 text-xs">✓ Saved</span>}
              </div>
              <p className="text-gray-500 text-xs mb-3">🎓 {user.university}</p>

              {/* Stats row */}
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold leading-none">{totalListings}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">listings</p>
                </div>
                <button onClick={() => setModal("followers")} className="text-center hover:opacity-70 transition">
                  <p className="text-sm font-bold leading-none">{followCounts.followers}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">followers</p>
                </button>
                <button onClick={() => setModal("following")} className="text-center hover:opacity-70 transition">
                  <p className="text-sm font-bold leading-none">{followCounts.following}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">following</p>
                </button>
              </div>
            </div>
          </div>

          {/* Bio / edit */}
          {editing ? (
            <div className="space-y-3 mb-4">
              <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                className="input-base text-sm" placeholder="Full Name" />
              <input value={formData.university} onChange={e => setFormData(f => ({ ...f, university: e.target.value }))}
                className="input-base text-sm" placeholder="University" />
              <textarea value={formData.bio} onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                className="input-base text-sm resize-none" placeholder="Bio — CS final year · sells notes + books" rows={2} maxLength={200} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">💳</span>
                <input value={formData.upiId} onChange={e => setFormData(f => ({ ...f, upiId: e.target.value }))}
                  className="input-base text-sm pl-10" placeholder="UPI ID (e.g. name@gpay)" />
              </div>
              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
            </div>
          ) : (
            <div className="mb-4">
              {user.bio && <p className="text-sm text-gray-400 leading-relaxed mb-1">{user.bio}</p>}
              <p className="text-gray-600 text-xs">{user.email}</p>
              {user.upiId && <p className="text-gray-500 text-xs mt-0.5 font-mono">💳 {user.upiId}</p>}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setSaveError(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-sm hover:bg-white/[0.1] transition">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-sm font-medium hover:bg-white/[0.1] transition">
                  Edit Profile
                </button>
                <Link to="/dashboard"
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-sm font-medium text-center hover:bg-white/[0.1] transition">
                  Dashboard
                </Link>
                <Link to="/wishlist"
                  className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-sm hover:bg-white/[0.1] transition">
                  ♡
                </Link>
                {/* Logout button */}
                <button onClick={() => setModal("logout")}
                  className="py-2.5 px-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm hover:bg-red-500/15 transition"
                  title="Sign out">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        {!loadingStats && sellerStats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Score", value: score },
              { label: "Sold", value: soldCount },
              { label: "Rating", value: sellerStats.avgRating > 0 ? `★ ${sellerStats.avgRating}` : "—" },
              { label: "Value", value: `₹${(totalValue / 1000).toFixed(1)}k` },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick links ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
          {[
            { icon: "🏷️", label: "Offers", to: "/offers" },
            { icon: "📚", label: "Notes", to: "/notes" },
            { icon: "📡", label: "Feed", to: "/feed" },
            { icon: "🏆", label: "Leaderboard", to: "/leaderboard" },
          ].map(l => (
            <Link key={l.label} to={l.to}
              className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-xl hover:border-white/20 hover:bg-white/[0.06] transition">
                {l.icon}
              </div>
              <p className="text-[10px] text-gray-500">{l.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex border-b border-white/[0.07] mb-1">
          {[{ id: "grid", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" }, { id: "notes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex justify-center py-3 transition border-t-2 -mt-px ${activeTab === t.id ? "border-white text-white" : "border-transparent text-gray-600 hover:text-gray-400"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
            </button>
          ))}
        </div>

        {/* ── Grid / Notes ── */}
        {loadingStats ? (
          <div className="grid grid-cols-3 gap-0.5">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-square skeleton" />)}
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
                const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
                const img = p.images?.[0] ? (p.images[0].startsWith("http") ? p.images[0] : `${base}${p.images[0]}`) : null;
                return (
                  <Link key={p._id} to={`/products/${p._id}`}
                    className="relative aspect-square overflow-hidden group bg-white/[0.03]">
                    {img
                      ? <img src={img} alt={p.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    }
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-2">
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
