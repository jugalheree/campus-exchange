import { Link } from "react-router-dom";

const CONDITION_COLORS = {
  new: "text-green-400 bg-green-400/10 border-green-400/20",
  like_new: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  good: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  fair: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export default function ProductCard({ product }) {
  const conditionClass = CONDITION_COLORS[product.condition] || "text-gray-400 bg-white/5 border-white/10";

  return (
    <Link to={`/products/${product._id}`} className="group card card-hover flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative h-44 sm:h-52 overflow-hidden bg-white/5 flex-shrink-0">
        {product.images?.length > 0 ? (
          <img
            src={product.images[0].startsWith("http") ? product.images[0] : `http://localhost:5000${product.images[0]}`}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📦</div>
        )}

        {/* Sold overlay */}
        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-black px-4 py-1.5 rounded-lg rotate-[-8deg]">SOLD</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.boosted && (
            <span className="bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">⚡ Featured</span>
          )}
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white text-black text-sm font-bold px-3 py-1.5 rounded-lg">
            ₹{product.price?.toLocaleString()}
          </span>
        </div>

        {/* Category */}
        <div className="absolute top-3 right-3">
          <span className="tag text-xs">{product.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{product.title}</h3>
          {product.condition && (
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${conditionClass}`}>
              {product.condition.replace("_", " ")}
            </span>
          )}
        </div>

        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{product.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {product.avgRating > 0 && <span className="text-amber-400">★ {product.avgRating}</span>}
          {product.wishlistCount > 0 && <span>♥ {product.wishlistCount}</span>}
          {product.views > 0 && <span>👁 {product.views}</span>}
        </div>

        <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {product.seller?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-gray-500 text-xs">{product.seller?.name || "Unknown"}</span>
          </div>
          <span className="text-gray-600 text-xs">{product.university}</span>
        </div>
      </div>
    </Link>
  );
}
