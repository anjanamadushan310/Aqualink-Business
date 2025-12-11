import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmDeleteReviewModal = ({ review, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium mb-2">
                Are you sure you want to delete this review?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Type:</span>{' '}
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    review.reviewType === 'PRODUCT' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {review.reviewType}
                  </span>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Reviewer:</span> {review.reviewerName}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Rating:</span> {review.rating}/5
                </p>
                {review.comment && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Comment:</span>{' '}
                    <span className="text-gray-600 line-clamp-2">{review.comment}</span>
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                This action cannot be undone. The review will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteReviewModal;
