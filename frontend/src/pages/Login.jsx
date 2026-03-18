import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = authStore((s) => s.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col pt-14">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600 opacity-[0.05] rounded-full blur-[80px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                <span className="text-black font-black text-xs">CE</span>
              </div>
              <span className="text-white font-semibold">Campus Exchange</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-1 text-center">Welcome back</h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            Don't have an account? <Link to="/register" className="text-white hover:underline">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-base" required autoComplete="email" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Password</label>
              <input type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-base" required autoComplete="current-password" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
