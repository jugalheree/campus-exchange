import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function MessageButton({ sellerId, sellerName, productType, productId }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  const handleMessage = async () => {
    if (!user) {
      alert("Please log in to send messages");
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      // Send initial message
      const response = await api.post("/messages", {
        recipientId: sellerId,
        content: `👋 Hi! I'm interested in your ${productType}${productId ? " and would like to know more!" : ""}`,
        relatedType: productType,
        relatedId: productId,
      });

      // Navigate to conversation
      navigate(`/messages/${response.data.data.conversation._id}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(error.response?.data?.message || "Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleMessage}
      disabled={isLoading}
      className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Starting chat...
        </>
      ) : (
        <>
          <span>💬</span>
          Message {sellerName}
        </>
      )}
    </button>
  );
}