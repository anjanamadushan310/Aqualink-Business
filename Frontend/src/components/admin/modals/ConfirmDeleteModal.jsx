import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmDeleteModal({ user, onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirmed) {
      return;
    }

    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              You are about to delete the user account for:
            </p>
            <div className="mt-2 space-y-1">
              <p className="font-medium text-red-900">{user.name}</p>
              <p className="text-sm text-red-700">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium">This action will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Disable the user's account (set enabled and active to false)</li>
              <li>Prevent the user from logging in</li>
              <li>Preserve the user's data for audit purposes</li>
              <li>This is a soft delete - data can be recovered by re-enabling the account</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The user's orders, reviews, and other related data will remain in the system.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="confirmDelete"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="confirmDelete" className="text-sm text-gray-700 cursor-pointer">
              I understand that this will disable the user's account and prevent them from logging in
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!confirmed || loading}
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
}
