import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./services/api";
import { authStore } from "./store/authStore";
import axios from "axios";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Products from "./pages/Products";
import CreateProduct from "./pages/CreateProduct";
import ProductDetails from "./pages/ProductDetails";
import EditProduct from "./pages/EditProduct";
import Notes from "./pages/Notes";
import NoteDetails from "./pages/NoteDetails";
import CreateNote from "./pages/CreateNote";
import EditNote from "./pages/EditNote";
import Profile from "./pages/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import Messages from "./pages/Message";
import ChatDetail from "./pages/ChatDetail";
import Wishlist from "./pages/Wishlist";
import Offers from "./pages/Offers";
import Report from "./pages/Report";
import SellerProfile from "./pages/SellerProfile";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Feed from "./pages/Feed";
import LostFound from "./pages/LostFound";
import CreateLostFound from "./pages/CreateLostFound";
import LostFoundDetail from "./pages/LostFoundDetail";
import Leaderboard from "./pages/Leaderboard";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function App() {
  const setAccessToken = authStore((s) => s.setAccessToken);
  const setRefreshToken = authStore((s) => s.setRefreshToken);
  const setUser = authStore((s) => s.setUser);
  const setAuthReady = authStore((s) => s.setAuthReady);
  const user = authStore((s) => s.user);
  const storedRefresh = authStore((s) => s.refreshToken);
  const [loading, setLoading] = useState(!user); // skip spinner if already have user

  useEffect(() => {
    const restoreSession = async () => {
      if (!storedRefresh) {
        // No refresh token at all — not logged in
        setAuthReady(true);
        setLoading(false);
        return;
      }

      try {
        // Use stored refresh token to get a fresh access token
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: storedRefresh },
          { withCredentials: false }
        );
        setAccessToken(res.data.accessToken);
        if (res.data.refreshToken) setRefreshToken(res.data.refreshToken);
        setUser(res.data.user);
      } catch {
        // Refresh token expired or invalid — log out cleanly
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setAuthReady(true);
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
        <span className="text-black font-black text-xs">CE</span>
      </div>
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  return (
    <>
      <Navbar />
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:id" element={<NoteDetails />} />
        <Route path="/seller/:userId" element={<SellerProfile />} />

        <Route path="/create-product" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
        <Route path="/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/create-note" element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
        <Route path="/edit-note/:id" element={<ProtectedRoute><EditNote /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
        <Route path="/lost-found/new" element={<ProtectedRoute><CreateLostFound /></ProtectedRoute>} />
        <Route path="/lost-found/:id" element={<ProtectedRoute><LostFoundDetail /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
