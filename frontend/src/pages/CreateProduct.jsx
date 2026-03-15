import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const CATEGORIES = ["Notes", "Books", "Calculators", "Electronics", "Lab Equipment", "Other"];
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "", condition: "", price: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.condition) { setError("Please select a condition."); return; }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      images.forEach((img) => formData.append("images", img));
      await api.post("/products", formData);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">List an Item</h1>
          <p className="text-gray-500">Share what you have with your campus community.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
            <input type="text" name="title" placeholder="e.g. Engineering Mathematics Textbook" onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea name="description" placeholder="Describe your item — edition, condition details, what's included..." onChange={handleChange} rows="4" className="input-base resize-none" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button type="button" key={cat} onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${form.category === cat ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Condition</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button type="button" key={c.value} onClick={() => setForm({ ...form, condition: c.value })}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${form.condition === c.value ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Price (₹)</label>
            <input type="number" name="price" placeholder="0" min="0" onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Images</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 cursor-pointer hover:border-white/20 transition">
              <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-gray-500 text-sm">Click to upload images</span>
              <span className="text-gray-600 text-xs mt-1">JPG, PNG up to 10MB each</span>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" required />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="rounded-xl h-20 w-full object-cover" />
                    <button type="button" onClick={() => {
                      setImages(images.filter((_, idx) => idx !== i));
                      setPreviews(previews.filter((_, idx) => idx !== i));
                    }} className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? "Publishing..." : "Publish Listing →"}
          </button>
        </form>
      </div>
    </div>
  );
}
