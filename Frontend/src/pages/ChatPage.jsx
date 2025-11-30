import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatList from '../components/chat/ChatList';
import ChatWithSeller from '../components/chat/ChatWithSeller';

const ChatPage = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chatRoom) => {
    setSelectedChat(chatRoom);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">My Chats</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedChat ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={handleBackToList}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Chats
              </button>
            </div>
            <ChatWithSeller
              product={{
                id: selectedChat.productId,
                name: selectedChat.productName,
                imagePaths: selectedChat.productImage ? [selectedChat.productImage] : [],
                userId: selectedChat.sellerId,
                user: {
                  name: selectedChat.sellerName
                }
              }}
              productType={selectedChat.productType}
              onClose={handleBackToList}
              existingChatRoom={selectedChat}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg">
            <ChatList onSelectChat={handleSelectChat} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
