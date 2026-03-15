import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { authStore } from "../store/authStore";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authStore(s => s.user);

  useEffect(() => {
    api.get("/sellers/leaderboard")
      .then(r => setBoard(r.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myRank = board.findIndex(s => s._id === (user?.id || user?._id));

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-14">
      <div className="max-w-xl mx-auto px-4 sm:px-5 py-6 pb-24">

        <div className="mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Campus Leaderboard</h1>
          <p className="text-gray-500 text-sm">Top sellers at {user?.university}</p>
        </div>

        {myRank >= 0 && (
          <div className="card px-5 py-4 mb-6 flex items-center gap-3 border-violet-500/20 bg-violet-500/5">
            <span className="text-2xl">{myRank < 3 ? MEDALS[myRank] : `#${myRank + 1}`}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Your ranking</p>
              <p className="text-gray-500 text-xs">Score: {board[myRank]?.sellerScore}</p>
            </div>
            <Link to="/profile" className="text-xs text-violet-400 hover:underline">View profile →</Link>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-t-white border-r-2 border-r-transparent" />
          </div>
        ) : board.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400">No ranked sellers yet.</p>
            <p className="text-gray-600 text-sm mt-2">Complete sales and get reviews to appear here.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {board.map((seller, i) => {
              const isMe = seller._id === (user?.id || user?._id);
              return (
                <Link key={seller._id} to={`/seller/${seller._id}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition border-b border-white/[0.05] last:border-0 ${isMe ? "bg-violet-500/5" : ""}`}>

                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {i < 3
                      ? <span className="text-xl">{MEDALS[i]}</span>
                      : <span className="text-gray-500 font-mono text-sm">#{i + 1}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {seller.name?.charAt(0)?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-violet-300" : ""}`}>
                        {seller.name} {isMe && "(You)"}
                      </p>
                      {seller.verified && (
                        <span className="text-[10px] text-blue-400">✓</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{seller.totalSales} sold</p>
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-14 sm:w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700"
                        style={{ width: `${seller.sellerScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{seller.sellerScore}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">
          Score = reviews + ratings + sales + followers
        </p>
      </div>
    </div>
  );
}
