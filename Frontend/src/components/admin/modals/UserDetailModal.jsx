import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import userManagementAPI from '../../../services/userManagementAPI';

export default function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await userManagementAPI.getUserDetails(userId);
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'SHOP_OWNER': 'bg-blue-100 text-blue-800',
      'FARM_OWNER': 'bg-green-100 text-green-800',
      'EXPORTER': 'bg-orange-100 text-orange-800',
      'SERVICE_PROVIDER': 'bg-cyan-100 text-cyan-800',
      'INDUSTRIAL_STUFF_SELLER': 'bg-indigo-100 text-indigo-800',
      'DELIVERY_PERSON': 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="flex items-start gap-4">
            {user.logoUrl ? (
              <img
                src={user.logoUrl}
                alt="User"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-600">{user.phoneNumber}</p>
              {user.nicNumber && (
                <p className="text-gray-600">NIC: {user.nicNumber}</p>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              user.active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.active ? 'Active' : 'Inactive'}
            </span>
            {user.verificationStatus && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                user.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                user.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user.verificationStatus}
              </span>
            )}
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {user.roles?.map((role, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(role)}`}
                >
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Business Information */}
          {(user.businessName || user.businessType) && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h4>
              <div className="grid grid-cols-2 gap-4">
                {user.businessName && (
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium">{user.businessName}</p>
                  </div>
                )}
                {user.businessType && (
                  <div>
                    <p className="text-sm text-gray-600">Business Type</p>
                    <p className="font-medium">{user.businessType}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {(user.district || user.town || user.address) && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Address</h4>
              <div className="space-y-2">
                {user.address && <p>{user.address}</p>}
                <p>{[user.town, user.district].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Orders</p>
                <p className="text-2xl font-bold text-blue-900">{user.orderCount || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Reviews</p>
                <p className="text-2xl font-bold text-green-900">{user.reviewCount || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Account Age</p>
                <p className="text-2xl font-bold text-purple-900">{user.accountAgeDays || 0} days</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {(user.nicFrontPath || user.nicBackPath || user.selfiePath) && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
              <div className="grid grid-cols-3 gap-4">
                {user.nicFrontPath && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">NIC Front</p>
                    <img
                      src={user.nicFrontPath}
                      alt="NIC Front"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {user.nicBackPath && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">NIC Back</p>
                    <img
                      src={user.nicBackPath}
                      alt="NIC Back"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {user.selfiePath && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Selfie</p>
                    <img
                      src={user.selfiePath}
                      alt="Selfie"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-medium">#{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
