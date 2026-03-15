/* Compact seller credibility widget — shown on ProductDetails next to seller name */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ScoreRing({ score }) {
  const r = 18, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <svg width="44" height="44" className="rotate-[-90deg]">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

export default function SellerBadge({ sellerId, sellerName }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!sellerId) return;
    api.get(`/sellers/${sellerId}/stats`)
      .then(r => setStats(r.data.stats))
      .catch(() => {});
  }, [sellerId]);

  if (!stats) return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
        {sellerName?.charAt(0)?.toUpperCase()}
      </div>
      <Link to={`/seller/${sellerId}`} className="font-medium text-sm text-indigo-400 hover:underline">
        {sellerName}
      </Link>
    </div>
  );

  const { user, avgRating, totalReviews, soldListings, sellerScore } = stats;
  const badge = sellerScore >= 70 ? { label: "Top Seller", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" }
    : sellerScore >= 40 ? { label: "Active Seller", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" }
    : null;

  return (
    <Link to={`/seller/${sellerId}`} className="block card p-4 hover:border-white/15 transition group">
      <div className="flex items-center gap-3">
        {/* Score ring + avatar */}
        <div className="relative shrink-0">
          <ScoreRing score={sellerScore} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {sellerName?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm group-hover:text-white transition">{user.name}</p>
            {user.verified && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-400 font-medium">✓ Verified</span>
            )}
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge.color}`}>{badge.label}</span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">🎓 {user.university}</p>
        </div>

        {/* Score number */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold">{sellerScore}</p>
          <p className="text-[10px] text-gray-600">score</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-white/[0.05] text-center">
        <div className="flex-1">
          <p className="text-sm font-semibold">{soldListings}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Sold</p>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{avgRating > 0 ? `★ ${avgRating}` : "—"}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{stats.followers}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Followers</p>
        </div>
      </div>
    </Link>
  );
}
