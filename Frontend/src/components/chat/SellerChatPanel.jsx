import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import chatService from '../../services/chatService';
import wsService from '../../services/websocketService';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

const SellerChatPanel = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load chat rooms on mount
  useEffect(() => {
    loadChatRooms();
  }, []);

  // Handle room selection and WebSocket subscription
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      chatService.markMessagesAsRead(selectedRoom.id);
      
      // Connect WebSocket if not connected
      if (!wsService.isConnected()) {
        wsService.connect();
      }

      // Subscribe to new messages
      const subscription = wsService.subscribeToChat(selectedRoom.id, (message) => {
        setMessages(prev => [...prev, message]);
        // Update last message in list
        updateChatList(selectedRoom.id, message);
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [selectedRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRooms = async () => {
    try {
      const rooms = await chatService.getSellerChatRooms();
      setChatRooms(rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const msgs = await chatService.getChatMessages(roomId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const updateChatList = (roomId, lastMessage) => {
    setChatRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          lastMessage: lastMessage.type === 'IMAGE' ? 'Sent an image' : lastMessage.content,
          lastMessageAt: lastMessage.timestamp,
          unreadCount: 0 // Reset unread count since we are viewing it
        };
      }
      return room;
    }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedRoom) return;

    setSending(true);
    try {
      if (selectedImage) {
        await chatService.sendImageMessage(selectedRoom.id, selectedImage);
      } else {
        await chatService.sendTextMessage(selectedRoom.id, newMessage);
      }

      // Optimistically add message (though WebSocket will also send it back)
      // We rely on WebSocket for the update to avoid duplicates if we added it here too
      // But since we are the sender, we might want to add it immediately for better UX
      // However, the subscription callback handles it.
      
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = `uploads/${cleanPath}`;
    }

    return `${API_URL.replace('/api/v1', '').replace('/api', '')}/${cleanPath}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading chats...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-100 rounded-lg overflow-hidden shadow-xl border border-gray-200">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No conversations yet.
            </div>
          ) : (
            chatRooms.map(room => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={getImageUrl(room.productImage) || 'https://via.placeholder.com/40'} 
                      alt={room.productName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    {room.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-gray-900 truncate">{room.buyerName}</h3>
                      <span className="text-xs text-gray-500">{formatTime(room.lastMessageAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{room.productName}</p>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <img 
                  src={getImageUrl(selectedRoom.productImage)} 
                  alt={selectedRoom.productName}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedRoom.buyerName}</h3>
                  <p className="text-xs text-gray-500">Inquiry about: {selectedRoom.productName}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isOwn = msg.senderId === user.userId;
                return (
                  <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      isOwn 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}>
                      {msg.type === 'IMAGE' ? (
                        <img 
                          src={getImageUrl(msg.imageUrl)} 
                          alt="Shared" 
                          className="rounded-lg max-w-full h-auto mt-1 mb-1"
                        />
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p className={`text-[10px] mt-1 text-right ${
                        isOwn ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-gray-300" />
                  <button 
                    onClick={() => { setImagePreview(null); setSelectedImage(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <UserCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <PhotoIcon className="w-6 h-6" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={sending || (!newMessage.trim() && !selectedImage)}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <ChatBubbleLeftRightIcon className="w-24 h-24 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChatPanel;
