import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import chatService from '../../services/chatService';
import { API_URL } from '../../config';

const ChatList = ({ onSelectChat }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      const rooms = await chatService.getUserChatRooms();
      setChatRooms(rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_URL.replace('/api/v1', '').replace('/api', '')}/${cleanPath}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-7 h-7" />
          <h3 className="font-semibold text-xl">My Chats</h3>
        </div>
      </div>

      {/* Chat List */}
      <div className="bg-white">
        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ChatBubbleLeftRightIcon className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No chats yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start chatting with sellers from product pages
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectChat(room)}
                className="p-5 hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <img
                    src={getImageUrl(room.productImage)}
                    alt={room.productName}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0 shadow-md hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening chat when clicking image
                      // Navigate to product details page based on product type
                      const type = room.productType;
                      const id = room.productId;
                      
                      if (type === 'FISH') {
                        window.location.href = `/fish/${id}`;
                      } else if (type === 'INDUSTRIAL_STUFF') {
                        window.location.href = `/industrial/${id}`;
                      } else if (type === 'SERVICE') {
                        window.location.href = `/service/${id}`;
                      }
                    }}
                    title="View Product Details"
                  />

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 
                        className="font-semibold text-gray-900 truncate text-lg hover:text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening chat when clicking title
                          // Navigate to product details page based on product type
                          const type = room.productType;
                          const id = room.productId;
                          
                          if (type === 'FISH') {
                            window.location.href = `/fish/${id}`;
                          } else if (type === 'INDUSTRIAL_STUFF') {
                            window.location.href = `/industrial/${id}`;
                          } else if (type === 'SERVICE') {
                            window.location.href = `/service/${id}`;
                          }
                        }}
                        title="View Product Details"
                      >
                        {room.productName}
                      </h4>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      {room.sellerName || room.buyerName}
                    </p>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {room.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 shadow-lg">
                      {room.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
