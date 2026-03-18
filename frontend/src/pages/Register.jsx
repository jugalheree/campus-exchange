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
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      // FIX: pass refreshToken so user stays logged in on reload
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div
      className="min-h-screen bg-[#080808] text-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="px-5 pt-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white transition text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0">
            <span className="text-black font-black text-sm">CE</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Create account</p>
            <p className="text-gray-500 text-sm">Join your campus</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="section-label block">Full name</label>
            <input type="text" placeholder="Your full name" value={form.name}
              onChange={e => set("name", e.target.value)}
              className="input-base" required autoComplete="name" />
          </div>

          <div className="space-y-2">
            <label className="section-label block">Email</label>
            <input type="email" placeholder="you@university.edu" value={form.email}
              onChange={e => set("email", e.target.value)}
              className="input-base" required autoComplete="email" autoCapitalize="none" />
          </div>

          <div className="space-y-2">
            <label className="section-label block">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={form.password}
                onChange={e => set("password", e.target.value)}
                className="input-base pr-12" required autoComplete="new-password" minLength={6} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPw
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="section-label block">University</label>
            <input type="text" placeholder="e.g. GTU, IIT Bombay" value={form.university}
              onChange={e => set("university", e.target.value)}
              className="input-base" required />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <p className="text-gray-600 text-xs">By signing up you agree to our terms.</p>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Creating account...
              </span>
            ) : "Create account →"}
          </button>
        </form>

        <p className="text-gray-600 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
