import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem("pwa-dismissed")) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 30 seconds of use
      setTimeout(() => setShow(true), 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setShow(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
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
          <button onClick={handleDismiss} className="text-xs text-gray-500 hover:text-white px-2 py-1.5 transition">
            Later
          </button>
          <button onClick={handleInstall} className="btn-primary px-4 py-1.5 rounded-xl text-xs">
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
