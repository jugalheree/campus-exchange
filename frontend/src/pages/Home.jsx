import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authStore } from "../store/authStore";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const QUICK_LINKS = [
  { icon: "🏷️", label: "Sell", to: "/create-product", color: "from-violet-500/20 to-violet-500/5" },
  { icon: "📚", label: "Notes", to: "/notes", color: "from-indigo-500/20 to-indigo-500/5" },
  { icon: "🔍", label: "Lost & Found", to: "/lost-found", color: "from-amber-500/20 to-amber-500/5" },
  { icon: "🏆", label: "Top Sellers", to: "/leaderboard", color: "from-green-500/20 to-green-500/5" },
];

export default function Home() {
  const user = authStore((s) => s.user);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([api.get("/products/trending"), api.get("/products/recent")])
      .then(([t, r]) => { setTrending(t.data.products || []); setRecent(r.data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  /* ── Logged-in home ── */
  if (user) return (
    <div className="page">
      <div className="container-page space-y-8">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">{greeting}</p>
            <h1 className="text-xl font-bold mt-0.5">{user.name?.split(" ")[0]} 👋</h1>
          </div>
          <Link to="/profile"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden hover:ring-2 hover:ring-white/20 transition">
            {user.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : user.name?.charAt(0)?.toUpperCase()
            }
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_LINKS.map(l => (
            <Link key={l.label} to={l.to}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-b ${l.color} border border-white/[0.07] hover:border-white/[0.14] transition active:scale-95`}>
              <span className="text-2xl">{l.icon}</span>
              <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Search bar */}
        <Link to="/products"
          className="flex items-center gap-3 w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 hover:border-white/[0.16] hover:bg-white/[0.07] transition">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-gray-500 text-sm">Search marketplace...</span>
        </Link>

        {/* Trending */}
        {loading ? (
          <div>
            <div className="skeleton h-5 w-32 mb-4 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
            </div>
          </div>
        ) : trending.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label">Trending</p>
                <h2 className="text-base font-bold mt-0.5">🔥 Hot right now</h2>
              </div>
              <Link to="/products" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {trending.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* Recent */}
        {!loading && recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label">Just listed</p>
                <h2 className="text-base font-bold mt-0.5">🆕 New arrivals</h2>
              </div>
              <Link to="/products" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recent.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  /* ── Landing (not logged in) ── */
  return (
    <div className="bg-[#080808] text-white overflow-x-hidden">

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-5 pt-16">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600 opacity-[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500 opacity-[0.04] rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-gray-400 text-xs mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Student-only · Verified university access
          </div>

          <h1 className="text-5xl sm:text-6xl font-black leading-[0.92] tracking-tight mb-5 animate-fade-up">
            Your campus.<br />
            <span className="text-gray-500">One marketplace.</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-sm mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Buy, sell, and share within your university. Books, notes, gear — from students who get it.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/register" className="btn-primary px-8 py-4 rounded-2xl text-base">
              Get started free →
            </Link>
            <Link to="/products" className="btn-ghost px-8 py-4 rounded-2xl text-base">
              Browse listings
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <p className="section-label text-center mb-3">Built for students</p>
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: "🎓", title: "University-only", desc: "Verified students only. No outsiders." },
              { icon: "⚡", title: "List in 60s", desc: "Books, notes, gear — up instantly." },
              { icon: "💬", title: "Direct chat", desc: "Negotiate directly, no middlemen." },
              { icon: "📚", title: "Study notes", desc: "Semester notes, past papers, guides." },
              { icon: "💰", title: "Make offers", desc: "Negotiate any price with one tap." },
              { icon: "🔍", title: "Lost & Found", desc: "Campus-wide lost & found board." },
            ].map(f => (
              <div key={f.title} className="card p-5 hover:border-white/14 transition">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <p className="font-semibold text-sm mb-1">{f.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center border-t border-white/[0.05]">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-gray-500 mb-8">Join your campus marketplace. It's free, always.</p>
          <div className="flex justify-center gap-3">
            <Link to="/register" className="btn-primary px-8 py-4 rounded-2xl">Sign up free →</Link>
            <Link to="/login" className="btn-ghost px-8 py-4 rounded-2xl">Login</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
