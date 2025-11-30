import axios from 'axios';
import { API_URL } from '../config';

/**
 * Chat Service - Product-Context-Aware Chat API
 * 
 * This service handles all chat-related API calls and implements the following requirements:
 * 
 * 1. CONTEXT-AWARE CHAT INITIATION:
 *    - getOrCreateChatRoom() accepts sellerId, productId, and productType
 *    - This ensures each chat is linked to a specific product listing
 *    - Different products create different chat threads
 * 
 * 2. PERSISTENT CHAT HISTORY:
 *    - getChatMessages() retrieves all historical messages for a chat room
 *    - Messages persist in the database as long as the product listing exists
 * 
 * 3. REAL-TIME AND PERSISTED MESSAGING:
 *    - Text messages sent via WebSocket for real-time (handled in websocketService)
 *    - Image messages sent via HTTP with file upload
 *    - All messages are persisted to database
 */
const chatService = {
  /**
   * Get or Create Chat Room - Context-Aware
   * 
   * When a buyer clicks "Chat with Seller" on a fish listing:
   * - Backend checks if a chat room exists for this buyer-seller-product combination
   * - If exists: Returns existing room with conversation history
   * - If new: Creates a new room linked to this specific product
   * 
   * @param {number} sellerId - The seller's user ID (product owner)
   * @param {number} productId - The specific product listing ID
   * @param {string} productType - "FISH" or "INDUSTRIAL_STUFF"
   * @returns {Promise<Object>} Chat room with product context
   */
  getOrCreateChatRoom: async (sellerId, productId, productType) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat/room`,
      null,
      {
        params: { sellerId, productId, productType },
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Get user's chat rooms
  getUserChatRooms: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chat/rooms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  // Get seller's chat rooms
  getSellerChatRooms: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chat/seller/rooms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  // Get messages for a chat room
  getChatMessages: async (chatRoomId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chat/messages/${chatRoomId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  },

  // Send text message
  sendTextMessage: async (chatRoomId, content) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat/message/text`,
      null,
      {
        params: { chatRoomId, content },
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Send image message
  sendImageMessage: async (chatRoomId, imageFile) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(
      `${API_URL}/chat/message/image?chatRoomId=${chatRoomId}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  // Mark messages as read
  markMessagesAsRead: async (chatRoomId) => {
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/chat/read/${chatRoomId}`, null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};

export default chatService;
