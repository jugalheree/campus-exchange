import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import QRModal from "../components/QRModal";
import SoldConfirmModal from "../components/SoldConfirmModal";
import { authStore } from "../store/authStore";

const ITEMS_PER_PAGE = 6;

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [productPage, setProductPage] = useState(1);
  const [notePage, setNotePage] = useState(1);

  const navigate = useNavigate();
  const user = authStore((s) => s.user);
  const [qrProduct, setQrProduct] = useState(null);
  const [soldProduct, setSoldProduct] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, noteRes, analyticsRes, offersRes] = await Promise.all([
          api.get("/products/my"),
          api.get("/notes/my"),
          api.get("/analytics/dashboard"),
          api.get("/offers/received"),
        ]);
        setProducts(prodRes.data.products || []);
        setNotes(noteRes.data.notes || []);
        setAnalytics(analyticsRes.data.analytics || null);
        setOffers(offersRes.data.offers || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); setProducts(p => p.filter(x => x._id !== id)); }
    catch { alert("Delete failed"); }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try { await api.delete(`/notes/${id}`); setNotes(n => n.filter(x => x._id !== id)); }
    catch { alert("Delete failed"); }
  };

  const handleToggleSold = (id) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    if (product.status === "available") {
      setSoldProduct(product);
    } else {
      api.patch(`/products/${id}/sold`)
        .then(res => setProducts(p => p.map(x => x._id === id ? res.data.product : x)))
        .catch(() => alert("Failed to update status"));
    }
  };

  const handleBoost = async (id) => {
    try {
      await api.patch(`/products/${id}/boost`);
      setProducts(p => p.map(x => x._id === id ? { ...x, boosted: true } : x));
    } catch { alert("Failed to boost"); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} listing${selected.size !== 1 ? "s" : ""}?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/products/${id}`)));
      setProducts(p => p.filter(x => !selected.has(x._id)));
      setSelected(new Set());
    } catch { alert("Some deletions failed"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkSold = async () => {
    if (!window.confirm(`Mark ${selected.size} listing${selected.size !== 1 ? "s" : ""} as sold?`)) return;
    setBulkLoading(true);
    try {
      const results = await Promise.all([...selected].map(id => api.patch(`/products/${id}/sold`)));
      const updated = Object.fromEntries(results.map(r => [r.data.product._id, r.data.product]));
      setProducts(p => p.map(x => updated[x._id] || x));
      setSelected(new Set());
    } catch { alert("Some updates failed"); }
    finally { setBulkLoading(false); }
  };

  if (loading) return (
    <div className="page flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  const paginatedProducts = products.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);
  const productPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedNotes = notes.slice((notePage - 1) * ITEMS_PER_PAGE, notePage * ITEMS_PER_PAGE);
  const notePages = Math.ceil(notes.length / ITEMS_PER_PAGE);

  const stats = [
    { label: "Views", value: analytics?.totalViews ?? 0, icon: "👁" },
    { label: "Saved", value: analytics?.totalWishlists ?? 0, icon: "♥" },
    { label: "Sold", value: analytics?.soldCount ?? 0, icon: "✓" },
    { label: "Active", value: analytics?.activeCount ?? 0, icon: "⚡" },
  ];

  return (
    <div className="page">
      {qrProduct && (
        <QRModal
          url={`${window.location.origin}/products/${qrProduct._id}`}
          title={qrProduct.title}
          onClose={() => setQrProduct(null)}
        />
      )}
      {soldProduct && (
        <SoldConfirmModal
          product={soldProduct}
          onClose={() => setSoldProduct(null)}
          onConfirm={(updated) => {
            setProducts(p => p.map(x => x._id === soldProduct._id ? (updated || { ...x, status: "sold" }) : x));
            setSoldProduct(null);
          }}
        />
      )}

      <div className="container-page">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="section-label">Dashboard</p>
            <h1 className="text-xl font-bold mt-0.5">{user?.name?.split(" ")[0]}'s listings</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/create-product" className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition">
              + Product
            </Link>
            <Link to="/create-note" className="btn-ghost px-3.5 py-2.5 text-xs min-h-0 rounded-xl">+ Note</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {stats.map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl py-3 px-2 text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pending offers alert */}
        {offers.length > 0 && (
          <Link to="/offers"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 mb-5 hover:bg-amber-500/12 transition">
            <div className="flex items-center gap-3">
              <span className="text-base">💰</span>
              <div>
                <p className="text-sm font-medium text-amber-300">{offers.length} pending offer{offers.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-gray-500">Tap to review</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 flex-1">
            {["products", "notes"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>
                {tab} <span className="opacity-50 text-xs ml-1">{tab === "products" ? products.length : notes.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk toolbar */}
        {activeTab === "products" && selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] mb-4 animate-fade-in">
            <span className="text-sm text-gray-300 flex-1">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-white px-2 py-1">Clear</button>
            <button onClick={handleBulkSold} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/10 transition disabled:opacity-50">Sold</button>
            <button onClick={handleBulkDelete} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500 hover:text-white transition disabled:opacity-50">Delete</button>
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          products.length === 0 ? (
            <EmptyState icon="📦" text="No products yet" action={{ label: "List your first item", to: "/create-product" }} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedProducts.map(product => (
                  <DashCard
                    key={product._id}
                    product={product}
                    onView={() => navigate(`/products/${product._id}`)}
                    onEdit={() => navigate(`/edit-product/${product._id}`)}
                    onToggleSold={() => handleToggleSold(product._id)}
                    onBoost={() => handleBoost(product._id)}
                    onDelete={() => handleDeleteProduct(product._id)}
                    onShare={() => setQrProduct(product)}
                    selected={selected.has(product._id)}
                    onToggleSelect={() => toggleSelect(product._id)}
                  />
                ))}
              </div>
              <Paginator page={productPage} pages={productPages} setPage={setProductPage} />
            </>
          )
        )}

        {/* Notes */}
        {activeTab === "notes" && (
          notes.length === 0 ? (
            <EmptyState icon="📝" text="No notes yet" action={{ label: "Upload your first note", to: "/create-note" }} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedNotes.map(note => (
                  <NoteDashCard key={note._id} note={note}
                    onView={() => navigate(`/notes/${note._id}`)}
                    onEdit={() => navigate(`/edit-note/${note._id}`)}
                    onDelete={() => handleDeleteNote(note._id)}
                  />
                ))}
              </div>
              <Paginator page={notePage} pages={notePages} setPage={setNotePage} />
            </>
          )
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function DashCard({ product, onView, onEdit, onToggleSold, onBoost, onDelete, onShare, selected, onToggleSelect }) {
  const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
  const imgSrc = product.images?.[0]
    ? product.images[0].startsWith("http") ? product.images[0] : `${BASE_URL}${product.images[0]}`
    : null;

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.12] transition">
      <div className="relative h-36 overflow-hidden bg-white/5">
        <button onClick={e => { e.stopPropagation(); onToggleSelect?.(); }}
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center border transition ${selected ? "bg-white border-white" : "border-white/40 bg-black/50"}`}>
          {selected && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </button>
        {imgSrc ? (
          <img src={imgSrc} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-3xl">📦</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex gap-1">
          {product.status === "sold" && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">SOLD</span>}
          {product.boosted && <span className="bg-amber-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-md">⚡</span>}
        </div>
        <div className="absolute bottom-2 left-2 text-white font-bold text-sm">₹{product.price?.toLocaleString()}</div>
        <div className="absolute bottom-2 right-2 text-white/50 text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          {product.views || 0}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-1 mb-3">{product.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onView} className="flex-1 min-w-0 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition">View</button>
          <button onClick={onEdit} className="flex-1 min-w-0 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:bg-white/5 transition">Edit</button>
          <button onClick={onToggleSold} title={product.status === "sold" ? "Re-list" : "Mark sold"}
            className={`py-1.5 px-2.5 rounded-lg border text-xs transition ${product.status === "sold" ? "border-green-500/20 text-green-400 hover:bg-green-500/10" : "border-white/[0.08] text-gray-500 hover:bg-white/5"}`}>
            {product.status === "sold" ? "↩" : "✓"}
          </button>
          {!product.boosted && (
            <button onClick={onBoost} title="Boost" className="py-1.5 px-2.5 rounded-lg border border-amber-500/20 text-amber-500 text-xs hover:bg-amber-500/10 transition">⚡</button>
          )}
          <button onClick={onShare} title="Share" className="py-1.5 px-2.5 rounded-lg border border-white/[0.08] text-gray-500 text-xs hover:bg-white/5 transition">⬡</button>
          <button onClick={onDelete} className="py-1.5 px-2.5 rounded-lg border border-red-500/[0.15] text-red-400 text-xs hover:bg-red-500 hover:text-white transition">✕</button>
        </div>
      </div>
    </div>
  );
}

function NoteDashCard({ note, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.12] transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">📄</div>
        <span className={`text-sm font-semibold shrink-0 ${note.price === 0 ? "text-green-400" : "text-white"}`}>
          {note.price === 0 ? "Free" : `₹${note.price}`}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium line-clamp-2 leading-snug">{note.title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{note.subject} · Sem {note.semester}</p>
      </div>
      <div className="flex gap-1.5 mt-auto">
        <button onClick={onView} className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition">View</button>
        <button onClick={onEdit} className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:bg-white/5 transition">Edit</button>
        <button onClick={onDelete} className="py-1.5 px-2.5 rounded-lg border border-red-500/[0.15] text-red-400 text-xs hover:bg-red-500 hover:text-white transition">✕</button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-14 text-center">
      <p className="text-3xl mb-3">{icon}</p>
      <p className="text-gray-400 text-sm mb-5">{text}</p>
      <Link to={action.to} className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex">{action.label}</Link>
    </div>
  );
}

function Paginator({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
        className="btn-ghost px-4 py-2 text-sm min-h-0 h-10 rounded-xl disabled:opacity-30">← Prev</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => setPage(p)}
          className={`w-10 h-10 rounded-xl text-sm transition ${page === p ? "bg-white text-black font-bold" : "border border-white/[0.08] text-gray-400 hover:border-white/20"}`}>{p}</button>
      ))}
      <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
        className="btn-ghost px-4 py-2 text-sm min-h-0 h-10 rounded-xl disabled:opacity-30">Next →</button>
    </div>
  );
}
