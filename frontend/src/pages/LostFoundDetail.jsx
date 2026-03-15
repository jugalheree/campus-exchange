import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function LostFoundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authStore(s => s.user);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get(`/lost-found/${id}`)
      .then(r => setPost(r.data.post))
      .catch(() => navigate("/lost-found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleResolve = async () => {
    if (!window.confirm("Mark this item as resolved/found?")) return;
    setResolving(true);
    try {
      await api.patch(`/lost-found/${id}/resolve`);
      setPost(p => ({ ...p, status: "resolved" }));
    } catch { alert("Failed to update"); }
    finally { setResolving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/lost-found/${id}`);
      navigate("/lost-found");
    } catch { alert("Failed to delete"); }
  };

  const handleMessage = async () => {
    try {
      const res = await api.post("/messages/conversation/start", { recipientId: post.postedBy?._id });
      navigate(`/messages/${res.data.conversationId}`);
    } catch { navigate("/messages"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center pt-14">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );
  if (!post) return null;

  const isOwner = user?.id === post.postedBy?._id?.toString() || user?._id === post.postedBy?._id?.toString();
  const isLost = post.type === "lost";

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-6 pb-24">

        <Link to="/lost-found" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Lost & Found
        </Link>

        <div className="card overflow-hidden">
          {/* Images */}
          {post.images?.length > 0 && (
            <div>
              <div className="h-52 overflow-hidden">
                <img src={post.images[activeImg]} alt={post.title} className="w-full h-full object-cover" />
              </div>
              {post.images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {post.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${activeImg === i ? "border-white" : "border-transparent opacity-50"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-5">
            {/* Type badge + status */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isLost ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-green-500/15 text-green-400 border border-green-500/20"}`}>
                {isLost ? "🔍 Lost" : "📦 Found"}
              </span>
              <span className="tag">{post.category}</span>
              {post.status === "resolved" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">✓ Resolved</span>
              )}
            </div>

            <h1 className="text-xl font-bold mb-3">{post.title}</h1>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">{post.description}</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📍 Location</p>
                <p className="text-sm font-medium">{post.location}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📅 Date</p>
                <p className="text-sm font-medium">
                  {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">👤 Posted by</p>
                <p className="text-sm font-medium">{post.postedBy?.name}</p>
              </div>
              {post.contact && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📞 Contact</p>
                  <p className="text-sm font-medium font-mono">{post.contact}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="flex flex-col gap-2">
                {post.status === "open" && (
                  <button onClick={handleResolve} disabled={resolving}
                    className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-60">
                    {resolving ? "Updating..." : `✓ Mark as ${isLost ? "Found" : "Returned"}`}
                  </button>
                )}
                <button onClick={handleDelete}
                  className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500 hover:text-white transition">
                  Delete Post
                </button>
              </div>
            ) : (
              post.status === "open" && (
                <button onClick={handleMessage} className="btn-primary w-full py-3.5 rounded-xl text-sm">
                  {isLost ? "I Think I've Seen It →" : "This Is Mine →"}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
