import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const user = authStore((state) => state.user);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        if (!id || id === "undefined") throw new Error("Invalid Note ID");
        const { data } = await api.get(`/notes/${id}`);
        setNote(data.note);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load note");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this note?")) return;
    setDeleting(true);
    try {
      await api.delete(`/notes/${id}`);
      navigate("/notes");
    } catch {
      alert("Delete failed");
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center pt-14">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  if (error || !note) return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center gap-4 pt-14">
      <p className="text-5xl">😕</p>
      <h2 className="text-2xl font-bold">{error || "Note not found"}</h2>
      <Link to="/notes" className="text-gray-400 hover:text-white underline underline-offset-4 text-sm">← Back to Notes</Link>
    </div>
  );

  const isOwner = user?.id === note.seller?._id?.toString();

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">

        <Link to="/notes" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Notes
        </Link>

        <div className="card overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent" />

          <div className="p-8 md:p-12">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="tag">{note.subject}</span>
              <span className="px-3 py-1 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Semester {note.semester}
              </span>
              <span className="tag">{note.university}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{note.title}</h1>

            {/* Price */}
            <div className="mb-8">
              {note.price === 0 ? (
                <span className="text-3xl font-bold text-green-400">Free</span>
              ) : (
                <span className="text-3xl font-bold">₹{note.price}</span>
              )}
            </div>

            {/* Description */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6 mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Description</p>
              <p className="text-gray-300 leading-relaxed">{note.description}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Uploaded By</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {note.seller?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <p className="font-medium text-sm">{note.seller?.name}</p>
                </div>
              </div>
              <div className="card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">University</p>
                <p className="font-medium text-sm mt-1">{note.seller?.university}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Date Posted</p>
                <p className="font-medium text-sm mt-1">{new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isOwner ? (
                <>
                  <Link to={`/edit-note/${note._id}`} className="flex-1 btn-ghost py-3.5 rounded-xl text-center text-sm">
                    Edit Note
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-3.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Note"}
                  </button>
                </>
              ) : (
                <>
                  {note.fileURL && (
                    <a
                      href={note.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-primary py-3.5 rounded-xl text-center text-sm"
                    >
                      {note.price === 0 ? "Download Free →" : "Get Access →"}
                    </a>
                  )}
                  <a
                    href={`mailto:${note.seller?.email}?subject=Interested in your notes: ${note.title}`}
                    className="flex-1 btn-ghost py-3.5 rounded-xl text-center text-sm"
                  >
                    Contact Uploader
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
