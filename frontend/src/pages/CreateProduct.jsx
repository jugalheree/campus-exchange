import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { MARKETPLACE_CATEGORIES, LISTING_TYPES, CONDITIONS } from "../config/categories";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "", condition: "", price: "0", listingType: "sell" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(imgs => imgs.filter((_, idx) => idx !== i));
    setPreviews(ps => ps.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.condition) { setError("Please select a condition."); return; }
    if (images.length === 0) { setError("Please add at least one photo."); return; }
    setError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append("images", img));
      await api.post("/products", fd);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create listing.");
    } finally { setSubmitting(false); }
  };

  const isFree = form.listingType === "free";

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-6 pb-24">

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">List an Item</h1>
          <p className="text-gray-500 text-sm">Share anything with your campus community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          {/* Listing type */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">I want to…</label>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => { set("listingType", t.value); if (t.value === "free") set("price", "0"); }}
                  className={`p-3 rounded-xl border text-center transition ${form.listingType === t.value ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-60">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
            <input type="text" placeholder="e.g. Samsung Galaxy S21, Fridge 165L, Cycle..." value={form.title}
              onChange={e => set("title", e.target.value)} className="input-base" required />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea placeholder="Describe the item — specs, reason for selling, defects if any..." value={form.description}
              onChange={e => set("description", e.target.value)} rows={3} className="input-base resize-none" required />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MARKETPLACE_CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => set("category", c.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition ${form.category === c.value ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:border-white/15"}`}>
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Condition</label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map(c => (
                <button key={c.value} type="button" onClick={() => set("condition", c.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${form.condition === c.value ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:border-white/15"}`}>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-[10px] opacity-60">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          {!isFree && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                Price (₹) {form.listingType === "rent" && <span className="normal-case text-gray-600">/ per day or as agreed</span>}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input type="number" placeholder="0" value={form.price} min="0"
                  onChange={e => set("price", e.target.value)} className="input-base pl-8" required />
              </div>
            </div>
          )}
          {isFree && (
            <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
              ✓ This item will be listed as free
            </div>
          )}

          {/* Photos */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Photos <span className="normal-case text-gray-600">(up to 5)</span></label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition">
              <svg className="w-7 h-7 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-500 text-sm">Tap to add photos</span>
              <span className="text-gray-600 text-xs mt-0.5">JPG, PNG · 10MB max each</span>
              <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-60">
            {submitting ? "Publishing..." : "Publish Listing →"}
          </button>
        </form>
      </div>
    </div>
  );
}
