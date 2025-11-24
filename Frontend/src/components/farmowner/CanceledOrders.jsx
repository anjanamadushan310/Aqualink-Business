import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const CanceledOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchCanceledOrders();
  }, []);

  const fetchCanceledOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/orders/seller-orders');
      
      // Filter only CANCELED orders
      const canceledOrders = response.filter(order => order.orderStatus === 'CANCELED');
      setOrders(canceledOrders);
    } catch (err) {
      console.error('Error fetching canceled orders:', err);
      setError('Failed to load canceled orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total for my products only
  const calculateMyProductsTotal = (order) => {
    if (!order.orderItems) return 0;
    
    return order.orderItems
      .filter(item => item.itemType === 'FISH')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    return order.id?.toString().includes(searchTerm) ||
      order.buyerUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.addressTown?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    totalLostRevenue: orders.reduce((sum, o) => sum + calculateMyProductsTotal(o), 0)
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading canceled orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Canceled Orders</h1>
          <p className="text-gray-600">View all canceled orders and lost revenue</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Canceled</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-3xl">✗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Lost Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalLostRevenue)}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, or Town..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching orders found' : 'No canceled orders'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'You have no canceled orders'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      My Products Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canceled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.buyerUser?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.buyerUser?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.addressTown || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.addressDistrict || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(calculateMyProductsTotal(order))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Order Details #{selectedOrder.id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedOrder.buyerUser?.name || 'N/A'}</span></p>
                    <p><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedOrder.buyerUser?.email || 'N/A'}</span></p>
                    <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedOrder.buyerUser?.contact || 'N/A'}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Street:</span> <span className="font-medium">{selectedOrder.addressStreet || 'N/A'}</span></p>
                    <p><span className="text-gray-600">Town:</span> <span className="font-medium">{selectedOrder.addressTown || 'N/A'}</span></p>
                    <p><span className="text-gray-600">District:</span> <span className="font-medium">{selectedOrder.addressDistrict || 'N/A'}</span></p>
                    <p><span className="text-gray-600">Postal Code:</span> <span className="font-medium">{selectedOrder.addressPostalCode || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">My Products (Fish)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.orderItems
                        ?.filter(item => item.itemType === 'FISH')
                        .map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.fish?.commonName || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.quantity} {item.fish?.unit || 'pcs'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          My Products Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(calculateMyProductsTotal(selectedOrder))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(selectedOrder.orderDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      ✗ CANCELED
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedOrder.paymentMethod || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanceledOrders;
