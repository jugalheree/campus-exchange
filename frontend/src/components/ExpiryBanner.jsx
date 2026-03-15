import { useState } from "react";
import api from "../services/api";

export default function ExpiryBanner({ product, isOwner, onRenewed }) {
  const [renewing, setRenewing] = useState(false);

  if (!product?.expiresAt) return null;

  const daysLeft = Math.ceil((new Date(product.expiresAt) - Date.now()) / 86400000);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  if (!isOwner || (!isExpiringSoon && !isExpired)) return null;

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await api.patch(`/products/${product._id}/renew`);
      onRenewed?.();
    } catch {
      alert("Failed to renew listing");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border mb-5 ${
      isExpired
        ? "bg-red-500/8 border-red-500/20"
        : "bg-amber-500/8 border-amber-500/20"
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{isExpired ? "⛔" : "⏰"}</span>
        <div>
          <p className={`text-sm font-medium ${isExpired ? "text-red-300" : "text-amber-300"}`}>
            {isExpired ? "Listing expired" : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </p>
          <p className="text-xs text-gray-500">
            {isExpired ? "Renew to make it visible again" : "Renew to keep it active for 30 more days"}
          </p>
        </div>
      </div>
      <button
        onClick={handleRenew}
        disabled={renewing}
        className="btn-primary px-4 py-2 rounded-xl text-xs shrink-0 disabled:opacity-60"
      >
        {renewing ? "Renewing..." : "Renew"}
      </button>
    </div>
  );
}
