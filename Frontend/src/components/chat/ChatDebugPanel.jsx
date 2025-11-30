import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import wsService from '../../services/websocketService';
import chatService from '../../services/chatService';
import { API_BASE_URL } from '../../config';

/**
 * Chat Debug Panel - Test and Debug Chat Functionality
 * 
 * Use this component to:
 * 1. Check WebSocket connection status
 * 2. Test message sending
 * 3. Verify backend connectivity
 * 4. Debug user authentication
 * 5. Monitor real-time events
 */
const ChatDebugPanel = () => {
  const { user } = useAuth();
  const [wsStatus, setWsStatus] = useState('Not Connected');
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Check User Authentication
    console.log('=== DIAGNOSTIC TEST 1: User Authentication ===');
    if (!user) {
      addResult('User Auth', false, 'User not logged in');
      setTesting(false);
      return;
    }
    addResult('User Auth', true, `Logged in as: ${user.name || user.email} (ID: ${user.userId})`);
    console.log('User object:', user);

    // Test 2: Check Backend Connectivity
    console.log('=== DIAGNOSTIC TEST 2: Backend Connection ===');
    try {
      const chatRooms = await chatService.getUserChatRooms();
      addResult('Backend', true, `Backend accessible - ${chatRooms.length} chat rooms found`);
    } catch (error) {
      addResult('Backend', false, `Cannot reach backend: ${error.message}`);
      console.error('Backend error:', error);
    }

    // Test 3: WebSocket Connection
    console.log('=== DIAGNOSTIC TEST 3: WebSocket Connection ===');
    const wsConnected = wsService.isConnected();
    if (wsConnected) {
      addResult('WebSocket', true, 'WebSocket already connected');
      setWsStatus('Connected');
    } else {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
          
          wsService.connect(
            () => {
              clearTimeout(timeout);
              addResult('WebSocket', true, `Connected to ${API_BASE_URL}/ws`);
              setWsStatus('Connected');
              resolve();
            },
            (error) => {
              clearTimeout(timeout);
              addResult('WebSocket', false, `Connection failed: ${error}`);
              setWsStatus('Failed');
              reject(error);
            }
          );
        });
      } catch (error) {
        addResult('WebSocket', false, `WebSocket error: ${error.message}`);
        setWsStatus('Error');
      }
    }

    // Test 4: Test Chat Room Creation
    console.log('=== DIAGNOSTIC TEST 4: Chat Room Creation ===');
    try {
      // Create a test chat room (you'll need a valid seller ID and product ID)
      const testSellerId = 1; // Replace with actual seller ID
      const testProductId = 1; // Replace with actual product ID
      
      const room = await chatService.getOrCreateChatRoom(testSellerId, testProductId, 'FISH');
      addResult('Chat Room', true, `Created/Retrieved room ID: ${room.id}`);
      console.log('Chat room:', room);
    } catch (error) {
      addResult('Chat Room', false, `Failed: ${error.message}`);
      console.error('Chat room error:', error);
    }

    setTesting(false);
  };

  const testWebSocketMessage = () => {
    if (!wsService.isConnected()) {
      addResult('Send Test', false, 'WebSocket not connected');
      return;
    }

    try {
      wsService.sendMessage(
        1, // Test chat room ID
        user.userId,
        user.name || user.email,
        'Test message from debug panel'
      );
      addResult('Send Test', true, 'Test message sent via WebSocket');
    } catch (error) {
      addResult('Send Test', false, `Failed to send: ${error.message}`);
    }
  };

  const checkWebSocketStatus = () => {
    const connected = wsService.isConnected();
    setWsStatus(connected ? 'Connected' : 'Disconnected');
    addResult('Status Check', connected, connected ? 'WebSocket is connected' : 'WebSocket is disconnected');
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-lg border-2 border-blue-500 z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h3 className="font-bold text-lg">🔧 Chat Debug Panel</h3>
        <p className="text-xs opacity-90">Diagnostic Tools</p>
      </div>

      {/* Status */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <strong>User:</strong> {user ? user.name || user.email : 'Not logged in'}
          </div>
          <div>
            <strong>User ID:</strong> {user ? user.userId : 'N/A'}
          </div>
          <div>
            <strong>WebSocket:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              wsStatus === 'Connected' ? 'bg-green-100 text-green-800' : 
              wsStatus === 'Failed' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {wsStatus}
            </span>
          </div>
          <div>
            <strong>Backend:</strong> {API_BASE_URL}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b space-y-2">
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? '🔄 Running Tests...' : '▶️ Run Full Diagnostics'}
        </button>
        
        <button
          onClick={checkWebSocketStatus}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          🔍 Check WebSocket Status
        </button>
        
        <button
          onClick={testWebSocketMessage}
          disabled={!user}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          📤 Send Test Message
        </button>
      </div>

      {/* Results */}
      <div className="p-4 max-h-64 overflow-y-auto">
        <h4 className="font-bold mb-2 text-sm">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No tests run yet</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs border ${
                  result.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <strong className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.success ? '✅' : '❌'} {result.test}
                  </strong>
                  <span className="text-gray-500">{result.timestamp}</span>
                </div>
                <div className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 rounded-b-lg text-xs">
        <strong>📋 Instructions:</strong>
        <ol className="ml-4 mt-1 space-y-1 list-decimal">
          <li>Click "Run Full Diagnostics" to check all systems</li>
          <li>Check console (F12) for detailed logs</li>
          <li>Verify all tests pass before using chat</li>
          <li>If WebSocket fails, refresh page and try again</li>
        </ol>
      </div>
    </div>
  );
};

export default ChatDebugPanel;
