import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { authStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import SearchSuggestions from "../components/SearchSuggestions";

const CATEGORIES = ["Notes", "Books", "Calculators", "Electronics", "Lab Equipment", "Other"];
const CAT_ICONS = { Notes: "📝", Books: "📚", Calculators: "🧮", Electronics: "💻", "Lab Equipment": "🔬", Other: "📦" };
const CONDITIONS = [{ value: "new", label: "New" }, { value: "like_new", label: "Like New" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({ q: "", category: "", condition: "", minPrice: "", maxPrice: "", sortBy: "newest" });

  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/products/search?${params.toString()}`);
      setProducts(res.data.products || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchProducts(page); else setLoading(false); }, [user, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProducts(1); };
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => { setFilters({ q: "", category: "", condition: "", minPrice: "", maxPrice: "", sortBy: "newest" }); setPage(1); };
  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice;

  return (
    <div className="relative min-h-screen bg-[#080808] text-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-600 opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className={`relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 transition-all duration-500 ${!user ? "blur-md pointer-events-none select-none" : ""}`}>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Marketplace</h1>
              <p className="text-gray-500 mt-2">Discover items from your campus community</p>
            </div>
            <Link to="/create-product" className="btn-primary px-6 py-3 rounded-xl text-sm">+ List Item</Link>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <div className="flex-1 relative">
              <SearchSuggestions
                value={filters.q}
                onChange={(v) => setFilter("q", v)}
                onSubmit={handleSearch}
                placeholder="Search products..."
              />
            </div>
            <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)} className="input-base w-full sm:w-auto sm:min-w-40 cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="popular">Most Wishlisted</option>
              <option value="rating">Highest Rated</option>
            </select>
            <button type="button" onClick={() => setShowFilters(v => !v)}
              className={`btn-ghost px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${hasActiveFilters ? "border-violet-500/50 text-violet-400" : ""}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
            </button>
            <button type="submit" className="btn-primary px-4 py-3 rounded-xl text-sm">Search</button>
          </form>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="card p-6 mb-4 grid sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Condition</label>
                <select value={filters.condition} onChange={(e) => setFilter("condition", e.target.value)} className="input-base cursor-pointer">
                  <option value="">Any condition</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Min Price (₹)</label>
                <input type="number" placeholder="0" value={filters.minPrice} min="0"
                  onChange={(e) => setFilter("minPrice", e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Max Price (₹)</label>
                <input type="number" placeholder="Any" value={filters.maxPrice} min="0"
                  onChange={(e) => setFilter("maxPrice", e.target.value)} className="input-base" />
              </div>
              <div className="flex items-end">
                <button onClick={() => { clearFilters(); setShowFilters(false); fetchProducts(1); }}
                  className="btn-ghost w-full py-3 rounded-xl text-sm text-red-400 border-red-500/20 hover:bg-red-500/10">
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFilter("category", ""); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${!filters.category ? "bg-white text-black font-medium" : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setFilter("category", cat); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 ${filters.category === cat ? "bg-white text-black font-medium" : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                {CAT_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {!loading && user && <p className="text-gray-600 text-sm mb-6">{total} listing{total !== 1 ? "s" : ""} found</p>}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-400 text-lg">No products found.</p>
            <p className="text-gray-600 text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-16">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30">← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm transition-all ${page === p ? "bg-white text-black font-bold" : "border border-white/10 text-gray-400 hover:border-white/20"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>

      {!user && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="card p-12 max-w-md w-full">
            <div className="text-5xl mb-6">🏪</div>
            <h2 className="text-3xl font-bold mb-4">Members Only</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">This marketplace is exclusive to verified campus students.</p>
            <button onClick={() => navigate("/login")} className="btn-primary w-full py-3.5 rounded-xl">Sign in to continue</button>
            <p className="mt-4 text-gray-600 text-xs">New? <Link to="/register" className="text-gray-400 hover:text-white">Create an account</Link></p>
          </div>
        </div>
      )}
    </div>
  );
}
