import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

const FarmOwnerOrderManagement = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ORDER_PENDING'); // Tab for filtering
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch seller orders from backend
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
      
      console.log('Fetching seller orders from backend...');
      // Fetch orders where this user is the seller (product owner)
      const response = await apiService.get('/orders/seller-orders');
      console.log('Seller orders fetched:', response);
      
      // Ensure we have an array
      const ordersArray = Array.isArray(response) ? response : [];
      setOrders(ordersArray);
      
      if (ordersArray.length === 0) {
        console.log('No orders found for this seller');
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
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
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'DELIVERY_PENDING': { color: 'bg-orange-100 text-orange-800', icon: '📦' },
      'ORDER_PENDING': { color: 'bg-blue-100 text-blue-800', icon: '🔵' },
      'SHIPPED': { color: 'bg-purple-100 text-purple-800', icon: '🚚' },
      'DELIVERED': { color: 'bg-green-100 text-green-800', icon: '✓' },
      'CANCELED': { color: 'bg-red-100 text-red-800', icon: '✗' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: '○' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center ${statusInfo.color}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  // Calculate my products total in order
  const calculateMyProductsTotal = (order) => {
    if (!order.orderItems || !user) return 0;
    
    return order.orderItems
      .filter(item => item.product?.user?.id === user.id)
      .reduce((sum, item) => sum + parseFloat(item.price * item.quantity || 0), 0);
  };

  // Get my products from order
  const getMyProducts = (order) => {
    if (!order.orderItems || !user) return [];
    
    return order.orderItems.filter(item => item.product?.user?.id === user.id);
  };

  // Filter orders based on active tab
  const filteredOrders = orders
    .filter(order => {
      // Filter by active tab
      const matchesTab = order.orderStatus === activeTab;
      
      // Filter by search term
      const matchesSearch = !searchTerm || 
        order.id?.toString().includes(searchTerm) ||
        order.buyerUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.addressTown?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });

  // Calculate statistics for each tab
  const stats = {
    orderPending: orders.filter(o => o.orderStatus === 'ORDER_PENDING').length,
    deliveryPending: orders.filter(o => o.orderStatus === 'DELIVERY_PENDING').length,
    shipped: orders.filter(o => o.orderStatus === 'SHIPPED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your orders...</p>
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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🐟 My Sales Orders</h1>
              <p className="text-green-100">Manage orders for your fish products</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium transition duration-200 flex items-center"
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
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('ORDER_PENDING')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === 'ORDER_PENDING'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📋</span>
                  <span>Orders to Ship</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'ORDER_PENDING' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.orderPending}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('DELIVERY_PENDING')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
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
                onClick={() => setActiveTab('SHIPPED')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === 'SHIPPED'
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🚚</span>
                  <span>Shipped Orders</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'SHIPPED' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stats.shipped}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, or Location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    My Products
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    My Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">
                          {searchTerm 
                            ? 'Try adjusting your search term' 
                            : `No ${activeTab.toLowerCase().replace('_', ' ')} orders at the moment`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const myProducts = getMyProducts(order);
                    const myTotal = calculateMyProductsTotal(order);
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">#{order.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold">
                                {order.buyerUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {order.buyerUser?.name || 'Unknown Customer'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.addressTown || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.orderDateTime)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {myProducts.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                {item.product?.name} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatPrice(myTotal)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.orderStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">Order Details #{selectedOrder.id}</h2>
                    <p className="text-green-100 mt-1">Order placed on {formatDate(selectedOrder.orderDateTime)}</p>
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
                {/* Customer Information */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedOrder.buyerUser?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedOrder.buyerUser?.email || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Delivery Address:</span>
                      <p className="font-medium">
                        {selectedOrder.addressPlace}, {selectedOrder.addressStreet}, {selectedOrder.addressTown}, {selectedOrder.addressDistrict}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Status</h3>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedOrder.orderStatus)}
                    <span className="text-sm text-gray-600">
                      Last updated: {formatDate(selectedOrder.orderDateTime)}
                    </span>
                  </div>
                </div>

                {/* My Products in Order */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    My Products in This Order
                  </h3>
                  <div className="space-y-3">
                    {getMyProducts(selectedOrder).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product?.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 border-green-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">My Total Revenue:</span>
                        <span className="font-bold text-xl text-green-600">
                          {formatPrice(calculateMyProductsTotal(selectedOrder))}
                        </span>
                      </div>
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

export default FarmOwnerOrderManagement;
