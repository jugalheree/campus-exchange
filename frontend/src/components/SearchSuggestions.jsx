import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SearchSuggestions({ value, onChange, onSubmit, placeholder = "Search..." }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!value || value.length < 2) { setSuggestions([]); setOpen(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/search?q=${encodeURIComponent(value)}&page=1`);
        const items = (res.data.products || []).slice(0, 6).map(p => ({
          id: p._id,
          title: p.title,
          price: p.price,
          category: p.category,
          image: p.images?.[0],
        }));
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleSelect = (item) => {
    setOpen(false);
    navigate(`/products/${item.id}`);
  };

  const highlight = (text) => {
    if (!value) return text;
    const idx = text.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-transparent text-white font-semibold">{text.slice(idx, idx + value.length)}</mark>
        {text.slice(idx + value.length)}
      </>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setOpen(false); onSubmit?.(e); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="input-base pl-11 pr-4"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin rounded-full border-t-2 border-t-white/40 border-r-2 border-r-transparent" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left border-b border-white/[0.04] last:border-0"
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">{highlight(item.title)}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.category}</p>
              </div>
              <p className="text-sm font-semibold text-white shrink-0">₹{item.price?.toLocaleString()}</p>
            </button>
          ))}
          <button
            onClick={() => { setOpen(false); onSubmit?.({ preventDefault: () => {} }); }}
            className="w-full text-center py-3 text-xs text-gray-500 hover:text-white hover:bg-white/5 transition"
          >
            See all results for "{value}" →
          </button>
        </div>
      )}
    </div>
  );
}
