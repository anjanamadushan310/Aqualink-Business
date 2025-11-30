import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { PlusCircleIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AddRoleSection = ({ currentRoles, onRoleAdded }) => {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [documents, setDocuments] = useState({
    nicFrontDocument: null,
    nicBackDocument: null,
    selfieDocument: null
  });
  const [previewImages, setPreviewImages] = useState({
    nicFront: null,
    nicBack: null,
    selfie: null
  });
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

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      setDocuments(prev => ({ ...prev, [documentType]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewKey = documentType.replace('Document', '');
        setPreviewImages(prev => ({ ...prev, [previewKey]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (documentType) => {
    setDocuments(prev => ({ ...prev, [documentType]: null }));
    const previewKey = documentType.replace('Document', '');
    setPreviewImages(prev => ({ ...prev, [previewKey]: null }));
    
    // Clear file input
    const fileInput = document.getElementById(documentType);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    if (!selectedRole) {
      setMessage('Please select a role');
      setMessageType('error');
      return false;
    }

    if (!documents.nicFrontDocument || !documents.nicBackDocument || !documents.selfieDocument) {
      setMessage('Please upload all required documents (NIC front, NIC back, and selfie)');
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

    const formData = new FormData();
    formData.append('role', selectedRole);
    formData.append('nicFrontDocument', documents.nicFrontDocument);
    formData.append('nicBackDocument', documents.nicBackDocument);
    formData.append('selfieDocument', documents.selfieDocument);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/users/add-role`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('Role request submitted successfully! Please wait for admin approval.');
      setMessageType('success');
      
      // Reset form
      setSelectedRole('');
      setDocuments({
        nicFrontDocument: null,
        nicBackDocument: null,
        selfieDocument: null
      });
      setPreviewImages({
        nicFront: null,
        nicBack: null,
        selfie: null
      });
      setShowForm(false);

      // Notify parent component
      if (onRoleAdded) {
        onRoleAdded();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);

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
    setDocuments({
      nicFrontDocument: null,
      nicBackDocument: null,
      selfieDocument: null
    });
    setPreviewImages({
      nicFront: null,
      nicBack: null,
      selfie: null
    });
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
            You can request additional roles by clicking the "Request New Role" button above.
            All role requests require document verification and admin approval.
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

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Upload Verification Documents *</h3>
            <p className="text-sm text-gray-600">
              Please upload clear photos of your documents. All documents are required for verification.
            </p>

            {/* NIC Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIC Front Side *
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="nicFrontDocument"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'nicFrontDocument')}
                  className="hidden"
                />
                <label
                  htmlFor="nicFrontDocument"
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <DocumentIcon className="w-5 h-5 text-gray-600" />
                  Choose File
                </label>
                {documents.nicFrontDocument && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{documents.nicFrontDocument.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile('nicFrontDocument')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {previewImages.nicFront && (
                <img src={previewImages.nicFront} alt="NIC Front Preview" className="mt-2 w-48 h-32 object-cover rounded-lg border" />
              )}
            </div>

            {/* NIC Back */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIC Back Side *
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="nicBackDocument"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'nicBackDocument')}
                  className="hidden"
                />
                <label
                  htmlFor="nicBackDocument"
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <DocumentIcon className="w-5 h-5 text-gray-600" />
                  Choose File
                </label>
                {documents.nicBackDocument && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{documents.nicBackDocument.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile('nicBackDocument')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {previewImages.nicBack && (
                <img src={previewImages.nicBack} alt="NIC Back Preview" className="mt-2 w-48 h-32 object-cover rounded-lg border" />
              )}
            </div>

            {/* Selfie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selfie with NIC *
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="selfieDocument"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfieDocument')}
                  className="hidden"
                />
                <label
                  htmlFor="selfieDocument"
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <DocumentIcon className="w-5 h-5 text-gray-600" />
                  Choose File
                </label>
                {documents.selfieDocument && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{documents.selfieDocument.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile('selfieDocument')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {previewImages.selfie && (
                <img src={previewImages.selfie} alt="Selfie Preview" className="mt-2 w-48 h-32 object-cover rounded-lg border" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Role Request'}
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
