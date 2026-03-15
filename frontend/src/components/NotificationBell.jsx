import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      try {
        await api.put("/notifications/read-all");
        setNotifications(n => n.map(x => ({ ...x, read: true })));
        setUnread(0);
      } catch {}
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(n => n.filter(x => x._id !== id));
    } catch {}
  };

  const TYPE_ICON = {
    offer_received: "💰",
    offer_accepted: "✅",
    offer_declined: "❌",
    price_drop: "📉",
    new_message: "💬",
    listing_expiring: "⏰",
  };

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date);
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    await Promise.all(notifications.map(n => api.delete(`/notifications/${n._id}`)));
                    setNotifications([]);
                  } catch {}
                }}
                className="text-xs text-gray-500 hover:text-white transition"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-500 text-sm">You're all caught up</p>
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n._id}
                  to={n.link || "#"}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3.5 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0 group ${!n.read ? "bg-white/[0.02]" : ""}`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "text-white font-medium" : "text-gray-300"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(n._id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-white transition text-xs mt-0.5"
                  >
                    ✕
                  </button>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
