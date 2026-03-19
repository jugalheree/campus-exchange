import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";
import { connectSocket, joinConversation, leaveConversation, emitTypingStart, emitTypingStop } from "../services/socket";

export default function ChatDetail() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const user = authStore(s => s.user);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
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
    // Fallback polling in case socket fails
    intervalRef.current = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchMessages]);

  // Socket.io
  useEffect(() => {
    const userId = user?.id || user?._id;
    const socket = connectSocket(userId);
    joinConversation(conversationId);

    socket.on("message:new", ({ message }) => {
      if (message.conversationId?.toString() !== conversationId?.toString()) return;
      setMessages(prev => {
        if (prev.find(m => m._id === message._id)) return prev;
        const tempIdx = prev.findIndex(m => m._temp && m.content === message.content);
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = message;
          return next;
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    socket.on("typing:start", ({ userId: tid }) => {
      if (tid === otherUser?._id) setIsTyping(true);
    });
    socket.on("typing:stop", ({ userId: tid }) => {
      if (tid === otherUser?._id) setIsTyping(false);
    });

    return () => {
      leaveConversation(conversationId);
      socket.off("message:new");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [conversationId, user, otherUser]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom(false);
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !otherUser) return;
    const text = messageText.trim();
    setMessageText("");
    setSending(true);
    const userId = user?.id || user?._id;
    emitTypingStop(conversationId, userId);
    clearTimeout(typingTimeoutRef.current);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      _id: tempId, _temp: true,
      sender: { _id: userId, name: user.name, avatar: user.avatar },
      content: text, createdAt: new Date().toISOString(), isRead: false,
    }]);
    scrollToBottom();

    try {
      await api.post("/messages", { recipientId: otherUser._id, content: text });
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    const userId = user?.id || user?._id;
    emitTypingStart(conversationId, userId, user.name);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTypingStop(conversationId, userId), 1500);
  };

  const handleDelete = async (msgId) => {
    setMessages(prev => prev.filter(m => m._id !== msgId));
    try { await api.delete(`/messages/${msgId}`); }
    catch { fetchMessages(true); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const fmt = (date) => new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const dateLabel = (date) => {
    const d = new Date(date), now = new Date();
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === yest.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const grouped = [];
  let lastDate = null, lastSender = null;
  messages.forEach((msg, i) => {
    const dl = dateLabel(msg.createdAt);
    if (dl !== lastDate) { grouped.push({ type: "date", label: dl }); lastDate = dl; lastSender = null; }
    const sid = msg.sender?._id || msg.sender?.id;
    const next = messages[i + 1];
    const nextSid = next?.sender?._id || next?.sender?.id;
    const nextDl = next ? dateLabel(next.createdAt) : null;
    const isLast = !next || nextDl !== dl || nextSid !== sid;
    grouped.push({ type: "msg", data: msg, same: sid === lastSender, isLast });
    lastSender = sid;
  });

  const myId = user?.id || user?._id;

  if (loading) return (
    <div className="fixed inset-0 bg-[#000] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  const sab = "env(safe-area-inset-bottom, 0px)";
  const sat = "env(safe-area-inset-top, 0px)";

  return (
    <div className="fixed inset-0 bg-[#000] text-white flex flex-col"
      style={{ paddingTop: `calc(0px + ${sat})` }}>

      {/* ── Header — replaces top navbar entirely on this page ── */}
      <div className="shrink-0 flex items-center gap-3 px-3 border-b border-white/[0.08]"
        style={{ height: 56, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}>

        {/* Back */}
        <button onClick={() => navigate("/messages")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User info */}
        {otherUser ? (
          <Link to={`/seller/${otherUser._id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                {otherUser.avatar
                  ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-white">{otherUser.name?.charAt(0)?.toUpperCase()}</span>
                }
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight truncate">{otherUser.name}</p>
              <p className="text-xs truncate" style={{ color: isTyping ? "#4ade80" : "#666" }}>
                {isTyping ? "typing..." : otherUser.university}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 12px" }}>
        {messages.length === 0 && otherUser && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              {otherUser.avatar
                ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-white">{otherUser.name?.charAt(0)?.toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="font-bold">{otherUser.name}</p>
              <p className="text-sm" style={{ color: "#666" }}>🎓 {otherUser.university}</p>
            </div>
            <p className="text-sm" style={{ color: "#444" }}>Say hi 👋</p>
          </div>
        )}

        <div className="max-w-lg mx-auto space-y-0.5">
          {grouped.map((item, i) => {
            if (item.type === "date") return (
              <div key={`d-${i}`} className="flex items-center gap-3 py-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-xs px-2" style={{ color: "#555" }}>{item.label}</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            );

            const msg = item.data;
            const isOwn = msg.sender?._id === myId || msg.sender?.id === myId;
            const isTemp = msg._temp;

            return (
              <div key={msg._id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${item.same ? "mt-0.5" : "mt-3"}`}>

                {!isOwn && (
                  <div className="w-6 h-6 shrink-0 mb-0.5">
                    {item.isLast ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                        {otherUser?.avatar
                          ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                          : otherUser?.name?.charAt(0)?.toUpperCase()
                        }
                      </div>
                    ) : <div className="w-6 h-6" />}
                  </div>
                )}

                <div className={`group flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  <div style={{
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    opacity: isTemp ? 0.6 : 1,
                    background: isOwn ? "#ffffff" : "#1a1a1a",
                    color: isOwn ? "#000" : "#e8e8e8",
                    borderRadius: isOwn ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                    border: isOwn ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                    {msg.content}
                  </div>

                  {item.isLast && (
                    <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <span style={{ fontSize: 10, color: "#555" }}>{fmt(msg.createdAt)}</span>
                      {isOwn && !isTemp && (
                        <>
                          <span style={{ fontSize: 10, color: msg.isRead ? "#818cf8" : "#555" }}>
                            {msg.isRead ? "✓✓" : "✓"}
                          </span>
                          <button onClick={() => handleDelete(msg._id)}
                            className="opacity-0 group-hover:opacity-100 transition"
                            style={{ fontSize: 10, color: "#ef4444" }}>
                            del
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing bubble */}
          {isTyping && (
            <div className="flex items-end gap-2 mt-3">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {otherUser?.avatar
                  ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  : otherUser?.name?.charAt(0)?.toUpperCase()
                }
              </div>
              <div style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 20px 4px", padding: "12px 16px", display: "flex", gap: 4 }}>
                {[0, 150, 300].map(d => (
                  <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#666", animation: "bounce 1s ease infinite", animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar — sits above bottom nav ── */}
      <div className="shrink-0 border-t px-3 py-2"
        style={{
          background: "rgba(0,0,0,0.95)",
          borderColor: "rgba(255,255,255,0.08)",
          paddingBottom: `calc(8px + ${sab})`,
          backdropFilter: "blur(20px)",
        }}>
        <form onSubmit={handleSend} className="max-w-lg mx-auto flex items-center gap-2">
          {/* My avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : user?.name?.charAt(0)?.toUpperCase()
            }
          </div>

          {/* Input */}
          <div className="flex-1 flex items-center rounded-full px-4 gap-2"
            style={{ background: "#111", border: "1.5px solid rgba(255,255,255,0.1)", minHeight: 44 }}>
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.name?.split(" ")[0] || ""}...`}
              maxLength={2000}
              disabled={sending || !otherUser}
              style={{ flex: 1, background: "transparent", color: "white", fontSize: 14, outline: "none", border: "none" }}
              className="placeholder-gray-600 py-2"
            />
            {messageText && (
              <button type="button" onClick={() => setMessageText("")}
                style={{ color: "#555", fontSize: 12 }}>✕</button>
            )}
          </div>

          {/* Send button */}
          <button type="submit"
            disabled={sending || !messageText.trim() || !otherUser}
            style={{
              width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: messageText.trim() && otherUser ? "white" : "rgba(255,255,255,0.08)",
              color: messageText.trim() && otherUser ? "black" : "#555",
              transition: "all 0.15s",
              cursor: messageText.trim() && otherUser ? "pointer" : "not-allowed",
            }}>
            {sending
              ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              : <svg style={{ width: 16, height: 16, transform: "rotate(-45deg) translateX(1px)" }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
            }
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
