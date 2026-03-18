import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authStore } from "../store/authStore";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const FEATURES = [
  { icon: "🎓", title: "University-only", desc: "Verified students only." },
  { icon: "⚡", title: "List in 60s", desc: "Books, notes, gear — instantly." },
  { icon: "💬", title: "Direct chat", desc: "No middlemen." },
  { icon: "📚", title: "Study notes", desc: "Past papers, guides." },
  { icon: "💰", title: "Make offers", desc: "Negotiate with one tap." },
  { icon: "🔔", title: "Smart alerts", desc: "Price drops, messages." },
];

const QUICK_LINKS = [
  { to: "/products", icon: "🛍️", label: "Marketplace" },
  { to: "/notes", icon: "📄", label: "Notes" },
  { to: "/lost-found", icon: "🔍", label: "Lost & Found" },
  { to: "/feed", icon: "📢", label: "Campus Feed" },
  { to: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
];

export default function Home() {
  const user = authStore((s) => s.user);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([api.get("/products/trending"), api.get("/products/recent")])
      .then(([t, r]) => {
        setTrending(t.data.products || []);
        setRecent(r.data.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="page">
      {/* ── Logged-out hero ── */}
      {!user && (
        <section className="relative flex flex-col items-center justify-center text-center px-6 py-16 min-h-[60vh]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600 opacity-[0.06] rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 max-w-sm w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-gray-400 text-xs mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Student-only · Verified access
            </div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight mb-4">
              Your campus.<br />
              <span className="text-gray-500">One marketplace.</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Buy, sell, and share within your university.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/register" className="btn-primary w-full">Create free account →</Link>
              <Link to="/login" className="btn-ghost w-full">Sign in</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Logged-in greeting ── */}
      {user && (
        <div className="container-page">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="section-label">Good to see you</p>
              <h1 className="text-2xl font-bold mt-0.5">Hey, {user.name?.split(" ")[0]} 👋</h1>
            </div>
            <Link to="/create-product"
              className="flex items-center gap-1.5 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-2xl hover:bg-gray-100 transition active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              List
            </Link>
          </div>

          {/* Quick links grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {QUICK_LINKS.map(({ to, icon, label }) => (
              <Link key={to} to={to}
                className="card flex flex-col items-center justify-center gap-1.5 py-4 px-2 card-hover active:scale-95 transition-transform">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-400 font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>

          {/* Trending */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-label">This week</p>
                <h2 className="text-base font-bold mt-0.5">Trending on campus</h2>
              </div>
              <Link to="/products" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
              </div>
            ) : trending.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {trending.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-gray-500 text-sm">No trending items yet.</p>
              </div>
            )}
          </div>

          {/* Recently listed */}
          {recent.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="section-label">Fresh drops</p>
                  <h2 className="text-base font-bold mt-0.5">Recently listed</h2>
                </div>
                <Link to="/products" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {recent.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Features (logged out) ── */}
      {!user && (
        <section className="px-5 pb-10 border-t border-white/[0.05] pt-10">
          <div className="max-w-sm mx-auto">
            <p className="section-label text-center mb-1">Built for students</p>
            <h2 className="text-xl font-bold text-center mb-6">Everything you need</h2>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                  <span className="text-xl block mb-2">{f.icon}</span>
                  <h3 className="text-xs font-semibold mb-0.5">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
