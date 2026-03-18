import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SoldConfirmModal({ product, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleMarkSold = async () => {
    setSubmitting(true);
    try {
      const res = await api.patch(`/products/${product._id}/sold`);
      onConfirm?.(res.data.product);
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as sold. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bottom-sheet">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bottom-sheet-panel relative z-10 p-6 shadow-2xl shadow-black/60">

        {/* Handle */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1">Marked as sold!</h3>
            <p className="text-gray-400 text-sm mb-6">Your listing has been updated.</p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-6">
              {product.images?.[0] && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight line-clamp-2">{product.title}</h3>
                <p className="text-gray-400 text-sm mt-0.5">₹{product.price?.toLocaleString()}</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              This will mark the item as <span className="text-white font-medium">sold</span> and hide it from search results. You can re-list it anytime.
            </p>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleMarkSold}
                disabled={submitting}
                className="flex-1 min-h-[52px] rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Marking...
                  </>
                ) : "Mark as sold"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
