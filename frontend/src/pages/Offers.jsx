import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  pending:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  accepted:  "text-green-400 bg-green-400/10 border-green-400/20",
  declined:  "text-red-400 bg-red-400/10 border-red-400/20",
  withdrawn: "text-gray-400 bg-white/5 border-white/10",
};

export default function Offers() {
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/offers/received"), api.get("/offers/sent")])
      .then(([r, s]) => { setReceived(r.data.offers || []); setSent(s.data.offers || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (offerId, status) => {
    setResponding(offerId);
    try {
      await api.put(`/offers/${offerId}/respond`, { status });
      setReceived(prev => prev.filter(o => o._id !== offerId));
    } catch { alert("Failed to respond"); }
    finally { setResponding(null); }
  };

  const handleWithdraw = async (offerId) => {
    if (!window.confirm("Withdraw this offer?")) return;
    try {
      await api.delete(`/offers/${offerId}`);
      setSent(prev => prev.map(o => o._id === offerId ? { ...o, status: "withdrawn" } : o));
    } catch { alert("Failed to withdraw"); }
  };

  const currentList = tab === "received" ? received : sent;

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Offers</h1>
          <p className="text-gray-500">Manage price negotiations with other students</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
          {["received", "sent"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>
              {t} {t === "received" ? `(${received.length})` : `(${sent.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-5xl mb-4">💰</p>
            <p className="text-gray-400">No {tab} offers yet.</p>
            {tab === "sent" && <Link to="/products" className="mt-4 inline-block text-sm text-gray-400 hover:text-white">Browse listings to make an offer</Link>}
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map(offer => (
              <div key={offer._id} className="card p-6">
                <div className="flex gap-4">
                  {/* Product image */}
                  {offer.product?.images?.[0] && (
                    <Link to={`/products/${offer.product._id}`}>
                      <img src={offer.product.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={`/products/${offer.product?._id}`} className="font-semibold hover:text-gray-300 transition line-clamp-1">
                        {offer.product?.title || "Product"}
                      </Link>
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[offer.status]}`}>
                        {offer.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className="text-gray-400">Listed: <span className="text-white font-medium">₹{offer.product?.price?.toLocaleString()}</span></span>
                      <span className="text-gray-600">→</span>
                      <span className="text-gray-400">Offer: <span className="text-amber-400 font-bold">₹{offer.offerPrice?.toLocaleString()}</span></span>
                    </div>

                    {offer.message && <p className="text-gray-500 text-sm italic mb-3">"{offer.message}"</p>}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-gray-600 text-xs">
                        {tab === "received" ? `From: ${offer.buyer?.name}` : `To: ${offer.seller?.name}`}
                        {" · "}{new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>

                      {/* Seller actions */}
                      {tab === "received" && offer.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleRespond(offer._id, "accepted")} disabled={responding === offer._id}
                            className="px-4 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500 hover:text-white transition disabled:opacity-50">
                            Accept
                          </button>
                          <button onClick={() => handleRespond(offer._id, "declined")} disabled={responding === offer._id}
                            className="px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500 hover:text-white transition disabled:opacity-50">
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Buyer withdraw */}
                      {tab === "sent" && offer.status === "pending" && (
                        <button onClick={() => handleWithdraw(offer._id)}
                          className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/5 transition">
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
