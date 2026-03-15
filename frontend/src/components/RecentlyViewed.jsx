/* Persists to localStorage — no backend needed */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const KEY = "ce_recently_viewed";
const MAX = 8;

export function trackView(product) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
    const filtered = stored.filter(p => p._id !== product._id);
    const updated = [
      { _id: product._id, title: product.title, price: product.price, image: product.images?.[0], category: product.category },
      ...filtered
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed({ excludeId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      setItems(stored.filter(p => p._id !== excludeId).slice(0, 6));
    } catch {}
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Recently Viewed</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {items.map(item => (
          <Link key={item._id} to={`/products/${item._id}`}
            className="group flex flex-col gap-1.5">
            <div className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
              {item.image
                ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
              }
            </div>
            <p className="text-[10px] text-gray-500 line-clamp-1 group-hover:text-gray-300 transition">{item.title}</p>
            <p className="text-[11px] font-semibold text-white">₹{item.price?.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
