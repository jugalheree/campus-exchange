import { useState, useEffect } from "react";

// Detect if already installed as PWA
const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Detect iOS (Safari doesn't fire beforeinstallprompt — needs manual instructions)
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Offline/online banner
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);

    // Already installed or dismissed → skip
    if (isInStandaloneMode() || localStorage.getItem("pwa-dismissed")) {
      return () => {
        window.removeEventListener("offline", goOffline);
        window.removeEventListener("online",  goOnline);
      };
    }

    // iOS: show manual guide after 30 seconds
    if (isIOS()) {
      const t = setTimeout(() => setShowIOSGuide(true), 30000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("offline", goOffline);
        window.removeEventListener("online",  goOnline);
      };
    }

    // Android / Chrome: capture the native install prompt
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setShow(true), 30000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-dismissed", "1");
  };

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") localStorage.setItem("pwa-dismissed", "1");
    setShow(false);
    setPrompt(null);
  };

  return (
    <>
      {/* ── Offline banner ── */}
      {isOffline && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-yellow-500/90 backdrop-blur-sm text-black text-xs font-medium text-center py-2 px-4">
          You're offline — some features may be unavailable
        </div>
      )}

      {/* ── Android install prompt ── */}
      {show && prompt && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm animate-fade-up">
          <div className="bg-[#111] border border-white/[0.1] rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <span className="text-black font-black text-xs">CE</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Add to Home Screen</p>
              <p className="text-xs text-gray-400 mt-0.5">Get the full app experience</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={dismiss} className="text-xs text-gray-500 hover:text-white px-2 py-1.5 transition">
                Later
              </button>
              <button onClick={handleInstall} className="btn-primary px-4 py-1.5 rounded-xl text-xs">
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS manual guide ── */}
      {showIOSGuide && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm">
          <div className="bg-[#111] border border-white/[0.1] rounded-2xl px-5 py-4 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <span className="text-black font-black text-xs">CE</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Add to Home Screen</p>
                  <p className="text-xs text-gray-400">Install Campus Exchange</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-gray-500 hover:text-white text-lg leading-none mt-1">×</button>
            </div>
            <ol className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] shrink-0">1</span>
                Tap the <strong className="text-white">Share</strong> button at the bottom of Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] shrink-0">2</span>
                Scroll down and tap <strong className="text-white">Add to Home Screen</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] shrink-0">3</span>
                Tap <strong className="text-white">Add</strong> — done!
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
