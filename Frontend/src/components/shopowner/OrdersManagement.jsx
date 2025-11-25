import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import DeliveredItems from './DeliveredItems';

const OrdersManagement = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('SHIPPED'); // Tab-based filtering
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchOrders = async () => {
    if (!token) {
      setError('Please log in to view orders');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders from backend...');
      // Fetch orders from backend
      const response = await apiService.get('/orders/my-orders');
      console.log('Orders fetched:', response);
      
      // Ensure we have an array
      const ordersArray = Array.isArray(response) ? response : [];
      setOrders(ordersArray);
      
      if (ordersArray.length === 0) {
        console.log('No orders found for this user');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatPrice = (price) => {
    return `Rs. ${parseFloat(price || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      'DELIVERY_PENDING': { color: 'bg-orange-100 text-orange-800', icon: '📦' },
      'ORDER_PENDING': { color: 'bg-blue-100 text-blue-800', icon: '📋' },
      'SHIPPED': { color: 'bg-purple-100 text-purple-800', icon: '🚚' },
      'DELIVERED': { color: 'bg-green-100 text-green-800', icon: '✓' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', icon: '✗' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: '○' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center ${statusInfo.color}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    const matchesTab = order.orderStatus === activeTab;
    const matchesSearch = !searchTerm || 
      order.id?.toString().includes(searchTerm);
    
    return matchesTab && matchesSearch;
  });

  // Calculate statistics for each tab
  const stats = {
    shipped: orders.filter(o => o.orderStatus === 'SHIPPED').length,
    deliveryPending: orders.filter(o => o.orderStatus === 'DELIVERY_PENDING').length,
    orderPending: orders.filter(o => o.orderStatus === 'ORDER_PENDING').length,
    delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    cancelled: orders.filter(o => o.orderStatus === 'CANCELLED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📦 Order Management</h1>
              <p className="text-blue-100">Track and manage all your orders in one place</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs for Order Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab('SHIPPED')}
                className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
                  activeTab === 'SHIPPED'
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🚚</span>
                  <span>Shipped</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'SHIPPED' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.shipped}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('DELIVERY_PENDING')}
                className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
                  activeTab === 'DELIVERY_PENDING'
                    ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📦</span>
                  <span>Delivery Pending</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'DELIVERY_PENDING' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.deliveryPending}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('ORDER_PENDING')}
                className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
                  activeTab === 'ORDER_PENDING'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📋</span>
                  <span>Processing</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'ORDER_PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.orderPending}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('DELIVERED')}
                className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
                  activeTab === 'DELIVERED'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">✓</span>
                  <span>Delivered (Review)</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'DELIVERED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.delivered}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('CANCELLED')}
                className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors ${
                  activeTab === 'CANCELLED'
                    ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">✗</span>
                  <span>Cancelled</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.cancelled}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Search Bar - Only show for non-DELIVERED tabs */}
          {activeTab !== 'DELIVERED' && (
            <div className="p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Delivered Items Component or Orders Table */}
        {activeTab === 'DELIVERED' ? (
          <DeliveredItems />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">\n            <div className="overflow-x-auto">\n              <table className="min-w-full divide-y divide-gray-200">\n                <thead className="bg-gray-50">\n                  <tr>\n                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                      Order ID\n                    </th>\n                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                      Date\n                    </th>\n                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                      Amount\n                    </th>\n                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                      Status\n                    </th>\n                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                      Actions\n                    </th>\n                  </tr>\n                </thead>\n                <tbody className="bg-white divide-y divide-gray-200">\n                  {filteredOrders.length === 0 ? (\n                    <tr>\n                      <td colSpan="5" className="px-6 py-12 text-center">\n                        <div className="text-gray-400">\n                          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />\n                          </svg>\n                          <p className="text-lg font-medium">No orders found</p>\n                          <p className="text-sm">\n                            {searchTerm \n                              ? 'Try adjusting your search term' \n                              : `No ${activeTab.toLowerCase().replace('_', ' ')} orders at the moment`}\n                          </p>\n                        </div>\n                      </td>\n                    </tr>\n                  ) : (\n                    filteredOrders.map((order) => (\n                      <tr key={order.id} className="hover:bg-gray-50 transition duration-150">\n                        <td className="px-6 py-4 whitespace-nowrap">\n                          <div className="text-sm font-medium text-blue-600">#{order.id}</div>\n                        </td>\n                        <td className="px-6 py-4 whitespace-nowrap">\n                          <div className="text-sm text-gray-900">{formatDate(order.orderDateTime)}</div>\n                        </td>\n                        <td className="px-6 py-4 whitespace-nowrap">\n                          <div className="text-sm font-bold text-gray-900">\n                            {formatPrice(order.totalAmount)}\n                          </div>\n                        </td>\n                        <td className="px-6 py-4 whitespace-nowrap">\n                          {getStatusBadge(order.orderStatus)}\n                        </td>\n                        <td className="px-6 py-4 whitespace-nowrap text-sm">\n                          <button\n                            onClick={() => setSelectedOrder(order)}\n                            className="text-blue-600 hover:text-blue-900 font-medium"\n                          >\n                            View Details\n                          </button>\n                        </td>\n                      </tr>\n                    ))\n                  )}\n                </tbody>\n              </table>\n            </div>\n          </div>\n        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">Order Details #{selectedOrder.id}</h2>
                    <p className="text-blue-100 mt-1">Order placed on {formatDate(selectedOrder.orderDateTime)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white hover:text-gray-200 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Items */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.length > 0 ? (
                      selectedOrder.orderItems.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.fish?.commonName || item.industrialStuff?.productName || 'Product'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} {item.fish?.unit || 'pcs'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Unit Price: {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No items found</p>
                    )}
                  </div>
                </div>

                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Delivery Person:</span>
                        <p className="font-medium">{selectedOrder.deliveryPerson?.name || 'Not assigned yet'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Delivery Address:</span>
                        <p className="font-medium">
                          {selectedOrder.addressStreet}, {selectedOrder.addressTown}, {selectedOrder.addressDistrict}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.orderItems?.map((item, idx) => {
                        const seller = item.fish?.user || item.industrialStuff?.user;
                        if (!seller) return null;
                        return (
                          <div key={idx} className="pb-2 border-b border-gray-200 last:border-0">
                            <p className="font-medium">{seller.name || 'N/A'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Status & Dates */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <p className="font-medium">{formatDate(selectedOrder.orderDateTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Date:</span>
                      <p className="font-medium">{selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedOrder.orderStatus)}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatPrice(selectedOrder.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedOrder.paymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
