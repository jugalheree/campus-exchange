/* Sparkline price history chart — no external lib, pure SVG */
import { useEffect, useState } from "react";
import api from "../services/api";

export default function PriceChart({ productId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/price-history/${productId}`)
      .then(r => setHistory(r.data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />;
  if (history.length < 2) return null;

  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 320, H = 72, PAD = 8;

  const points = history.map((h, i) => {
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - h.price) / range) * (H - PAD * 2);
    return [x, y];
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`;

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const drop = firstPrice - lastPrice;
  const dropPct = ((drop / firstPrice) * 100).toFixed(0);
  const dropped = drop > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Price History</p>
        {dropped && (
          <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
            ↓ {dropPct}% since listed
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dropped ? "#4ade80" : "#818cf8"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={dropped ? "#4ade80" : "#818cf8"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#pg)" />
        <path d={pathD} fill="none" stroke={dropped ? "#4ade80" : "#818cf8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots at start and end */}
        <circle cx={points[0][0]} cy={points[0][1]} r="3" fill="#555" />
        <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="4" fill={dropped ? "#4ade80" : "#818cf8"} />
      </svg>

      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Listed at ₹{firstPrice?.toLocaleString()}</span>
        <span className={`font-medium ${dropped ? "text-green-400" : "text-gray-400"}`}>
          Now ₹{lastPrice?.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
