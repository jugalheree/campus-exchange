import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

// Google Sign In button component
function GoogleButton({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.98] disabled:opacity-60"
      style={{
        background: "white",
        color: "#1a1a1a",
        border: "1.5px solid rgba(0,0,0,0.12)",
        minHeight: 52,
      }}
    >
      {loading ? (
        <svg className="animate-spin w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}

// University picker — shown for new Google users
function UniversityPicker({ googleData, onComplete, onCancel }) {
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = authStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!university.trim()) { setError("Please enter your university name"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/google", {
        credential: googleData.credential,
        university: university.trim(),
      });
      if (res.data.success) {
        login(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Google avatar */}
        <div className="flex flex-col items-center mb-6">
          {googleData.picture && (
            <img src={googleData.picture} alt="" className="w-16 h-16 rounded-full mb-3" />
          )}
          <p className="font-bold text-base">{googleData.name}</p>
          <p className="text-sm text-gray-500">{googleData.email}</p>
        </div>

        <p className="font-semibold text-sm mb-1">One last thing 👋</p>
        <p className="text-xs text-gray-500 mb-4">Which university are you from?</p>

        {error && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs text-red-400"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="e.g. Parul University, GTU..."
            value={university}
            onChange={e => setUniversity(e.target.value)}
            className="input-base"
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Joining..." : "Join Campus Exchange →"}
          </button>
          <button type="button" onClick={onCancel}
            className="w-full py-2 text-sm text-gray-500 hover:text-white transition">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleData, setGoogleData] = useState(null); // for university picker
  const { login } = authStore();
  const navigate = useNavigate();

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });
      }
    };

    return () => {
      // cleanup
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/google", { credential: response.credential });

      if (res.data.needsUniversity) {
        // New user needs to pick university
        setGoogleData({ ...res.data.googleData, credential: response.credential });
        setGoogleLoading(false);
        return;
      }

      if (res.data.success) {
        login(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    } finally { setGoogleLoading(false); }
  };

  const handleGoogleClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError("Google sign-in not loaded. Please refresh.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "#000", color: "#fff" }}>

      {/* University picker for new Google users */}
      {googleData && (
        <UniversityPicker
          googleData={googleData}
          onCancel={() => setGoogleData(null)}
        />
      )}

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
          <span className="text-black font-black text-xl tracking-tight">CE</span>
        </div>
        <h1 className="font-black text-2xl tracking-tight">Campus Exchange</h1>
        <p className="text-sm mt-1" style={{ color: "#606060" }}>The student marketplace</p>
      </div>

      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <GoogleButton onClick={handleGoogleClick} loading={googleLoading} />

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs font-medium" style={{ color: "#404040" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="input-base"
            required autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="input-base"
            required autoComplete="current-password"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60"
            style={{ background: "#1a1a1a", color: "white", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            {loading ? "Signing in..." : "Sign In with Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "#606060" }}>
            Don't have an account?{" "}
            <Link to="/register" className="text-white font-semibold hover:opacity-80 transition">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
