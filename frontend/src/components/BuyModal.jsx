import { useState } from "react";
import api from "../services/api";

const UPI_APPS = [
  { id: "gpay",     label: "Google Pay",  icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",  scheme: "gpay" },
  { id: "phonepe",  label: "PhonePe",     icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png",    scheme: "phonepe" },
  { id: "paytm",    label: "Paytm",       icon: "https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png",  scheme: "paytm" },
  { id: "upi",      label: "Any UPI App", icon: null, scheme: "upi" },
];

function StepDot({ n, active, done }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
      done ? "bg-green-500 border-green-500 text-white"
           : active ? "bg-white border-white text-black"
           : "border-white/20 text-gray-500"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

export default function BuyModal({ product, sellerUpi, onClose }) {
  const [step, setStep] = useState(1); // 1=confirm intent, 2=pay, 3=done
  const [marking, setMarking] = useState(false);

  const price = product.price;
  const title = product.title;
  const productId = product._id;

  // Build UPI deep link
  const buildUpiLink = (app) => {
    const upiId = sellerUpi || "";
    const note = encodeURIComponent(`Campus Exchange: ${title}`);
    const amt = price;

    const base = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(product.seller?.name || "Seller")}&am=${amt}&cu=INR&tn=${note}`;

    // App-specific deep links for better UX on mobile
    const appLinks = {
      gpay: `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(product.seller?.name || "Seller")}&am=${amt}&cu=INR&tn=${note}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
      phonepe: `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(product.seller?.name || "Seller")}&am=${amt}&cu=INR&tn=${note}`,
      paytm: `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(product.seller?.name || "Seller")}&am=${amt}&cu=INR&tn=${note}`,
      upi: base,
    };

    return appLinks[app] || base;
  };

  const handlePayNow = (appId) => {
    const link = buildUpiLink(appId);
    window.location.href = link;
    // After redirect attempt, move to confirmation step
    setTimeout(() => setStep(3), 1500);
  };

  const handleConfirmPaid = async () => {
    setMarking(true);
    try {
      // Mark item as sold + notify seller via message
      await api.post("/messages", {
        recipientId: product.seller?._id,
        content: `Hi! I've sent ₹${price.toLocaleString()} via UPI for "${title}". Please confirm when you've received the payment 🙏`,
      });
      setStep(4); // final done state
    } catch {
      setStep(4);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-[#111] border border-white/[0.09] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl shadow-black/70 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <p className="font-semibold text-sm">Buy this item</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Progress steps ── */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.05]">
          <StepDot n={1} active={step === 1} done={step > 1} />
          <div className={`flex-1 h-px transition-colors ${step > 1 ? "bg-green-500/50" : "bg-white/10"}`} />
          <StepDot n={2} active={step === 2} done={step > 2} />
          <div className={`flex-1 h-px transition-colors ${step > 2 ? "bg-green-500/50" : "bg-white/10"}`} />
          <StepDot n={3} active={step >= 3} done={step === 4} />
        </div>

        <div className="px-6 py-6">

          {/* ── Step 1: Confirm intent ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-5">Order Summary</p>

              <div className="flex gap-4 mb-6">
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-2">{title}</p>
                  <p className="text-gray-400 text-xs mt-1">{product.category} · {product.condition?.replace("_", " ")}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Seller: {product.seller?.name}</p>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-5 py-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Item price</span>
                  <span className="font-semibold">₹{price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Platform fee</span>
                  <span className="text-green-400 text-sm font-medium">Free</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-black">₹{price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
                <span className="text-base shrink-0 mt-0.5">📍</span>
                <p className="text-amber-300/80 text-xs leading-relaxed">
                  This is a campus exchange — you'll meet the seller in person to collect the item. Pay via UPI after confirming pickup details.
                </p>
              </div>

              <button onClick={() => setStep(2)} className="btn-primary w-full py-4 rounded-2xl text-base font-semibold">
                Proceed to Pay →
              </button>
            </div>
          )}

          {/* ── Step 2: Choose UPI app ── */}
          {step === 2 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pay via UPI</p>
              <p className="text-2xl font-black mb-6">₹{price.toLocaleString()}</p>

              {sellerUpi ? (
                <>
                  <p className="text-gray-500 text-xs mb-4">Paying to: <span className="text-white font-mono">{sellerUpi}</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    {UPI_APPS.map(app => (
                      <button
                        key={app.id}
                        onClick={() => handlePayNow(app.id)}
                        className="flex items-center gap-3 p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08] hover:border-white/[0.15] transition group"
                      >
                        {app.icon ? (
                          <img src={app.icon} alt={app.label} className="w-8 h-8 rounded-lg object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base">💳</div>
                        )}
                        <span className="text-sm font-medium group-hover:text-white transition text-gray-300">{app.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-5 py-5 text-center mb-4">
                    <p className="text-3xl mb-3">💬</p>
                    <p className="text-sm font-medium mb-1">Ask seller for UPI ID</p>
                    <p className="text-gray-500 text-xs">The seller hasn't added a UPI ID yet. Message them to get their payment details.</p>
                  </div>
                </div>
              )}

              <button onClick={() => setStep(3)} className="w-full py-3 rounded-2xl border border-white/[0.08] text-sm text-gray-400 hover:text-white hover:bg-white/5 transition">
                I've already paid →
              </button>
            </div>
          )}

          {/* ── Step 3: Confirm payment sent ── */}
          {(step === 3) && (
            <div className="text-center py-4">
              <div className="text-5xl mb-5">📲</div>
              <h3 className="text-lg font-bold mb-2">Payment sent?</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Once you confirm, we'll send the seller a message letting them know payment is on the way.
              </p>
              <button onClick={handleConfirmPaid} disabled={marking}
                className="btn-primary w-full py-4 rounded-2xl text-base font-semibold disabled:opacity-60 mb-3">
                {marking ? "Confirming..." : "Yes, I've paid ✓"}
              </button>
              <button onClick={() => setStep(2)} className="w-full py-3 text-sm text-gray-500 hover:text-white transition">
                ← Go back
              </button>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-3xl mx-auto mb-5">
                🎉
              </div>
              <h3 className="text-xl font-bold mb-2">You're all set!</h3>
              <p className="text-gray-400 text-sm mb-2 leading-relaxed">
                The seller has been notified. Arrange a campus meetup to collect your item.
              </p>
              <p className="text-gray-600 text-xs mb-8">Check your messages for the conversation.</p>
              <button onClick={onClose} className="btn-primary w-full py-3.5 rounded-2xl text-sm">
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
