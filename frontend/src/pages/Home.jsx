import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authStore } from "../store/authStore";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const FEATURES = [
  { icon: "🎓", title: "University-only", desc: "Verified students only. No outsiders." },
  { icon: "⚡", title: "List in 60s", desc: "Books, notes, gear — up instantly." },
  { icon: "💬", title: "Direct chat", desc: "Negotiate directly, no middlemen." },
  { icon: "📚", title: "Study notes", desc: "Semester notes, past papers, guides." },
  { icon: "💰", title: "Make offers", desc: "Negotiate any price with one tap." },
  { icon: "🔔", title: "Smart alerts", desc: "Price drops, offers, messages." },
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
      .then(([t, r]) => { setTrending(t.data.products || []); setRecent(r.data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="bg-[#080808] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-5 pt-14">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-violet-600 opacity-[0.06] rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-gray-400 text-xs mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Student-only · Verified university access
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-5">
            Your campus.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
              One marketplace.
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto">
            Buy, sell, and share within your university. Books, notes, equipment — from students who get it.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto">
            <Link to="/products" className="btn-primary px-6 py-3.5 rounded-xl w-full sm:w-auto">
              Browse Marketplace →
            </Link>
            {!user && (
              <Link to="/register" className="btn-ghost px-6 py-3.5 rounded-xl w-full sm:w-auto">
                Sign up free
              </Link>
            )}
            {user && (
              <Link to="/feed" className="btn-ghost px-6 py-3.5 rounded-xl w-full sm:w-auto">
                Campus Feed
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── TRENDING ── */}
      {user && (
        <section className="py-12 px-5 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">This week</p>
                <h2 className="text-lg font-bold">Trending on campus</h2>
              </div>
              <Link to="/feed" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
              </div>
            ) : trending.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trending.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-500 text-sm">No trending items yet — be the first to list!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── RECENTLY LISTED ── */}
      {user && recent.length > 0 && (
        <section className="py-12 px-5 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Fresh drops</p>
                <h2 className="text-lg font-bold">Recently listed</h2>
              </div>
              <Link to="/products" className="text-xs text-gray-500 hover:text-white transition">See all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recent.slice(0, 3).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section className="py-16 px-5 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Built for students</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
                <span className="text-xl block mb-2">{f.icon}</span>
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-5 border-t border-white/[0.05]">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to join?</h2>
          <p className="text-gray-500 text-sm mb-6">Your campus is already here.</p>
          <Link to={user ? "/products" : "/register"} className="btn-primary w-full py-4 rounded-xl text-base block">
            {user ? "Go to Marketplace →" : "Create free account →"}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-black text-[9px]">CE</span>
            </div>
            <span className="text-white text-sm font-semibold">Campus Exchange</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-600">
            <Link to="/products" className="hover:text-gray-400 transition">Marketplace</Link>
            <Link to="/notes" className="hover:text-gray-400 transition">Notes</Link>
            <Link to="/feed" className="hover:text-gray-400 transition">Feed</Link>
            <Link to="/leaderboard" className="hover:text-gray-400 transition">Leaderboard</Link>
          </div>
          <p className="text-gray-700 text-xs">© {new Date().getFullYear()} Campus Exchange.</p>
        </div>
      </footer>
    </div>
  );
}
