import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authStore } from "../store/authStore";
import api from "../services/api";
import { useState, useEffect } from "react";

export default function Navbar() {
  const user = authStore((s) => s.user);
  const logout = authStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const [m, o] = await Promise.all([
          api.get("/messages/unread"),
          api.get("/offers/received"),
        ]);
        setUnread(m.data.unreadCount || 0);
        setPendingOffers(o.data.offers?.length || 0);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = async () => {
    setSidebarOpen(false);
    try { await api.post("/auth/logout"); logout(); navigate("/"); } catch {}
  };

  const totalBadge = unread + pendingOffers;

  return (
    <>
      {/* ── Navbar ── */}
      {/*
        KEY FIX: padding-top uses env(safe-area-inset-top) so the navbar
        content always starts BELOW the Dynamic Island / notch on any iPhone.
        The nav height grows to fit — CSS var --navbar-h is updated to match.
      */}
      <nav
        className="fixed top-0 left-0 w-full z-50 bg-[#080808]/95 backdrop-blur-2xl border-b border-white/[0.06]"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="h-14 max-w-7xl mx-auto px-5 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-black text-[10px]">CE</span>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">Campus Exchange</span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center max-w-xs">
            <NavPill to="/products" active={isActive("/products")}>Marketplace</NavPill>
            {user && <NavPill to="/notes" active={isActive("/notes")}>Notes</NavPill>}
            {user && (
              <NavPill to="/messages" active={isActive("/messages")}>
                <span className="flex items-center gap-1.5">
                  Messages {unread > 0 && <Dot n={unread} />}
                </span>
              </NavPill>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            {user ? (
              <>
                <Link to="/create-product"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-100 transition">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                  List
                </Link>
                <NotificationBell />
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-white/5 transition relative"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    {totalBadge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#080808]" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block">{user.name?.split(" ")[0]}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-1.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition">
                  Sign up
                </Link>
              </>
            )}
            <button onClick={() => setSidebarOpen(v => !v)} className="md:hidden p-2 text-gray-400 hover:text-white transition ml-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      {/*
        Sidebar also needs safe-area padding so its header clears the notch,
        and its bottom clears the home indicator bar.
      */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 z-[70] bg-[#0d0d0d] border-l border-white/[0.07] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          {user ? (
            <Link to="/profile" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-gray-200 transition">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.university}</p>
              </div>
            </Link>
          ) : (
            <p className="text-sm font-semibold text-white">Menu</p>
          )}
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <SideItem to="/products" icon={<IconStore />} active={isActive("/products")}>Marketplace</SideItem>
          {user && <SideItem to="/notes" icon={<IconNote />} active={isActive("/notes")}>Notes</SideItem>}

          {user && (
            <>
              <div className="pt-3 pb-1 px-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Activity</p>
              </div>
              <SideItem to="/messages" icon={<IconMsg />} active={isActive("/messages")} badge={unread}>Messages</SideItem>
              <SideItem to="/offers" icon={<IconOffer />} active={isActive("/offers")} badge={pendingOffers}>Offers</SideItem>
              <SideItem to="/feed" icon={<IconFeed />} active={isActive("/feed")}>Campus Feed</SideItem>
              <SideItem to="/lost-found" icon={<IconSearch />} active={isActive("/lost-found")}>Lost & Found</SideItem>

              <div className="pt-3 pb-1 px-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">You</p>
              </div>
              <SideItem to="/dashboard" icon={<IconDash />} active={isActive("/dashboard")}>Dashboard</SideItem>
              <SideItem to="/profile" icon={<IconUser />} active={isActive("/profile")}>Profile</SideItem>
              <SideItem to="/wishlist" icon={<IconHeart />} active={isActive("/wishlist")}>Saved Items</SideItem>
              <SideItem to="/leaderboard" icon={<IconTrophy />} active={isActive("/leaderboard")}>Leaderboard</SideItem>

              <div className="pt-3 pb-1 px-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Create</p>
              </div>
              <SideItem to="/create-product" icon={<IconPlus />} active={isActive("/create-product")}>List a Product</SideItem>
              <SideItem to="/create-note" icon={<IconUpload />} active={isActive("/create-note")}>Upload Notes</SideItem>
            </>
          )}

          {!user && (
            <div className="pt-4 px-2 space-y-2">
              <Link to="/login" onClick={() => setSidebarOpen(false)}
                className="block w-full py-3 text-center rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition">
                Login
              </Link>
              <Link to="/register" onClick={() => setSidebarOpen(false)}
                className="block w-full py-3 text-center rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-0.5">
            <ThemeToggle />
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/5 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ── Sub-components ── */

function NavPill({ to, active, children }) {
  return (
    <Link to={to} className={`px-3.5 py-1.5 rounded-lg text-sm transition-all ${active ? "text-white bg-white/10" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
      {children}
    </Link>
  );
}

function Dot({ n }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-white text-black text-[9px] font-black">
      {n > 9 ? "9+" : n}
    </span>
  );
}

function SideItem({ to, icon, active, badge, children }) {
  return (
    <Link to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"}`}>
      <span className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-white" : "text-gray-600 group-hover:text-gray-300"}`}>
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      {badge > 0 && <Dot n={badge} />}
    </Link>
  );
}

const I = ({ d, ...p }) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const IconStore  = () => <I d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />;
const IconNote   = () => <I d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
const IconMsg    = () => <I d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
const IconOffer  = () => <I d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IconFeed   = () => <I d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />;
const IconDash   = () => <I d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />;
const IconUser   = () => <I d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const IconHeart  = () => <I d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
const IconTrophy = () => <I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />;
const IconPlus   = () => <I d="M12 4v16m8-8H4" strokeWidth={2.5} />;
const IconUpload = () => <I d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />;
const IconSearch = () => <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
