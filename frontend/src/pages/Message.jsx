import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/messages/unread"),
      ]);
      setConversations(convRes.data.conversations || []);
      setUnreadTotal(unreadRes.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getOtherParticipant = (conv) => conv.participants?.[0];

  const filtered = searchQuery
    ? conversations.filter(c => getOtherParticipant(c)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col pt-14">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#080808] border-b border-white/[0.06] px-5 pt-6 pb-0">
        <div className="max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold">{user?.name?.split(" ")[0]}</h1>
              {unreadTotal > 0 && (
                <p className="text-gray-500 text-xs mt-0.5">{unreadTotal} unread message{unreadTotal !== 1 ? "s" : ""}</p>
              )}
            </div>
            <Link to="/create-product" className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-0">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition"
            />
          </div>

          {/* Messages heading */}
          <p className="text-sm font-semibold text-gray-300 mt-5 mb-0 pb-3 border-b border-white/[0.06]">
            {searchQuery ? `Results for "${searchQuery}"` : "Messages"}
          </p>
        </div>
      </div>

      {/* ── Conversations List ── */}
      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <svg className="w-9 h-9 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">
                {searchQuery ? "No results" : "Your messages"}
              </p>
              <p className="text-gray-500 text-sm max-w-xs">
                {searchQuery ? "Try a different name." : "Message a seller from any listing to start a conversation."}
              </p>
            </div>
            {!searchQuery && (
              <Link to="/products" className="btn-primary px-8 py-2.5 rounded-xl text-sm">
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = conv.unreadCount || 0;
              const isActive = false; // could track active conversations

              return (
                <button
                  key={conv._id}
                  onClick={() => navigate(`/messages/${conv._id}`)}
                  className="w-full flex items-center gap-3.5 py-3 px-2 rounded-2xl hover:bg-white/[0.04] transition text-left"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white ${unread > 0 ? "p-[2.5px] bg-gradient-to-tr from-violet-500 via-indigo-500 to-purple-600" : "bg-gradient-to-br from-violet-500/80 to-indigo-600/80"}`}>
                      {unread > 0 ? (
                        <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <span className="text-lg font-black">{other?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                        </div>
                      ) : (
                        <span>{other?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    {/* Online dot */}
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#080808]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${unread > 0 ? "font-bold text-white" : "font-medium text-gray-200"}`}>
                        {other?.name || "Unknown"}
                      </p>
                      <span className={`text-xs shrink-0 ${unread > 0 ? "text-white font-semibold" : "text-gray-600"}`}>
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${unread > 0 ? "text-white" : "text-gray-500"}`}>
                        {conv.lastMessagePreview || "Start a conversation"}
                      </p>
                      {unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                          <span className="text-black text-[10px] font-black">{unread > 9 ? "9+" : unread}</span>
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
