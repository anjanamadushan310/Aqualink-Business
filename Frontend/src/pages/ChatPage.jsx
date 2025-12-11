import React, { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatList from '../components/chat/ChatList';
import ChatWithSeller from '../components/chat/ChatWithSeller';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chatRoom) => {
    setSelectedChat(chatRoom);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">

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
