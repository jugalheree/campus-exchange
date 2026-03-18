import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function ChatDetail() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const user = authStore((s) => s.user);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  };

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await api.get(`/messages/${conversationId}?page=1&limit=100`);
      const incoming = res.data.messages || [];
      setMessages(prev => {
        if (JSON.stringify(prev.map(m => m._id)) === JSON.stringify(incoming.map(m => m._id))) return prev;
        return incoming;
      });
      if (res.data.conversation?.participants) {
        const other = res.data.conversation.participants.find(
          p => p._id !== user._id && p._id !== user.id
        );
        if (other) setOtherUser(other);
      }
    } catch (err) {
      if (err.response?.status === 404) navigate("/messages");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId, user, navigate]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(() => fetchMessages(true), 2500);
    return () => clearInterval(intervalRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !otherUser) return;
    const text = messageText.trim();
    setMessageText("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      _id: tempId, _temp: true,
      sender: { _id: user.id || user._id, name: user.name },
      content: text, createdAt: new Date().toISOString(), isRead: false,
    }]);
    scrollToBottom();

    try {
      await api.post("/messages", { recipientId: otherUser._id, content: text });
      await fetchMessages(true);
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageText(text);
      alert(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setMessages(prev => prev.filter(m => m._id !== msgId));
    try { await api.delete(`/messages/${msgId}`); }
    catch { fetchMessages(true); }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm("Delete this entire conversation? This cannot be undone.")) return;
    setDeletingChat(true);
    try {
      // Delete all messages in conversation
      await Promise.all(messages.map(m => api.delete(`/messages/${m._id}`).catch(() => {})));
      navigate("/messages");
    } catch {
      alert("Failed to delete conversation");
      setDeletingChat(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDateLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const grouped = [];
  let lastDate = null, lastSenderId = null;
  messages.forEach((msg, i) => {
    const dateLabel = formatDateLabel(msg.createdAt);
    if (dateLabel !== lastDate) {
      grouped.push({ type: "date", label: dateLabel });
      lastDate = dateLabel; lastSenderId = null;
    }
    const senderId = msg.sender?._id || msg.sender?.id;
    const isSameAsPrev = senderId === lastSenderId;
    const nextMsg = messages[i + 1];
    const nextSenderId = nextMsg?.sender?._id || nextMsg?.sender?.id;
    const nextDate = nextMsg ? formatDateLabel(nextMsg.createdAt) : null;
    const isLast = !nextMsg || nextDate !== dateLabel || nextSenderId !== senderId;
    grouped.push({ type: "message", data: msg, isSameAsPrev, isLast });
    lastSenderId = senderId;
  });

  const myId = user?.id || user?._id;

  // FIX: chat layout accounts for both top navbar AND bottom nav bar
  const bottomNavH = "calc(60px + env(safe-area-inset-bottom))";
  const topNavH = "calc(56px + env(safe-area-inset-top))";

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  return (
    <div
      className="flex flex-col bg-[#080808] text-white"
      style={{ height: "100vh", paddingTop: topNavH, paddingBottom: bottomNavH }}
    >
      {/* Chat header */}
      <div className="shrink-0 bg-[#0d0d0d] border-b border-white/[0.07] px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {otherUser ? (
          <Link to={`/seller/${otherUser._id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                {otherUser.avatar
                  ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-white">{otherUser.name?.charAt(0)?.toUpperCase()}</span>
                }
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0d0d0d]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{otherUser.name}</p>
              <p className="text-gray-500 text-xs truncate">🎓 {otherUser.university}</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1 h-8 bg-white/5 rounded-xl animate-pulse" />
        )}

        {/* Kebab menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-50 w-48 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                {otherUser && (
                  <Link to={`/seller/${otherUser._id}`} onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    View profile
                  </Link>
                )}
                <button
                  onClick={() => { setShowMenu(false); handleDeleteConversation(); }}
                  disabled={deletingChat}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete conversation
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 && otherUser && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
              {otherUser.avatar
                ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-white">{otherUser.name?.charAt(0)?.toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="font-bold text-base">{otherUser.name}</p>
              <p className="text-gray-500 text-sm">🎓 {otherUser.university}</p>
            </div>
            <p className="text-gray-600 text-sm">Say hi to start the conversation 👋</p>
          </div>
        )}

        <div className="max-w-lg mx-auto w-full space-y-0.5">
          {grouped.map((item, i) => {
            if (item.type === "date") return (
              <div key={`date-${i}`} className="flex items-center gap-3 py-4">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span className="text-gray-600 text-xs px-2">{item.label}</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
            );

            const msg = item.data;
            const isOwn = msg.sender?._id === myId || msg.sender?.id === myId;
            const isTemp = msg._temp;

            return (
              <div key={msg._id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${item.isSameAsPrev ? "mt-0.5" : "mt-3"}`}>

                {!isOwn && (
                  <div className="w-7 h-7 shrink-0 mb-0.5">
                    {item.isLast ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                        {otherUser?.avatar
                          ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                          : otherUser?.name?.charAt(0)?.toUpperCase()
                        }
                      </div>
                    ) : <div className="w-7 h-7" />}
                  </div>
                )}

                <div className={`group flex flex-col gap-0.5 max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}>
                  <div className={`
                    px-3.5 py-2.5 text-sm leading-relaxed break-words
                    ${isOwn
                      ? "bg-white text-black rounded-[20px] rounded-br-[6px]"
                      : "bg-[#1e1e1e] border border-white/[0.08] text-gray-100 rounded-[20px] rounded-bl-[6px]"
                    }
                    ${isTemp ? "opacity-60" : ""}
                  `}>
                    {msg.content}
                  </div>

                  {item.isLast && (
                    <div className={`flex items-center gap-2 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                      {isOwn && !isTemp && (
                        <>
                          <span className={`text-[10px] ${msg.isRead ? "text-indigo-400" : "text-gray-600"}`}>
                            {msg.isRead ? "✓✓" : "✓"}
                          </span>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition"
                          >
                            delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar — sits above bottom nav due to paddingBottom on parent */}
      <div className="shrink-0 bg-[#0d0d0d] border-t border-white/[0.07] px-3 py-3">
        <form onSubmit={handleSend} className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : user?.name?.charAt(0)?.toUpperCase()
            }
          </div>

          <div className="flex-1 flex items-center bg-[#1a1a1a] border border-white/[0.09] rounded-full px-4 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.name?.split(" ")[0] || ""}...`}
              maxLength={2000}
              disabled={sending || !otherUser}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 py-2.5 focus:outline-none"
            />
            {messageText && (
              <button type="button" onClick={() => setMessageText("")}
                className="text-gray-600 hover:text-gray-400 text-xs shrink-0">✕</button>
            )}
          </div>

          <button
            type="submit"
            disabled={sending || !messageText.trim() || !otherUser}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
              messageText.trim() && otherUser
                ? "bg-white text-black hover:bg-gray-100 active:scale-95"
                : "bg-white/10 text-gray-600 cursor-not-allowed"
            }`}
          >
            {sending
              ? <div className="w-4 h-4 animate-spin rounded-full border-t-2 border-t-current border-r-2 border-r-transparent" />
              : <svg className="w-4 h-4 -rotate-45 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
