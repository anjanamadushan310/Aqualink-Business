import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatDebugPanel from '../components/chat/ChatDebugPanel';
import ChatWithSeller from '../components/chat/ChatWithSeller';
import { useAuth } from '../context/AuthContext';

/**
 * Chat Testing Page
 * 
 * Use this page to test and debug the chat functionality
 * Accessible at /chat-test
 */
const ChatTestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  
  // Sample product data for testing
  const [testProduct, setTestProduct] = useState({
    id: 1,
    userId: 2, // Change this to a valid seller ID
    name: 'Test Fish Product',
    imagePaths: ['/uploads/fish_images/sample.jpg'],
    user: { name: 'Test Seller' }
  });

  const handleProductIdChange = (e) => {
    setTestProduct(prev => ({ ...prev, id: parseInt(e.target.value) || 1 }));
  };

  const handleSellerIdChange = (e) => {
    setTestProduct(prev => ({ ...prev, userId: parseInt(e.target.value) || 2 }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Not Logged In</h1>
          <p className="text-gray-700 mb-6">
            You must be logged in to test the chat functionality.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Home Page & Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                🧪 Chat Testing Lab
              </h1>
              <p className="text-gray-600 mt-1">
                Test and debug chat functionality
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                👤 Current User
              </h2>
              <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                <div><strong>Name:</strong> {user.name || 'N/A'}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>User ID:</strong> {user.userId}</div>
                <div><strong>Roles:</strong> {user.roles?.join(', ') || 'None'}</div>
              </div>
            </div>

            {/* Test Configuration */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                ⚙️ Test Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID (Fish to test with)
                  </label>
                  <input
                    type="number"
                    value={testProduct.id}
                    onChange={handleProductIdChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Enter product ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be a valid fish product ID from your database
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller ID (Product owner)
                  </label>
                  <input
                    type="number"
                    value={testProduct.userId}
                    onChange={handleSellerIdChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Enter seller user ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be different from your user ID ({user.userId})
                  </p>
                </div>

                {testProduct.userId === user.userId && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded text-sm">
                    ⚠️ Warning: Seller ID same as your ID. You cannot chat with yourself!
                  </div>
                )}
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🎯 Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowChat(true)}
                  disabled={testProduct.userId === user.userId}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  💬 Open Chat Interface
                </button>

                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
                >
                  {showDebug ? '🔧 Hide' : '🔧 Show'} Debug Panel
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📋 Testing Steps
              </h2>
              <ol className="space-y-3 text-sm list-decimal list-inside">
                <li className="text-gray-700">
                  <strong>Verify User Info</strong> - Check your user ID and login status
                </li>
                <li className="text-gray-700">
                  <strong>Set Product & Seller IDs</strong> - Enter valid IDs from your database
                </li>
                <li className="text-gray-700">
                  <strong>Open Debug Panel</strong> - Click "Show Debug Panel" to run diagnostics
                </li>
                <li className="text-gray-700">
                  <strong>Run Diagnostics</strong> - Click "Run Full Diagnostics" in debug panel
                </li>
                <li className="text-gray-700">
                  <strong>Check Results</strong> - Verify all tests pass (green checkmarks)
                </li>
                <li className="text-gray-700">
                  <strong>Open Chat</strong> - Click "Open Chat Interface" button
                </li>
                <li className="text-gray-700">
                  <strong>Send Test Message</strong> - Type and send a message
                </li>
                <li className="text-gray-700">
                  <strong>Check Console</strong> - Press F12 and look for logs
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                🐛 Common Issues
              </h2>
              <div className="space-y-3 text-sm">
                <div className="bg-red-50 border-l-4 border-red-500 p-3">
                  <strong className="text-red-800">WebSocket Not Connected</strong>
                  <p className="text-red-700 mt-1">
                    Solution: Refresh the page, check backend is running on port 8080
                  </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                  <strong className="text-yellow-800">Message Not Sending</strong>
                  <p className="text-yellow-700 mt-1">
                    Solution: Check connection status banner, verify WebSocket connected
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                  <strong className="text-blue-800">Cannot Chat with Yourself</strong>
                  <p className="text-blue-700 mt-1">
                    Solution: Use a different seller ID than your user ID
                  </p>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
                  <strong className="text-purple-800">Invalid Product/Seller</strong>
                  <p className="text-purple-700 mt-1">
                    Solution: Use valid IDs from your database, check console for errors
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                ✅ Success Indicators
              </h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Connection status shows "Connected" (green banner)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Message appears immediately when you click send</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Input field clears after sending</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Console shows "Message sent via WebSocket"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>No red error messages in console</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Modal */}
        {showChat && (
          <ChatWithSeller
            product={testProduct}
            productType="FISH"
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Debug Panel */}
        {showDebug && <ChatDebugPanel />}
      </div>
    </div>
  );
};

export default ChatTestPage;
