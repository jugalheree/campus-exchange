import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function CreateNote() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", subject: "", semester: "", price: "0" });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please upload a PDF file."); return; }
    if (!form.semester) { setError("Please select a semester."); return; }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      formData.append("images", file);
      await api.post("/notes", formData);
      navigate("/notes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload notes. Please try again.");
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
          <h1 className="text-4xl font-bold mb-2">Upload Notes</h1>
          <p className="text-gray-500">Share your study material with your campus.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Title</label>
            <input type="text" name="title" placeholder="e.g. Data Structures Complete Notes — Sem 3" value={form.title} onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea name="description" placeholder="What topics are covered? Any important details?" value={form.description} onChange={handleChange} rows="3" className="input-base resize-none" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Subject</label>
            <input type="text" name="subject" placeholder="e.g. Data Structures, Physics, Chemistry" value={form.subject} onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Semester</label>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5,6,7,8].map((s) => (
                <button type="button" key={s} onClick={() => setForm({ ...form, semester: s.toString() })}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${form.semester === s.toString() ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                  Sem {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Price (₹) — set 0 for free</label>
            <input type="number" name="price" placeholder="0" value={form.price} min="0" onChange={handleChange} className="input-base" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Upload PDF</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 cursor-pointer hover:border-white/20 transition">
              {file ? (
                <div className="text-center">
                  <p className="text-2xl mb-2">📄</p>
                  <p className="text-green-400 font-medium text-sm">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-gray-500 text-sm">Click to upload PDF</span>
                  <span className="text-gray-600 text-xs mt-1">PDF format only</span>
                </>
              )}
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
            </label>
            {file && (
              <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs text-gray-500 hover:text-red-400 transition">Remove file</button>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? "Uploading..." : "Publish Notes →"}
          </button>
        </form>
      </div>
    </div>
  );
}
