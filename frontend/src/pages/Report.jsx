import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "wrong_info", label: "Wrong / inaccurate information" },
  { value: "scam", label: "Suspected scam" },
  { value: "other", label: "Other" },
];

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const noteId = searchParams.get("noteId");

  const [form, setForm] = useState({ reason: "", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) { setError("Please select a reason."); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/reports", { productId, noteId, ...form });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
      <div className="card p-12 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-3">Report Submitted</h2>
        <p className="text-gray-400 mb-8 text-sm">Thank you. Our team will review this listing and take appropriate action.</p>
        <button onClick={() => navigate(-1)} className="btn-primary px-8 py-3 rounded-xl text-sm inline-block">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 pb-24">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Report Listing</h1>
          <p className="text-gray-500 text-sm">Help keep Campus Exchange safe and trustworthy.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block">Reason for reporting</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${form.reason === r.value ? "border-white/30 bg-white/5" : "border-white/[0.06] hover:border-white/15"}`}>
                  <input type="radio" name="reason" value={r.value} checked={form.reason === r.value}
                    onChange={() => setForm(f => ({ ...f, reason: r.value }))} className="accent-white" />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Additional details (optional)</label>
            <textarea value={form.details} onChange={(e) => setForm(f => ({ ...f, details: e.target.value }))}
              placeholder="Provide any additional context that would help us review this..." rows={4}
              className="input-base resize-none" maxLength={500} />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
