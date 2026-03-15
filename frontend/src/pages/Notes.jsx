import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Electronics", "Civil", "Mechanical", "Economics", "Management"];

function NoteCard({ note }) {
  const isNew = (Date.now() - new Date(note.createdAt)) < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link to={`/notes/${note._id}`}
      className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200 flex flex-col gap-4">

      <div className="flex items-start justify-between gap-2">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shrink-0">
          📄
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-sm font-bold ${note.price === 0 ? "text-green-400" : "text-white"}`}>
            {note.price === 0 ? "Free" : `₹${note.price}`}
          </span>
          {isNew && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-medium">New</span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-sm font-semibold mb-1.5 line-clamp-2 leading-snug group-hover:text-white transition">{note.title}</h2>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{note.description}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-gray-400">{note.subject}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Sem {note.semester}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
            {note.seller?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-[10px] text-gray-600">{note.seller?.name?.split(" ")[0]}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject: "", semester: "", search: "", priceType: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState("grid"); // "grid" | "list"

  const user = authStore((state) => state.user);
  const navigate = useNavigate();

  const fetchNotes = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.semester) params.append("semester", filters.semester);
      if (filters.search) params.append("search", filters.search);
      const res = await api.get(`/notes?${params.toString()}`);
      let data = res.data.notes || [];
      if (filters.priceType === "free") data = data.filter(n => n.price === 0);
      if (filters.priceType === "paid") data = data.filter(n => n.price > 0);
      setNotes(data);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setNotes([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) fetchNotes(page);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchNotes(1); };
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const hasFilters = filters.subject || filters.semester || filters.search || filters.priceType;

  // Semester stats
  const semesterCounts = Array.from({ length: 8 }, (_, i) => ({
    sem: i + 1,
    count: notes.filter(n => n.semester === i + 1).length,
  }));

  return (
    <div className="relative min-h-screen bg-[#080808] text-white pt-14">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600 opacity-[0.025] rounded-full blur-[100px] pointer-events-none" />

      <div className={`relative z-10 max-w-7xl mx-auto px-5 py-8 pb-24 ${!user ? "blur-md pointer-events-none select-none" : ""}`}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Study Notes</h1>
            <p className="text-gray-500 text-sm">Semester material shared by students in your university</p>
          </div>
          <Link to="/create-note" className="btn-primary px-5 py-2.5 rounded-xl text-sm">+ Upload Notes</Link>
        </div>

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by title or subject..." value={filters.search}
              onChange={e => setFilter("search", e.target.value)} className="input-base pl-11" />
          </div>
          <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm">Search</button>
          {/* View toggle */}
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 shrink-0">
            <button type="button" onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition ${view === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/></svg>
            </button>
            <button type="button" onClick={() => setView("list")}
              className={`p-2 rounded-lg transition ${view === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </form>

        {/* ── Filter row ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {/* Price type */}
          {["", "free", "paid"].map(pt => (
            <button key={pt} onClick={() => { setFilter("priceType", pt); setPage(1); fetchNotes(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border ${filters.priceType === pt ? "bg-white text-black border-white font-medium" : "border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white"}`}>
              {pt === "" ? "All" : pt === "free" ? "Free" : "Paid"}
            </button>
          ))}

          <div className="w-px bg-white/[0.06] mx-1" />

          {/* Semester pills */}
          <button onClick={() => { setFilter("semester", ""); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border ${!filters.semester ? "bg-white text-black border-white font-medium" : "border-white/[0.08] text-gray-400 hover:border-white/20"}`}>
            All Sems
          </button>
          {[1,2,3,4,5,6,7,8].map(s => (
            <button key={s} onClick={() => { setFilter("semester", s.toString()); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border ${filters.semester === s.toString() ? "bg-white text-black border-white font-medium" : "border-white/[0.08] text-gray-400 hover:border-white/20"}`}>
              Sem {s}
            </button>
          ))}

          {hasFilters && (
            <button onClick={() => { setFilters({ subject: "", semester: "", search: "", priceType: "" }); setPage(1); fetchNotes(1); }}
              className="px-3.5 py-1.5 rounded-xl text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 transition ml-1">
              Clear
            </button>
          )}
        </div>

        {/* ── Subject quick-filter ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 border-b border-white/[0.05] sm:flex-wrap sm:overflow-x-visible" style={{ scrollbarWidth: "none" }}>
          <span className="text-xs text-gray-600 py-1.5 pr-1">Subject:</span>
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => { setFilter("subject", filters.subject === s ? "" : s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition border ${filters.subject === s ? "border-indigo-500/40 text-indigo-400 bg-indigo-500/10" : "border-white/[0.06] text-gray-600 hover:text-gray-300 hover:border-white/15"}`}>
              {s}
            </button>
          ))}
        </div>

        {!loading && user && (
          <p className="text-gray-600 text-xs mb-6">{total} note{total !== 1 ? "s" : ""} found</p>
        )}

        {/* ── Grid or List ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-400 mb-2">No notes found</p>
            <p className="text-gray-600 text-sm mb-6">Try different filters or be the first to contribute!</p>
            <Link to="/create-note" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">Upload Notes</Link>
          </div>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map(n => <NoteCard key={n._id} note={n} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map(n => (
              <Link key={n._id} to={`/notes/${n._id}`}
                className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:border-white/[0.14] transition group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-white transition">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.subject} · Sem {n.semester} · by {n.seller?.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tag text-xs">{n.price === 0 ? "Free" : `₹${n.price}`}</span>
                  {(Date.now() - new Date(n.createdAt)) < 3 * 24 * 60 * 60 * 1000 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">New</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30">← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm transition-all ${page === p ? "bg-white text-black font-bold" : "border border-white/[0.08] text-gray-400 hover:border-white/20"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>

      {/* ── Soft lock ── */}
      {!user && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-12 max-w-sm w-full">
            <div className="text-5xl mb-5">📚</div>
            <h2 className="text-2xl font-bold mb-3">Members Only</h2>
            <p className="text-gray-400 text-sm mb-8">Login to access notes shared by students in your campus.</p>
            <button onClick={() => navigate("/login")} className="btn-primary w-full py-3.5 rounded-xl">Sign in to continue</button>
          </div>
        </div>
      )}
    </div>
  );
}
