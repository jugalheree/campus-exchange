import { Link } from "react-router-dom";

const CONDITION_COLORS = {
  new: "text-green-400 bg-green-400/10 border-green-400/20",
  like_new: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  good: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  fair: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

function getImageSrc(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${BASE_URL}${img}`;
}

export default function ProductCard({ product }) {
  const conditionClass = CONDITION_COLORS[product.condition] || "text-gray-400 bg-white/5 border-white/10";
  const imgSrc = getImageSrc(product.images?.[0]);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-[#111] border border-white/[0.07] hover:border-white/[0.14] hover:bg-[#161616] transition-all duration-200 active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5 shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-3xl">📦</div>
        )}

        {/* Sold overlay */}
        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-lg rotate-[-8deg] shadow-lg">SOLD</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {product.boosted && (
            <span className="bg-amber-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-md">⚡ Featured</span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          {product.listingType === "free" && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/90 text-white">FREE</span>
          )}
          {product.listingType === "rent" && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/90 text-white">RENT</span>
          )}
        </div>

        {/* Price pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="bg-white text-black text-sm font-bold px-2.5 py-1 rounded-lg shadow-md">
            ₹{product.price?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{product.title}</h3>
          {product.condition && (
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${conditionClass}`}>
              {product.condition.replace("_", " ")}
            </span>
          )}
        </div>

        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{product.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {product.avgRating > 0 && <span className="text-amber-400">★ {product.avgRating}</span>}
          {product.wishlistCount > 0 && <span>♥ {product.wishlistCount}</span>}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {product.seller?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-gray-500 text-xs truncate">{product.seller?.name?.split(" ")[0] || "Unknown"}</span>
          </div>
          <span className="text-gray-700 text-[10px] shrink-0 truncate max-w-[80px]">{product.university}</span>
        </div>
      </div>
    </Link>
  );
}
