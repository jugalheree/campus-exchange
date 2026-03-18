import { Link, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function BottomNav({ unread = 0 }) {
  const location = useLocation();
  const user = authStore(s => s.user);

  const hide = ["/login", "/register"].includes(location.pathname);
  if (hide || !user) return null;

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const tabs = [
    {
      to: "/",
      label: "Home",
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: "/products",
      label: "Market",
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    { to: "/create-product", label: "", icon: () => null, isAdd: true },
    {
      to: "/messages",
      label: "Chats",
      badge: unread,
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 0 : 1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          if (tab.isAdd) {
            return (
              <Link key={tab.to} to={tab.to}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black shadow-lg shadow-white/10 hover:bg-gray-100 active:scale-95 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            );
          }

          const active = isActive(tab.to);
          return (
            <Link key={tab.to} to={tab.to}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 transition-all active:scale-90">
              <div className={`transition-colors ${active ? "text-white" : "text-gray-600"}`}>
                {tab.icon(active)}
              </div>
              {tab.badge > 0 && (
                <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
              {tab.label && (
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-white" : "text-gray-600"}`}>
                  {tab.label}
                </span>
              )}
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
