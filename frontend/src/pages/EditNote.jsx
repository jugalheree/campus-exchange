import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  const [form, setForm] = useState({ title: "", description: "", subject: "", semester: "", price: "0" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newFile, setNewFile] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const { data } = await api.get(`/notes/${id}`);
        const n = data.note;
        if (n.seller?._id?.toString() !== user?.id) { navigate("/dashboard"); return; }
        setForm({ title: n.title, description: n.description, subject: n.subject, semester: n.semester.toString(), price: n.price.toString() });
      } catch {
        setError("Failed to load note.");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      if (newFile) formData.append("images", newFile);
      await api.put(`/notes/${id}`, formData);
      navigate(`/notes/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center pt-14">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Note</h1>
          <p className="text-gray-500">Update your study material details.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input-base resize-none" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Subject</label>
            <input type="text" name="subject" value={form.subject} onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Semester</label>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5,6,7,8].map((s) => (
                <button type="button" key={s} onClick={() => setForm({ ...form, semester: s.toString() })}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${form.semester === s.toString() ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  Sem {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Price (₹)</label>
            <input type="number" name="price" value={form.price} min="0" onChange={handleChange} className="input-base" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Replace PDF (optional)</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-white/20 transition">
              {newFile ? (
                <div className="text-center">
                  <p className="text-green-400 font-medium text-sm">{newFile.name}</p>
                  <p className="text-gray-500 text-xs">{(newFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Click to upload new PDF</span>
              )}
              <input type="file" accept=".pdf" onChange={(e) => setNewFile(e.target.files[0])} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 rounded-xl disabled:opacity-60">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <Link to={`/notes/${id}`} className="btn-ghost px-6 py-3.5 rounded-xl text-sm">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
