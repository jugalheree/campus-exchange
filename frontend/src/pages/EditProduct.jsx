import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { MARKETPLACE_CATEGORIES, CONDITIONS } from "../config/categories";
import { authStore } from "../store/authStore";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    price: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.product;

        if (p.seller?._id?.toString() !== user?.id) {
          navigate("/dashboard");
          return;
        }

        setForm({
          title: p.title,
          description: p.description,
          category: p.category,
          condition: p.condition,
          price: p.price.toString(),
        });

        setExistingImages(p.images || []);
      } catch {
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      newImages.forEach((img) => {
        formData.append("images", img);
      });

      await api.put(`/products/${id}`, formData);

      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center pt-14">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Listing</h1>
          <p className="text-gray-500">Update your product details.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="input-base resize-none"
              required
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Category
            </label>

            <div className="flex flex-wrap gap-2">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() =>
                    setForm({ ...form, category: cat.value })
                  }
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    form.category === cat.value
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONDITION */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Condition
            </label>

            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() =>
                    setForm({ ...form, condition: c.value })
                  }
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    form.condition === c.value
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Price (₹)
            </label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          {/* CURRENT IMAGES */}
          {existingImages.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
                Current Images
              </label>

              <div className="flex gap-3 flex-wrap">
                {existingImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl opacity-60"
                  />
                ))}
              </div>
            </div>
          )}

          {/* UPLOAD NEW IMAGES */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">
              Replace Images (optional)
            </label>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-white/20 transition">
              <span className="text-gray-500 text-sm">
                Click to upload new images
              </span>

              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files);

                  setNewImages(files);

                  setPreviews(
                    files.map((f) => URL.createObjectURL(f))
                  );
                }}
              />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="rounded-xl h-20 w-full object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary py-3.5 rounded-xl disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>

            <Link
              to={`/products/${id}`}
              className="btn-ghost px-6 py-3.5 rounded-xl text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};