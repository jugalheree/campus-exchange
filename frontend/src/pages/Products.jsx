import { useEffect, useState } from "react";
import api from "../services/api";
import { MARKETPLACE_CATEGORIES, CONDITIONS } from "../config/categories";
import ProductCard from "../components/ProductCard";
import { authStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import SearchSuggestions from "../components/SearchSuggestions";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ q: "", category: "", condition: "", minPrice: "", maxPrice: "", sortBy: "newest" });

  const navigate = useNavigate();
  const user = authStore((s) => s.user);

  // FIX: fetch products regardless of auth — let backend decide visibility
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

  useEffect(() => { fetchProducts(page); }, [page]);
  const handleSearch = (e) => { e?.preventDefault(); setPage(1); fetchProducts(1); };
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => { setFilters({ q: "", category: "", condition: "", minPrice: "", maxPrice: "", sortBy: "newest" }); setPage(1); };
  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice;

  return (
    <div className="page">
      <div className="container-page">

        {/* Search bar */}
        <div className="mb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <SearchSuggestions
                value={filters.q}
                onChange={(v) => setFilter("q", v)}
                onSubmit={handleSearch}
                placeholder="Search listings..."
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center justify-center w-[52px] h-[52px] rounded-2xl border transition shrink-0 ${
                hasActiveFilters
                  ? "border-violet-500/50 text-violet-400 bg-violet-500/10"
                  : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-4 space-y-3 animate-fade-up">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label block mb-1.5">Sort by</label>
                <select value={filters.sortBy} onChange={e => setFilter("sortBy", e.target.value)} className="input-base text-sm py-2.5 min-h-0 h-11">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="popular">Popular</option>
                  <option value="rating">Top rated</option>
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Condition</label>
                <select value={filters.condition} onChange={e => setFilter("condition", e.target.value)} className="input-base text-sm py-2.5 min-h-0 h-11">
                  <option value="">Any</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Min price (₹)</label>
                <input type="number" placeholder="0" value={filters.minPrice} min="0"
                  onChange={e => setFilter("minPrice", e.target.value)} className="input-base text-sm py-2.5 min-h-0 h-11" />
              </div>
              <div>
                <label className="section-label block mb-1.5">Max price (₹)</label>
                <input type="number" placeholder="Any" value={filters.maxPrice} min="0"
                  onChange={e => setFilter("maxPrice", e.target.value)} className="input-base text-sm py-2.5 min-h-0 h-11" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSearch} className="btn-primary flex-1 py-2.5 min-h-0 h-11 text-sm rounded-xl">
                Apply
              </button>
              {hasActiveFilters && (
                <button onClick={() => { clearFilters(); setShowFilters(false); fetchProducts(1); }}
                  className="btn-ghost flex-1 py-2.5 min-h-0 h-11 text-sm rounded-xl text-red-400 border-red-500/20">
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category pills - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none -mx-4 px-4">
          <button
            onClick={() => { setFilter("category", ""); setPage(1); fetchProducts(1); }}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 transition-all ${
              !filters.category ? "bg-white text-black font-semibold" : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            All
          </button>
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => { setFilter("category", cat.value); setPage(1); fetchProducts(1); }}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                filters.category === cat.value ? "bg-white text-black font-semibold" : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-gray-600 text-xs mb-3">{total} listing{total !== 1 ? "s" : ""} found</p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center mt-4">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-gray-400 text-sm">No products found.</p>
            <p className="text-gray-600 text-xs mt-1">Try adjusting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-ghost px-4 py-2.5 text-sm min-h-0 h-11 rounded-xl disabled:opacity-30">← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-11 h-11 rounded-xl text-sm transition-all ${page === p ? "bg-white text-black font-bold" : "border border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-ghost px-4 py-2.5 text-sm min-h-0 h-11 rounded-xl disabled:opacity-30">Next →</button>
          </div>
        )}

        {/* Login prompt for guests (non-blocking) */}
        {!user && products.length > 0 && (
          <div className="card p-5 mt-6 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Sign in to buy & sell</p>
              <p className="text-gray-500 text-xs mt-0.5">Join your campus marketplace</p>
            </div>
            <Link to="/login" className="btn-primary px-4 py-2.5 text-sm min-h-0 h-11 rounded-xl shrink-0">Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
