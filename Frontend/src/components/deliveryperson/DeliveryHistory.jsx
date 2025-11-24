import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';
import { useAuth } from '../../context/AuthContext';

const DeliveryHistory = () => {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [cancelledDeliveries, setCancelledDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('delivered'); // 'delivered' or 'cancelled'

  // Fetch delivery history from backend
  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      if (!token) {
        setError('Please log in to view delivery history');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch quotes and filter for DELIVERED and CANCELED orders
        const response = await deliveryService.getMyQuotes();
        
        if (response.success && response.data) {
          // Filter for delivered orders
          const deliveredOrders = response.data.filter(q => 
            q.status === 'ACCEPTED' && 
            q.orderStatus === 'DELIVERED'
          );
          
          // Filter for cancelled orders
          const cancelledOrders = response.data.filter(q => 
            q.status === 'ACCEPTED' && 
            q.orderStatus === 'CANCELED'
          );
          
          setDeliveries(deliveredOrders);
          setCancelledDeliveries(cancelledOrders);
        } else {
          setError(response.message || 'Failed to fetch delivery history');
          setDeliveries([]);
          setCancelledDeliveries([]);
        }
      } catch (err) {
        console.error('Error fetching delivery history:', err);
        setError('Failed to load delivery history. Please try again.');
        setDeliveries([]);
        setCancelledDeliveries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryHistory();
  }, [token]);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, cancelledDeliveries, dateFilter, searchTerm, activeTab]);

  const filterDeliveries = () => {
    const sourceData = activeTab === 'delivered' ? deliveries : cancelledDeliveries;
    let filtered = [...sourceData];

    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(delivery => 
            new Date(delivery.deliveryDate).toDateString() === today.toDateString()
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(delivery => 
            new Date(delivery.deliveryDate) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(delivery => 
            new Date(delivery.deliveryDate) >= filterDate
          );
          break;
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (delivery.cancellationReason && delivery.cancellationReason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort by delivery date (most recent first)
    filtered.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));
    setFilteredDeliveries(filtered);
  };

  const handleViewDetails = async (delivery) => {
    try {
      const response = await deliveryService.getOrderDetailsForDelivery(delivery.orderId);
      if (response.success) {
        setSelectedDelivery(response.data);
        setShowDetailsModal(true);
      } else {
        alert('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'RETURNED': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'border-green-300';
      case 'CANCELLED': return 'border-red-300';
      case 'RETURNED': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery History</h1>
              <p className="text-gray-600">Track and review your completed and cancelled deliveries</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 lg:mt-0">
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <div className="text-2xl font-bold text-green-800">{deliveries.length}</div>
                <div className="text-xs text-green-600">Delivered</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                <div className="text-2xl font-bold text-red-800">{cancelledDeliveries.length}</div>
                <div className="text-xs text-red-600">Cancelled</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{deliveries.length + cancelledDeliveries.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('delivered')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'delivered'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Delivered Orders ({deliveries.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'cancelled'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancelled Orders ({cancelledDeliveries.length})</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'cancelled' ? "Search by order ID or cancellation reason..." : "Search by order ID..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFilter('');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">{activeTab === 'delivered' ? '🚚' : '❌'}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'delivered' ? 'No delivered orders found' : 'No cancelled orders found'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || dateFilter 
                  ? 'Try adjusting your filters to see more results.' 
                  : activeTab === 'delivered' 
                    ? 'Your completed deliveries will appear here.'
                    : 'Your cancelled deliveries will appear here.'
                }
              </p>
            </div>
          ) : (
            filteredDeliveries.map(delivery => (
              <div 
                key={delivery.id} 
                className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                  activeTab === 'delivered' ? 'border-green-300' : 'border-red-300'
                }`}
              >
                <div className={`p-6 border-b border-gray-200 ${
                  activeTab === 'delivered' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-r from-red-50 to-rose-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        activeTab === 'delivered' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {activeTab === 'delivered' ? (
                          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Order #{delivery.orderId}</h3>
                        <p className="text-gray-600">Quote #{delivery.id}</p>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'delivered' 
                            ? `Delivered: ${formatDateTime(delivery.deliveryDate)}`
                            : `Cancelled: ${formatDateTime(delivery.cancelledDateTime || delivery.deliveryDate)}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-full text-white font-semibold mb-2 ${
                        activeTab === 'delivered' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {activeTab === 'delivered' ? 'DELIVERED' : 'CANCELLED'}
                      </div>
                      <div className={`text-2xl font-bold ${
                        activeTab === 'delivered' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPrice(delivery.deliveryFee || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {activeTab === 'delivered' ? 'Your Earning' : 'Lost Earning'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Cancellation Reason - Only show for cancelled orders */}
                  {activeTab === 'cancelled' && delivery.cancellationReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-red-900 mb-1">Cancellation Reason:</p>
                          <p className="text-red-800">{delivery.cancellationReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Order Total</p>
                      <p className="text-lg font-semibold text-gray-900">{formatPrice(delivery.totalAmount || 0)}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${
                      activeTab === 'delivered' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-sm ${
                        activeTab === 'delivered' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {activeTab === 'delivered' ? 'Your Earning' : 'Lost Earning'}
                      </p>
                      <p className={`text-lg font-semibold ${
                        activeTab === 'delivered' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatPrice(delivery.deliveryFee || 0)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(delivery)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition duration-200 flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Full Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Details Modal - Same as ApprovedQuotes */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Delivered Order Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Order Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-700"><span className="font-semibold">Order ID:</span> #{selectedDelivery.orderId}</p>
                  <p className="text-gray-700"><span className="font-semibold">Order Date:</span> {formatDateTime(selectedDelivery.orderDateTime)}</p>
                  <p className="text-gray-700"><span className="font-semibold">Status:</span> <span className="text-green-600 font-semibold">Delivered</span></p>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedDelivery.customerName}</p>
                  <p className="text-gray-700"><span className="font-semibold">Email:</span> {selectedDelivery.customerEmail}</p>
                  <p className="text-gray-700"><span className="font-semibold">Phone:</span> {selectedDelivery.customerPhone}</p>
                </div>
              </div>

              {/* Seller Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Seller Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedDelivery.sellerName}</p>
                  <p className="text-gray-700"><span className="font-semibold">Email:</span> {selectedDelivery.sellerEmail}</p>
                  <p className="text-gray-700"><span className="font-semibold">Phone:</span> {selectedDelivery.sellerPhone}</p>
                  <p className="text-gray-700"><span className="font-semibold">Address:</span> {selectedDelivery.sellerAddress}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Order Items
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedDelivery.products && selectedDelivery.products.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDelivery.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatPrice(product.price * product.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No product details available</p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Summary
                </h3>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Order Total:</span>
                      <span className="font-semibold">{formatPrice(selectedDelivery.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Your Earning (Delivery Fee):</span>
                      <span className="font-semibold text-green-600">{formatPrice(selectedDelivery.deliveryFee || 0)}</span>
                    </div>
                    <div className="border-t border-green-300 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total Amount:</span>
                        <span>{formatPrice((selectedDelivery.totalAmount || 0) + (selectedDelivery.deliveryFee || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition duration-200"
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

export default DeliveryHistory;
