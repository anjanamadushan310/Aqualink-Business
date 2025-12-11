import React, { useState } from 'react';
import { adminAPI, authAPI, utils } from '../../services/api';

const AdminTestPanel = () => {
  const [email, setEmail] = useState('admin@aqualink.com');
  const [password, setPassword] = useState('admin123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(utils.isAuthenticated());

  const createAdminUser = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await adminAPI.createAdminUser(email, password);
      setMessage('Admin user created successfully! You can now login.');
    } catch (error) {
      setMessage('Failed to create admin user: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await authAPI.login(email, password);
      if (response.data.token) {
        utils.setToken(response.data.token);
        setIsLoggedIn(true);
        setMessage('Login successful! You can now access admin features.');
      } else {
        setMessage('Login failed: Email or password is incorrect. Please try again.');
      }
    } catch (error) {
      const rawError = error.response?.data?.error || error.message || '';
      const normalized = rawError.toLowerCase();
      let friendly = 'Email or password is incorrect. Please try again.';

      if (normalized.includes('pending admin approval')) {
        friendly = 'Your account is awaiting admin approval. Please wait for verification to complete.';
      } else if (normalized.includes('rejected')) {
        friendly = 'Your account has been rejected. Please contact support for assistance.';
      } else if (normalized.includes('deactivated')) {
        friendly = 'Your account has been deactivated. Please contact support.';
      }

      setMessage('Login failed: ' + friendly);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    utils.clearAuth();
    setIsLoggedIn(false);
    setMessage('Logged out successfully');
  };

  const testAPI = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await adminAPI.getVerificationUsers();
      setMessage(`API test successful! Found ${response.data.length} users for verification.`);
    } catch (error) {
      setMessage('API test failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Test Panel</h2>
      
      {/* Status */}
      <div className="mb-4 p-3 rounded bg-gray-50">
        <p className="text-sm">
          <span className="font-medium">Status:</span> 
          <span className={`ml-2 ${isLoggedIn ? 'text-green-600' : 'text-red-600'}`}>
            {isLoggedIn ? 'Logged In' : 'Not Logged In'}
          </span>
        </p>
        {isLoggedIn && (
          <p className="text-xs text-gray-500 mt-1">
            Token: {utils.getToken()?.substring(0, 20)}...
          </p>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="admin@aqualink.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="admin123"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={createAdminUser}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Creating...' : 'Create Admin User'}
        </button>
        
        {!isLoggedIn ? (
          <button
            onClick={loginAdmin}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        ) : (
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        )}
        
        {isLoggedIn && (
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('successful') || message.includes('successfully')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Make sure the backend server is running on port 8080</li>
          <li>2. First click "Create Admin User" to create an admin account</li>
          <li>3. Then click "Login" to authenticate</li>
          <li>4. Once logged in, you can use the User Verification component</li>
          <li>5. Use "Test API" to verify the connection works</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminTestPanel;