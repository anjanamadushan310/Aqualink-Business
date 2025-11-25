import React, { useState, useEffect } from 'react';
import { Star, Package, CheckCircle, Calendar } from 'lucide-react';
import apiService from '../../services/apiService';
import ReviewForm from '../common/ReviewForm';
import StarRating from '../common/StarRating';

const DeliveredItems = () => {
  const [deliveredItems, setDeliveredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchDeliveredItems();
  }, []);

  const fetchDeliveredItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/orders/delivered-items');
      setDeliveredItems(response.data);
    } catch (err) {
      setError('Failed to load delivered items');
      console.error('Error fetching delivered items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (item) => {
    if (item.hasReview) {
      alert('You have already reviewed this item');
      return;
    }
    setSelectedItem(item);
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedItem(null);
    fetchDeliveredItems(); // Refresh the list
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Delivered Items</h2>
        </div>

        {deliveredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No delivered items yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Items from delivered orders will appear here for you to review
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveredItems.map((item) => (
              <div
                key={`${item.orderId}-${item.orderItemId}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.productName}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.productType === 'FISH' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.productType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>Quantity: {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Price: {formatPrice(item.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Delivered: {formatDate(item.deliveredDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Order #{item.orderId}
                        </span>
                      </div>
                    </div>

                    {item.hasReview && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>You have reviewed this item</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {item.hasReview ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Reviewed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReviewClick(item)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Review: {selectedItem.productName}</h3>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <p><strong>Product:</strong> {selectedItem.productName}</p>
                  <p><strong>Type:</strong> {selectedItem.productType}</p>
                  <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
                  <p><strong>Delivered:</strong> {formatDate(selectedItem.deliveredDate)}</p>
                </div>
              </div>

              <ReviewForm
                productId={selectedItem.productId}
                productType={selectedItem.productType}
                orderId={selectedItem.orderId}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={() => {
                  setShowReviewForm(false);
                  setSelectedItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveredItems;
