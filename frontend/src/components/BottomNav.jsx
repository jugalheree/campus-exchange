import { Link, useLocation } from "react-router-dom";
import { authStore } from "../store/authStore";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Home",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5h-4.5V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Market",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
  {
    to: "/create-product",
    label: "",
    isCreate: true,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-black">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: "/messages",
    label: "Chats",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BottomNav({ unread = 0 }) {
  const location = useLocation();
  const user = authStore((s) => s.user);

  // Hide on auth pages
  const hideOn = ["/login", "/register"];
  if (hideOn.includes(location.pathname)) return null;

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 h-[60px]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);

          if (item.isCreate) {
            return (
              <Link
                key={item.to}
                to={user ? item.to : "/login"}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-lg shadow-white/10 active:scale-95 transition-transform"
              >
                {item.icon()}
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-full px-2"
            >
              <span className={`transition-all ${active ? "text-white" : "text-gray-600"}`}>
                {item.icon(active)}
              </span>
              {item.label && (
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-white" : "text-gray-600"}`}>
                  {item.label}
                </span>
              )}
              {/* Unread badge on messages */}
              {item.to === "/messages" && unread > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
