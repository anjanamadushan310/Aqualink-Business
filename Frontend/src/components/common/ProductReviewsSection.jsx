import React, { useState, useEffect, useCallback } from 'react';
import StarRating from '../common/StarRating';
import ReviewItem from '../common/ReviewItem';
import ReviewForm from '../common/ReviewForm';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

const ProductReviewsSection = ({ productId, productType, allowReview = true, onReviewUpdate }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      console.log('Fetching reviews for:', productId, productType);
      const response = await apiService.get(`/product-reviews/product/${productId}/${productType}`);
      console.log('Reviews response:', response);
      console.log('Reviews response.data:', response.data);
      console.log('Reviews response type:', typeof response);
      
      // Handle both response formats
      const reviewsData = Array.isArray(response) ? response : (response.data || []);
      console.log('Setting reviews to:', reviewsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      console.error('Error details:', err.response?.data);
      setReviews([]);
    }
  }, [productId, productType]);

  const fetchSummary = useCallback(async () => {
    try {
      console.log('Fetching summary for:', productId, productType);
      const response = await apiService.get(`/product-reviews/product/${productId}/${productType}/summary`);
      console.log('Summary response:', response);
      console.log('Summary response.data:', response.data);
      
      // Handle both response formats
      const summaryData = response.data || response;
      console.log('Setting summary to:', summaryData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching summary:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [productId, productType]);

  const checkIfUserReviewed = useCallback(async () => {
    try {
      const response = await apiService.get(`/product-reviews/check/${productId}/${productType}`);
      setHasReviewed(response.data.hasReviewed);
    } catch (err) {
      console.error('Error checking review status:', err);
    }
  }, [productId, productType]);

  useEffect(() => {
    fetchReviews();
    fetchSummary();
    if (user && allowReview) {
      checkIfUserReviewed();
    }
  }, [productId, productType, user, allowReview, fetchReviews, fetchSummary, checkIfUserReviewed]);

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setHasReviewed(true);
    fetchReviews();
    fetchSummary();
    // Notify parent component to update rating/review count
    if (onReviewUpdate) {
      onReviewUpdate();
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await apiService.delete(`/product-reviews/${reviewId}`);
      setHasReviewed(false);
      fetchReviews();
      fetchSummary();
      // Notify parent component to update rating/review count
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch {
      alert('Failed to delete review');
    }
  };

  const getRatingPercentage = (rating) => {
    if (!summary || summary.totalReviews === 0) return 0;
    return ((summary.ratingDistribution[rating] || 0) / summary.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      {summary && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">
                  {summary.averageRating?.toFixed(1) || '0.0'}
                </div>
                <StarRating rating={Math.round(summary.averageRating || 0)} size="md" />
                <p className="text-sm text-gray-600 mt-1">
                  {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-12">{rating} star</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {summary.ratingDistribution?.[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button or Form */}
      {user && allowReview && (
        <div className="mb-6">
          {!hasReviewed && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Write a Review
            </button>
          )}

          {hasReviewed && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
              You have already reviewed this product. You can delete your review and write a new one.
            </div>
          )}

          {showReviewForm && !hasReviewed && (
            <ReviewForm
              productId={productId}
              productType={productType}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {console.log('Rendering reviews, count:', reviews.length, 'reviews:', reviews)}
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onDelete={handleDeleteReview}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviewsSection;
