import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const AddRoleSection = ({ currentRoles, onRoleAdded }) => {
  const { refreshUserData } = useAuth();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const roleLabels = {
    'SHOP_OWNER': 'Shop Owner (Buyer)',
    'FARM_OWNER': 'Farm Owner',
    'EXPORTER': 'Exporter',
    'SERVICE_PROVIDER': 'Service Provider',
    'INDUSTRIAL_STUFF_SELLER': 'Industrial Stuff Seller',
    'DELIVERY_PERSON': 'Delivery Person'
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/roles`);
      // Filter out admin role and roles user already has
      const filtered = response.data.filter(
        role => role.value !== 'ADMIN' && !currentRoles.includes(role.value)
      );
      setAvailableRoles(filtered);
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to hardcoded roles
      const allRoles = [
        { value: 'SHOP_OWNER', label: 'Shop Owner (Buyer)' },
        { value: 'FARM_OWNER', label: 'Farm Owner' },
        { value: 'EXPORTER', label: 'Exporter' },
        { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
        { value: 'INDUSTRIAL_STUFF_SELLER', label: 'Industrial Stuff Seller' },
        { value: 'DELIVERY_PERSON', label: 'Delivery Person' }
      ];
      const filtered = allRoles.filter(role => !currentRoles.includes(role.value));
      setAvailableRoles(filtered);
    }
  };

  useEffect(() => {
    fetchAvailableRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoles]);

  const validateForm = () => {
    if (!selectedRole) {
      setMessage('Please select a role');
      setMessageType('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/users/add-role`,
        { role: selectedRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update token and user data in localStorage with new roles
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Update user object with new roles from response
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Roles now come as a proper array from backend
          if (response.data.roles && Array.isArray(response.data.roles)) {
            userData.roles = response.data.roles;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Updated user roles:', userData.roles);
          }
        }
      }

      setMessage('Role added successfully!');
      setMessageType('success');
      
      // Reset form
      setSelectedRole('');
      setShowForm(false);

      // Refresh user data in context to update UI immediately
      refreshUserData();

      // Notify parent component to refresh profile and available roles
      if (onRoleAdded) {
        onRoleAdded();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error adding role:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to submit role request. Please try again.';
      
      if (error.response?.data) {
        // Handle different error response formats
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message === 'Network Error' 
          ? 'Unable to connect to server. Please check your internet connection.'
          : error.message;
      }
      
      setMessage(errorMessage);
      setMessageType('error');
      
      // Clear error message after 7 seconds
      setTimeout(() => {
        setMessage('');
      }, 7000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedRole('');
    setMessage('');
  };

  if (availableRoles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Additional Roles</h2>
        <p className="text-gray-600">You currently have all available roles assigned to your account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Add Additional Roles</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Request New Role
          </button>
        )}
      </div>

      {/* Success/Error Message Display */}
      {message && (
        <div 
          className={`mb-4 p-4 rounded-lg flex items-start gap-3 animate-fadeIn ${
            messageType === 'success' 
              ? 'bg-green-50 border-l-4 border-green-500 text-green-800' 
              : 'bg-red-50 border-l-4 border-red-500 text-red-800'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {messageType === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{message}</p>
          </div>
          <button
            onClick={() => setMessage('')}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {!showForm && (
        <div className="text-gray-600">
          <p className="mb-2">Your current roles:</p>
          <div className="flex flex-wrap gap-2">
            {currentRoles.map(role => (
              <span key={role} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {roleLabels[role] || role}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm">
            You can add additional roles by clicking the "Request New Role" button above.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Role to Add *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a role...</option>
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your additional role will be activated immediately. You can start using it right away.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Role...' : 'Add Role'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddRoleSection;
