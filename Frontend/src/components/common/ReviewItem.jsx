import React from 'react';
import StarRating from '../common/StarRating';

const ReviewItem = ({ review, onDelete, currentUserId }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOwnReview = currentUserId && review.userId === currentUserId;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {review.userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{review.userName}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.reviewedAt)}</p>
          </div>
        </div>
        
        {isOwnReview && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2">
        <StarRating rating={review.rating} size="sm" />
        {review.verifiedPurchase && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Verified Purchase
          </span>
        )}
      </div>

      {review.comment && (
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
};

export default ReviewItem;
