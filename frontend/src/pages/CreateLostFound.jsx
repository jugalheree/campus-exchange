import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { LOST_FOUND_CATEGORIES } from "../config/categories";

export default function CreateLostFound() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: "lost", title: "", description: "", category: "", location: "", date: "", contact: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { setError("Please select a category."); return; }
    setError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      images.forEach(img => fd.append("images", img));
      await api.post("/lost-found", fd);
      navigate("/lost-found");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post. Try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-6 pb-24">

        <Link to="/lost-found" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Lost & Found
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Post an Item</h1>
          <p className="text-gray-500 text-sm">Help your campus community find what's lost</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          {/* Lost / Found toggle */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">This item is…</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set("type", "lost")}
                className={`p-4 rounded-xl border text-center transition ${form.type === "lost" ? "bg-red-500/15 border-red-500/40 text-red-300" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                <p className="text-2xl mb-1">🔍</p>
                <p className="font-semibold text-sm">I Lost It</p>
                <p className="text-[10px] opacity-60 mt-0.5">Help me find it</p>
              </button>
              <button type="button" onClick={() => set("type", "found")}
                className={`p-4 rounded-xl border text-center transition ${form.type === "found" ? "bg-green-500/15 border-green-500/40 text-green-300" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                <p className="text-2xl mb-1">📦</p>
                <p className="font-semibold text-sm">I Found It</p>
                <p className="text-[10px] opacity-60 mt-0.5">Help me return it</p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Item Name</label>
            <input type="text" placeholder="e.g. Black OnePlus phone, Blue water bottle..." value={form.title}
              onChange={e => set("title", e.target.value)} className="input-base" required />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea placeholder="Describe the item — colour, brand, any identifying marks..." value={form.description}
              onChange={e => set("description", e.target.value)} rows={3} className="input-base resize-none" required />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {LOST_FOUND_CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => set("category", c.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition ${form.category === c.value ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:border-white/15"}`}>
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{c.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              {form.type === "lost" ? "Where did you lose it?" : "Where did you find it?"}
            </label>
            <input type="text" placeholder="e.g. Library Block B, Canteen, Lab 301..." value={form.location}
              onChange={e => set("location", e.target.value)} className="input-base" required />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              {form.type === "lost" ? "When did you lose it?" : "When did you find it?"}
            </label>
            <input type="date" value={form.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => set("date", e.target.value)} className="input-base" required />
          </div>

          {/* Contact */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Contact <span className="normal-case text-gray-600">(optional — phone, UPI, etc.)</span>
            </label>
            <input type="text" placeholder="e.g. 9876543210 or WhatsApp number" value={form.contact}
              onChange={e => set("contact", e.target.value)} className="input-base" />
          </div>

          {/* Photos */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Photos <span className="normal-case text-gray-600">(optional, up to 3)</span></label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-5 cursor-pointer hover:border-white/20 transition">
              <svg className="w-7 h-7 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-500 text-sm">Add a photo to help identify</span>
              <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-60">
            {submitting ? "Posting..." : `Post as ${form.type === "lost" ? "Lost" : "Found"} →`}
          </button>
        </form>
      </div>
    </div>
  );
}
