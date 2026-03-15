import { useEffect, useRef, useState } from "react";

// Minimal QR encoder using canvas — no library needed
// Uses a simple approach: encode URL as QR via Google Charts API (free, no key)
export default function QRModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=111111&color=ffffff&qzone=2`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copied: " + url);
    }
  };

  const handleDownloadQR = () => {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `campus-exchange-qr.png`;
    a.click();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl shadow-black/60">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Share Listing</p>
        <h3 className="text-base font-semibold mb-6 line-clamp-2">{title}</h3>

        {/* QR Code */}
        <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-5 inline-block mb-6">
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-44 h-44 rounded-lg"
            loading="lazy"
          />
        </div>

        <p className="text-gray-500 text-xs mb-6">Scan to open this listing on any device</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyLink}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${copied ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-white/10 text-gray-300 hover:bg-white/5"}`}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
