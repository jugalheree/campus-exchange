import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { authStore } from "../store/authStore";
import { connectSocket } from "../services/socket";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const navigate = useNavigate();
  const user = authStore(s => s.user);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);

    // Socket: update unread count in real time
    const userId = user?.id || user?._id;
    const socket = connectSocket(userId);
    socket.on("message:new", () => fetchConversations());

    return () => {
      clearInterval(interval);
      socket.off("message:new");
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/messages/unread"),
      ]);
      setConversations(convRes.data.conversations || []);
      setUnreadTotal(unreadRes.data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) { fetchConversations(); return; }
    try {
      const res = await api.get(`/messages/search?search=${query}`);
      setConversations(res.data.conversations || []);
    } catch {}
  };

  const formatTime = (date) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date);
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getOther = (conv) => conv.participants?.[0];
  const filtered = searchQuery
    ? conversations.filter(c => getOther(c)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <div className="page">
      {/* Sticky header */}
      <div className="sticky z-30 border-b"
        style={{ top: "var(--navbar-h)", background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-lg">{user?.name?.split(" ")[0]}'s Chats</h1>
              {unreadTotal > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "#666" }}>{unreadTotal} unread</p>
              )}
            </div>
            <Link to="/create-product"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0a0" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Sell
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#555" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search conversations..."
              value={searchQuery} onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
              style={{ background: "#111", border: "1.5px solid rgba(255,255,255,0.08)", color: "white" }}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto w-full px-3 py-2">
        {loading ? (
          <div className="space-y-1 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-full skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg className="w-8 h-8" style={{ color: "#444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold mb-1">{searchQuery ? "No results" : "No messages yet"}</p>
              <p className="text-sm" style={{ color: "#555" }}>
                {searchQuery ? "Try a different name" : "Message a seller from any listing"}
              </p>
            </div>
            {!searchQuery && (
              <Link to="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex">
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 mt-1">
            {filtered.map(conv => {
              const other = getOther(conv);
              const unread = conv.unreadCount || 0;
              return (
                <button key={conv._id} onClick={() => navigate(`/messages/${conv._id}`)}
                  className="w-full flex items-center gap-3 py-3 px-2 rounded-2xl text-left transition active:scale-[0.99]"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
                      style={{
                        background: unread > 0
                          ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                          : "linear-gradient(135deg, rgba(124,58,237,0.7), rgba(79,70,229,0.7))",
                        padding: unread > 0 ? 2 : 0,
                      }}>
                      {other?.avatar
                        ? <img src={other.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-base font-black">{other?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                      }
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm truncate" style={{ fontWeight: unread > 0 ? 700 : 500, color: unread > 0 ? "white" : "#d0d0d0" }}>
                        {other?.name || "Unknown"}
                      </p>
                      <span className="text-xs shrink-0" style={{ color: unread > 0 ? "white" : "#555", fontWeight: unread > 0 ? 600 : 400 }}>
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs truncate" style={{ color: unread > 0 ? "#a0a0a0" : "#555" }}>
                        {conv.lastMessagePreview || "Start a conversation"}
                      </p>
                      {unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                          <span style={{ fontSize: 9, color: "black", fontWeight: 900 }}>{unread > 9 ? "9+" : unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
