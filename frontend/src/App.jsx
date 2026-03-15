import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./services/api";
import { authStore } from "./store/authStore";

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

export default function App() {
  const setAccessToken = authStore((state) => state.setAccessToken);
  const setUser = authStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      } catch { /* not logged in */ }
      finally { setLoading(false); }
    };
    refreshUser();
  }, [setAccessToken, setUser]);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-t-white border-r-2 border-r-transparent" />
    </div>
  );

  return (
    <>
      <Navbar />
      <PWAInstallPrompt />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:id" element={<NoteDetails />} />
        <Route path="/seller/:userId" element={<SellerProfile />} />

        {/* Protected */}
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
