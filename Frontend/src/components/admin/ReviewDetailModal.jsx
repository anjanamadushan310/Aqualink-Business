import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { CheckBadgeIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import reviewManagementAPI from '../../services/reviewManagementAPI';

const ReviewDetailModal = ({ review, onClose }) => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailData();
  }, [review]);

  const fetchDetailData = async () => {
    try {
      const data = await reviewManagementAPI.getReviewDetail(review.id, review.reviewType);
      setDetailData(data);
    } catch (error) {
      console.error('Error fetching review details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Review Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading details...</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Review Type Badge */}
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  detailData.reviewType === 'PRODUCT' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {detailData.reviewType} REVIEW
                </span>
                {detailData.verifiedPurchase && (
                  <span className="flex items-center text-green-600 text-sm font-medium">
                    <CheckBadgeIcon className="h-5 w-5 mr-1" />
                    Verified Purchase
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Rating</p>
                {renderStars(detailData.rating)}
              </div>

              {/* Comment */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Review Comment</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {detailData.comment || 'No comment provided'}
                  </p>
                </div>
              </div>

              {/* Reviewer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reviewer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-gray-900 font-medium">{detailData.reviewerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-gray-900">{detailData.reviewerEmail}</p>
                    </div>
                  </div>
                  {detailData.reviewerPhone && (
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-gray-900">{detailData.reviewerPhone}</p>
                      </div>
                    </div>
                  )}
                  {(detailData.reviewerDistrict || detailData.reviewerTown) && (
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-gray-900">
                          {[detailData.reviewerTown, detailData.reviewerDistrict].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Review Specific Details */}
              {detailData.reviewType === 'PRODUCT' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h4>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Product ID:</span>
                      <span className="font-medium text-gray-900">{detailData.productId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Product Type:</span>
                      <span className="font-medium text-gray-900">{detailData.productType}</span>
                    </div>
                    {detailData.orderId && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Order ID:</span>
                          <span className="font-medium text-gray-900">#{detailData.orderId}</span>
                        </div>
                        {detailData.orderStatus && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Order Status:</span>
                            <span className="font-medium text-gray-900">{detailData.orderStatus}</span>
                          </div>
                        )}
                        {detailData.orderDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Order Date:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(detailData.orderDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Service Review Specific Details */}
              {detailData.reviewType === 'SERVICE' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h4>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Service Name:</span>
                      <span className="font-medium text-gray-900">{detailData.serviceName}</span>
                    </div>
                    {detailData.serviceCategory && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Category:</span>
                        <span className="font-medium text-gray-900">{detailData.serviceCategory}</span>
                      </div>
                    )}
                    {detailData.serviceProviderName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider:</span>
                        <span className="font-medium text-gray-900">{detailData.serviceProviderName}</span>
                      </div>
                    )}
                    {detailData.serviceProviderEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider Email:</span>
                        <span className="font-medium text-gray-900">{detailData.serviceProviderEmail}</span>
                      </div>
                    )}
                    {detailData.bookingId && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Booking ID:</span>
                          <span className="font-medium text-gray-900">#{detailData.bookingId}</span>
                        </div>
                        {detailData.bookingStatus && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Booking Status:</span>
                            <span className="font-medium text-gray-900">{detailData.bookingStatus}</span>
                          </div>
                        )}
                        {detailData.bookingDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Booking Date:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(detailData.bookingDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Review Metadata */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Review Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-gray-700">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm">
                      Reviewed on {new Date(detailData.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              Failed to load review details
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
