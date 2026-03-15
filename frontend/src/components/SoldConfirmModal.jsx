import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SoldConfirmModal({ product, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1=confirm, 2=review prompt
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleMarkSold = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/products/${product._id}/sold`);
      onConfirm?.();
      setStep(2);
    } catch {
      alert("Failed to mark as sold");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => onClose();

  if (step === 2) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-black/60">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">🎉</p>
          <h3 className="text-lg font-bold">Item marked as sold!</h3>
          <p className="text-gray-400 text-sm mt-2">Would you like to leave a review for the buyer?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Skip</button>
          <button onClick={() => { navigate(`/products/${product._id}`); onClose(); }} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
            View Listing
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-black/60">
        <h3 className="text-lg font-bold mb-2">Mark as sold?</h3>
        <p className="text-gray-400 text-sm mb-6">
          <span className="text-white font-medium">"{product.title}"</span> will be marked as sold and hidden from search results.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleMarkSold} disabled={submitting} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-60">
            {submitting ? "Marking..." : "Mark Sold"}
          </button>
        </div>
      </div>
    </div>
  );
}
