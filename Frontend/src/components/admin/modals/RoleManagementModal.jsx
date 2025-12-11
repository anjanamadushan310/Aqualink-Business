import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import userManagementAPI from '../../../services/userManagementAPI';

const ALL_ROLES = [
  'SHOP_OWNER',
  'FARM_OWNER',
  'EXPORTER',
  'SERVICE_PROVIDER',
  'INDUSTRIAL_STUFF_SELLER',
  'DELIVERY_PERSON'
];

export default function RoleManagementModal({ user, onClose, onSuccess }) {
  const [currentRoles, setCurrentRoles] = useState(user.roles || []);
  const [selectedRole, setSelectedRole] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  const availableRoles = ALL_ROLES.filter(role => !currentRoles.includes(role));

  const handleAddRole = async () => {
    if (!selectedRole) {
      setErrorMessage('Please select a role to add');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await userManagementAPI.addRoleToUser(user.id, selectedRole, reason);
      setCurrentRoles([...currentRoles, selectedRole]);
      setSelectedRole('');
      setReason('');
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to add role:', error);
      setErrorMessage('Failed to add role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role) => {
    setLoading(true);
    setErrorMessage('');

    try {
      await userManagementAPI.removeRoleFromUser(user.id, role);
      setCurrentRoles(currentRoles.filter(r => r !== role));
      setConfirmRemove(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to remove role:', error);
      setErrorMessage('Failed to remove role. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const formatRoleName = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage User Roles</h2>
            <p className="text-sm text-gray-600 mt-1">{user.name} ({user.email})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Current Roles */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Roles</h3>
            {currentRoles.length > 0 ? (
              <div className="space-y-2">
                {currentRoles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(role)}`}>
                      {formatRoleName(role)}
                    </span>
                    {role !== 'ADMIN' && (
                      <button
                        onClick={() => setConfirmRemove(role)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No roles assigned</p>
            )}
          </div>

          {/* Add New Role */}
          {availableRoles.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Role</h3>
              <div className="space-y-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select a role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {formatRoleName(role)}
                    </option>
                  ))}
                </select>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for adding this role (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  disabled={loading}
                />

                <button
                  onClick={handleAddRole}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading || !selectedRole}
                >
                  <PlusIcon className="h-5 w-5" />
                  {loading ? 'Adding Role...' : 'Add Role'}
                </button>
              </div>
            </div>
          )}

          {/* Role Removal Confirmation */}
          {confirmRemove && (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Confirm Role Removal
                </h4>
                <p className="text-sm text-yellow-700 mb-4">
                  Are you sure you want to remove the <strong>{formatRoleName(confirmRemove)}</strong> role from this user?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemoveRole(confirmRemove)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Removing...' : 'Yes, Remove'}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              onSuccess();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
