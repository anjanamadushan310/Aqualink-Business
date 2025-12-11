import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';
import { useAuth } from '../../context/AuthContext';

const CurrentDeliveries = () => {
  const { user, token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingDelivery, setProcessingDelivery] = useState(null);

  // Fetch current deliveries from backend
  const fetchDeliveries = async () => {
    if (!token) {
      setError('Please log in to view current deliveries');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch quotes and filter for SHIPPED (in-progress) deliveries
      const response = await deliveryService.getMyQuotes();
      
      if (response.success && response.data) {
        // Filter for accepted quotes that are currently being delivered (SHIPPED status)
        const currentDeliveries = response.data.filter(q => 
          q.status === 'ACCEPTED' && 
          q.orderStatus === 'SHIPPED'
        );
        setDeliveries(currentDeliveries);
      } else {
        setError(response.message || 'Failed to fetch current deliveries');
        setDeliveries([]);
      }
    } catch (err) {
      console.error('Error fetching current deliveries:', err);
      setError('Failed to load current deliveries. Please try again.');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [token]);

  // Mark delivery as delivered
  const handleMarkAsDelivered = async (delivery) => {
    if (!window.confirm(`Are you sure you want to mark Order #${delivery.orderId} as delivered?`)) {
      return;
    }

    try {
      setProcessingDelivery(delivery.id);
      const response = await deliveryService.markAsDelivered(delivery.orderId);
      
      if (response) {
        alert('Order marked as delivered successfully!');
        // Refresh the deliveries list
        await fetchDeliveries();
      } else {
        alert('Failed to mark order as delivered');
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      alert('Failed to mark order as delivered. Please try again.');
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Cancel delivery
  const handleCancelDelivery = async (delivery) => {
    const reason = window.prompt(`Please provide a reason for canceling Order #${delivery.orderId}:`);
    
    if (!reason || reason.trim() === '') {
      alert('Cancellation reason is required');
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel Order #${delivery.orderId}?\n\nReason: ${reason}`)) {
      return;
    }

    try {
      setProcessingDelivery(delivery.id);
      
      // Call the cancelDelivery API
      const response = await deliveryService.cancelDelivery(delivery.orderId, reason);
      
      if (response) {
        alert('Delivery canceled successfully!');
        // Refresh the deliveries list
        await fetchDeliveries();
      } else {
        alert('Failed to cancel delivery');
      }
    } catch (error) {
      console.error('Error canceling delivery:', error);
      alert('Failed to cancel delivery. Please try again.');
    } finally {
      setProcessingDelivery(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-500';
      case 'PICKED_UP': return 'bg-yellow-500';
      case 'IN_TRANSIT': return 'bg-purple-500';
      case 'ARRIVED': return 'bg-orange-500';
      case 'DELIVERED': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'border-blue-300';
      case 'PICKED_UP': return 'border-yellow-300';
      case 'IN_TRANSIT': return 'border-purple-300';
      case 'ARRIVED': return 'border-orange-300';
      case 'DELIVERED': return 'border-green-300';
      default: return 'border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'Ready to Pick';
      case 'PICKED_UP': return 'Picked Up';
      case 'IN_TRANSIT': return 'In Transit';
      case 'ARRIVED': return 'Arrived';
      case 'DELIVERED': return 'Delivered';
      default: return status;
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cash on Delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `Rs.${parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading current deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Current Deliveries</h1>
              <p className="text-gray-600">Track and manage your active delivery orders</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 lg:mt-0">
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">
                  {deliveries.length}
                </div>
                <div className="text-xs text-blue-600">In Transit</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <div className="text-lg font-bold text-green-800">
                  {formatPrice(deliveries.reduce((sum, d) => sum + (d.deliveryFee || 0), 0))}
                </div>
                <div className="text-xs text-green-600">Total Fees</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                <div className="text-lg font-bold text-purple-800">
                  {formatPrice(deliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0))}
                </div>
                <div className="text-xs text-purple-600">Order Value</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-200">
                <div className="text-lg font-bold text-orange-800">
                  {formatPrice(deliveries.reduce((sum, d) => sum + (d.totalAmount || 0) + (d.deliveryFee || 0), 0))}
                </div>
                <div className="text-xs text-orange-600">To Collect</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Deliveries */}
        <div className="space-y-4">
          {deliveries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
              <p className="text-gray-600">You don't have any deliveries in progress right now.</p>
            </div>
          ) : (
            deliveries.map(delivery => (
              <div key={delivery.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${getBorderColor('SHIPPED')}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Order #{delivery.orderId}</h3>
                        <p className="text-gray-600">Quote #{delivery.id}</p>
                        <p className="text-sm text-gray-500">
                          Delivery Date: {formatDateTime(delivery.deliveryDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-full text-white font-semibold mb-2 ${getStatusColor('SHIPPED')} flex items-center space-x-2`}>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>In Transit</span>
                      </div>
                      {/* TOTAL PAYMENT DISPLAY */}
                      <div className="text-3xl font-bold text-blue-600">{formatPrice((delivery.totalAmount || 0) + (delivery.deliveryFee || 0))}</div>
                      <div className="text-sm text-gray-500">Total Payment</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Delivery: {formatPrice(delivery.deliveryFee || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* PAYMENT INFORMATION */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Payment Information
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-600">Order Total</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(delivery.totalAmount || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-600">Delivery Fee</p>
                        <p className="text-xl font-bold text-green-600">{formatPrice(delivery.deliveryFee || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-600">Total Payment</p>
                        <p className="text-xl font-bold text-blue-600">{formatPrice((delivery.totalAmount || 0) + (delivery.deliveryFee || 0))}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                        {delivery.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* DELIVERY INFO - Note: Detailed route info requires order details API */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Delivery Information
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <p className="text-gray-600 mb-2">View full order details including delivery address</p>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        onClick={() => window.location.href = `/delivery-person/orders/${delivery.orderId}`}
                      >
                        View Full Order Details
                      </button>
                    </div>
                  </div>

                  {/* ORDER DETAILS - Simplified for quote data */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Order Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-3 px-3 bg-white rounded border border-gray-200">
                        <span className="text-gray-700">Order Value:</span>
                        <span className="font-semibold text-gray-900">{formatPrice(delivery.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-3 bg-white rounded border border-gray-200">
                        <span className="text-gray-700">Delivery Fee:</span>
                        <span className="font-semibold text-green-600">{formatPrice(delivery.deliveryFee || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 px-3 bg-blue-100 rounded font-bold text-lg border-2 border-blue-300">
                        <span className="text-blue-900">Total to Collect:</span>
                        <span className="text-blue-900">{formatPrice((delivery.totalAmount || 0) + (delivery.deliveryFee || 0))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Simplified */}
                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleMarkAsDelivered(delivery)}
                      disabled={processingDelivery === delivery.id}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingDelivery === delivery.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Delivered
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleCancelDelivery(delivery)}
                      disabled={processingDelivery === delivery.id}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingDelivery === delivery.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Delivery
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentDeliveries;
