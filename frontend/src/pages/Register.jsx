import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const login = authStore((s) => s.login);
  const [form, setForm] = useState({ name: "", email: "", password: "", university: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.user, res.data.accessToken);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col pt-14">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600 opacity-[0.05] rounded-full blur-[80px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm relative z-10">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                <span className="text-black font-black text-xs">CE</span>
              </div>
              <span className="text-white font-semibold">Campus Exchange</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-1 text-center">Create account</h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            Already have one? <Link to="/login" className="text-white hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
              <input type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-base" required autoComplete="name" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-base" required autoComplete="email" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Password</label>
              <input type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-base" required autoComplete="new-password" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">University</label>
              <input type="text" placeholder="e.g. GTU, IIT Bombay"
                value={form.university} onChange={e => setForm({ ...form, university: e.target.value })}
                className="input-base" required />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <p className="text-gray-600 text-xs">By signing up you agree to our terms.</p>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-60">
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
