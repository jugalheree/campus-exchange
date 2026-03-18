import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Electronics", "Civil", "Mechanical", "Economics", "Management", "Other"];

export default function CreateNote() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", subject: "", semester: "", price: "0" });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please upload a PDF file."); return; }
    if (!form.semester) { setError("Please select a semester."); return; }
    setError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      fd.append("images", file);
      await api.post("/notes", fd);
      navigate("/notes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload notes.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page">
      <div className="max-w-lg mx-auto px-4 py-5">

        <div className="mb-5">
          <p className="section-label">Share knowledge</p>
          <h1 className="text-xl font-bold mt-0.5">Upload Notes</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="section-label block mb-2">Title</label>
            <input type="text" name="title" placeholder="e.g. Data Structures Complete Notes — Sem 3"
              value={form.title} onChange={handleChange} className="input-base" required />
          </div>

          <div>
            <label className="section-label block mb-2">Description</label>
            <textarea name="description" placeholder="What topics are covered? Any important details?"
              value={form.description} onChange={handleChange} rows={3} className="input-base resize-none" required />
          </div>

          <div>
            <label className="section-label block mb-2">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => set("subject", s)}
                  className={`px-3.5 py-2 rounded-xl text-sm border transition active:scale-95 ${form.subject === s ? "bg-white text-black border-white font-medium" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {s}
                </button>
              ))}
            </div>
            {/* Fallback text input if subject not in list */}
            <input type="text" placeholder="Or type your subject..." value={SUBJECTS.includes(form.subject) ? "" : form.subject}
              onChange={e => set("subject", e.target.value)}
              className="input-base mt-2 text-sm"
              style={{ display: SUBJECTS.includes(form.subject) ? "none" : "block" }}
            />
            {form.subject && !SUBJECTS.includes(form.subject) && (
              <p className="text-xs text-gray-500 mt-1">Subject: {form.subject}</p>
            )}
          </div>

          <div>
            <label className="section-label block mb-2">Semester</label>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5,6,7,8].map(s => (
                <button key={s} type="button" onClick={() => set("semester", s.toString())}
                  className={`w-12 h-12 rounded-xl text-sm border transition active:scale-95 font-medium ${form.semester === s.toString() ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price — FIX: inline style padding so ₹ doesn't overlap number */}
          <div>
            <label className="section-label block mb-2">
              Price <span className="normal-case text-gray-500 text-xs">— set 0 for free</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none pointer-events-none">₹</span>
              <input
                type="number"
                name="price"
                placeholder="0"
                value={form.price}
                min="0"
                onChange={handleChange}
                className="input-base"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          </div>

          {/* PDF Upload */}
          <div>
            <label className="section-label block mb-2">PDF File</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-white/20 transition active:scale-[0.99]">
              {file ? (
                <div className="text-center">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-green-400 font-medium text-sm">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-500 text-sm">Tap to upload PDF</span>
                  <span className="text-gray-600 text-xs mt-0.5">PDF format only · 20MB max</span>
                </>
              )}
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="hidden" />
            </label>
            {file && (
              <button type="button" onClick={() => setFile(null)}
                className="mt-2 text-xs text-gray-500 hover:text-red-400 transition">
                Remove file
              </button>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Uploading...
              </span>
            ) : "Publish Notes →"}
          </button>
        </form>
      </div>
    </div>
  );
}
