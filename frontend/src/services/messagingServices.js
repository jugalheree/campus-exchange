import api from "./api";

export const messagingService = {
  // Send message to user
  async sendMessage(recipientId, content, relatedType = null, relatedId = null) {
    const response = await api.post("/messages", {
      recipientId,
      content,
      relatedType,
      relatedId,
    });
    return response.data;
  },

  // Get all conversations
  async getConversations(page = 1, limit = 20) {
    const response = await api.get(
      `/messages/conversations?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get messages in conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    const response = await api.get(
      `/messages/${conversationId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Mark conversation as read
  async markAsRead(conversationId) {
    const response = await api.put(`/messages/${conversationId}/read`);
    return response.data;
  },

  // Delete message
  async deleteMessage(messageId) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Block user
  async blockUser(userId) {
    const response = await api.post(`/messages/block/${userId}`);
    return response.data;
  },

  // Unblock user
  async unblockUser(userId) {
    const response = await api.delete(`/messages/block/${userId}`);
    return response.data;
  },

  // Search conversations
  async searchConversations(query) {
    const response = await api.get(`/messages/search?search=${query}`);
    return response.data;
  },

  // Get unread count
  async getUnreadCount() {
    const response = await api.get("/messages/unread");
    return response.data;
  },

  // Start conversation with user (for quick messaging)
  async startConversation(userId) {
    // This creates a conversation by sending an empty greeting
    const response = await api.post("/messages", {
      recipientId: userId,
      content: "👋 Hi there!",
    });
    return response.data;
  },
};

export default messagingService;