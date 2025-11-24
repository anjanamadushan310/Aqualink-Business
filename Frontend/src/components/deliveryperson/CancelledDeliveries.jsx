import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';

const CancelledDeliveries = () => {
  const [cancelledDeliveries, setCancelledDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchCancelledDeliveries();
  }, []);

  const fetchCancelledDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deliveryService.getOrdersByStatus('CANCELED');
      setCancelledDeliveries(response || []);
    } catch (err) {
      console.error('Error fetching cancelled deliveries:', err);
      setError('Failed to load cancelled deliveries');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return `Rs. ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeliveries = cancelledDeliveries.filter(delivery =>
    delivery.orderId?.toString().includes(searchTerm) ||
    delivery.cancellationReason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancelled Deliveries</h1>
        <p className="text-gray-600">View all your cancelled delivery orders</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID or cancellation reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cancelled</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{cancelledDeliveries.length}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {cancelledDeliveries.filter(d => {
                  if (!d.cancelledDateTime) return false;
                  const cancelDate = new Date(d.cancelledDateTime);
                  const now = new Date();
                  return cancelDate.getMonth() === now.getMonth() && 
                         cancelDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lost Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPrice(cancelledDeliveries.reduce((sum, d) => sum + (parseFloat(d.deliveryFee) || 0), 0))}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cancelled Deliveries</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No deliveries match your search criteria' : 'You have no cancelled deliveries'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-4 border-red-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Order #{delivery.orderId}
                      </h3>
                      <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        CANCELLED
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Cancelled on {formatDate(delivery.cancelledDateTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDelivery(delivery)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    View Details
                  </button>
                </div>

                {/* Cancellation Reason */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">Cancellation Reason:</p>
                      <p className="text-red-800">{delivery.cancellationReason || 'No reason provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Value</p>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(delivery.totalAmount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Your Delivery Fee</p>
                    <p className="text-lg font-bold text-red-600">{formatPrice(delivery.deliveryFee)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="text-lg font-bold text-gray-900">
                      {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Order #{selectedDelivery.orderId} - Details
              </h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                <span className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-full">
                  CANCELLED
                </span>
              </div>

              {/* Cancellation Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Cancellation Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-red-700 font-medium">Cancelled On:</span>
                    <p className="text-red-800">{formatDate(selectedDelivery.cancelledDateTime)}</p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Reason:</span>
                    <p className="text-red-800">{selectedDelivery.cancellationReason || 'No reason provided'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Financial Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Order Value:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedDelivery.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Delivery Fee (Lost):</span>
                    <span className="font-semibold text-red-600">{formatPrice(selectedDelivery.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-gray-100 rounded px-3 font-bold text-lg">
                    <span className="text-gray-900">Total (Lost):</span>
                    <span className="text-red-600">
                      {formatPrice((parseFloat(selectedDelivery.totalAmount) || 0) + (parseFloat(selectedDelivery.deliveryFee) || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
                <div className="space-y-3">
                  {selectedDelivery.deliveryDate && (
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Order Created</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedDelivery.deliveryDate)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start">
                    <div className="bg-red-100 rounded-full p-2 mr-3">
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Cancelled</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedDelivery.cancelledDateTime)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedDelivery(null)}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelledDeliveries;
