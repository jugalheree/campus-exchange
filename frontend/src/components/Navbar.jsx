import { Link, useLocation, useNavigate } from "react-router-dom";
import { authStore } from "../store/authStore";
import api from "../services/api";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";

// Page titles for mobile header
const PAGE_TITLES = {
  "/": "Campus Exchange",
  "/products": "Marketplace",
  "/notes": "Notes",
  "/messages": "Messages",
  "/profile": "Profile",
  "/dashboard": "Dashboard",
  "/wishlist": "Saved",
  "/offers": "Offers",
  "/feed": "Campus Feed",
  "/lost-found": "Lost & Found",
  "/leaderboard": "Leaderboard",
  "/create-product": "New Listing",
  "/create-note": "Upload Notes",
  "/login": "Sign In",
  "/register": "Create Account",
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/products/")) return "Product";
  if (pathname.startsWith("/notes/")) return "Note";
  if (pathname.startsWith("/messages/")) return "Chat";
  if (pathname.startsWith("/edit-product/")) return "Edit Listing";
  if (pathname.startsWith("/edit-note/")) return "Edit Note";
  if (pathname.startsWith("/seller/")) return "Seller";
  if (pathname.startsWith("/lost-found/")) return "Lost & Found";
  return "Campus Exchange";
}

export default function Navbar() {
  const user = authStore((s) => s.user);
  const logout = authStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const isDetailPage = location.pathname !== "/" &&
    !["products","notes","messages","profile","dashboard","feed","leaderboard","lost-found","wishlist","offers"].some(
      p => location.pathname === `/${p}`
    );

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await api.get("/messages/unread");
        setUnread(res.data.unreadCount || 0);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    navigate("/");
  };

  const title = getTitle(location.pathname);

  // Hide navbar on auth pages — they have their own headers
  const hideOn = ["/login", "/register"];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/95 backdrop-blur-2xl border-b border-white/[0.06]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="h-14 flex items-center justify-between px-4 gap-3">

        {/* Left: back arrow on detail pages, logo on root */}
        <div className="w-10 flex items-center">
          {isDetailPage ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <Link to="/" className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
              <span className="text-black font-black text-[10px]">CE</span>
            </Link>
          )}
        </div>

        {/* Center: page title */}
        <h1 className="flex-1 text-center text-sm font-semibold text-white truncate">
          {title}
        </h1>

        {/* Right: context actions */}
        <div className="w-10 flex items-center justify-end gap-1">
          {user ? (
            <NotificationBell />
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
