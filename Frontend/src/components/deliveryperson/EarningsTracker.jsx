import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const EarningsTracker = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch accepted quotes from backend
      const quotes = await apiService.get('/delivery-quotes/my-quotes');
      
      // Filter only ACCEPTED quotes and map to earnings format
      const acceptedQuotes = quotes
        .filter(quote => quote.quoteStatus === 'ACCEPTED')
        .map(quote => ({
          id: quote.quoteId,
          orderId: quote.orderId || 'N/A',
          date: quote.deliveryDate,
          customerName: quote.customerName || 'N/A',
          orderTotal: quote.orderTotal || 0,
          deliveryFee: quote.deliveryFee,
          totalPayment: (quote.orderTotal || 0) + quote.deliveryFee,
          paymentMethod: quote.paymentMethod || 'Cash on Delivery',
          pickupLocation: quote.pickupLocation || 'N/A',
          deliveryLocation: quote.deliveryLocation || 'N/A',
          status: 'COLLECTED',
          paymentDate: quote.acceptedAt || quote.deliveryDate,
          collectionNotes: quote.notes || ''
        }));
      
      setEarnings(acceptedQuotes);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const filterEarnings = () => {
    let filtered = [...earnings];

    // Date filter
    if (selectedDateRange !== 'all') {
      const today = new Date();
      const startDate = new Date(today);
      
      switch (selectedDateRange) {
        case 'today':
          filtered = filtered.filter(earning => 
            new Date(earning.date).toDateString() === today.toDateString()
          );
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(earning => 
            new Date(earning.date) >= startDate
          );
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(earning => 
            new Date(earning.date) >= startDate
          );
          break;
      }
    }

    // Payment method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(earning => 
        earning.paymentMethod === filterPaymentMethod
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(earning =>
        earning.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        earning.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        earning.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return filtered;
  };

  const formatPrice = (price) => {
    return `Rs.${parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cash on Delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEarnings = filterEarnings();
  const totalEarningsDeliveryFee = filteredEarnings.reduce((sum, earning) => sum + earning.deliveryFee, 0);
  const totalCollectedAmount = filteredEarnings.filter(e => e.paymentMethod === 'Cash on Delivery').reduce((sum, earning) => sum + earning.totalPayment, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Earnings</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={fetchEarnings}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition duration-200"
          >
            Retry
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Tracker</h1>
              <p className="text-gray-600">Track your delivery earnings and payment collections</p>
            </div>
            
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 lg:mt-0">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{formatPrice(totalEarningsDeliveryFee)}</div>
                  <div className="text-sm text-green-600">My Delivery Earnings</div>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">{formatPrice(totalCollectedAmount)}</div>
                  <div className="text-sm text-orange-600">Cash Collected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by order ID, customer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Paid">Pre-paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDateRange('all');
                  setFilterPaymentMethod('all');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Earnings List */}
        <div className="space-y-4">
          {filteredEarnings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No earnings found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedDateRange !== 'all' || filterPaymentMethod !== 'all'
                  ? 'Try adjusting your filters to see more results.' 
                  : 'Your delivery earnings will appear here.'
                }
              </p>
            </div>
          ) : (
            filteredEarnings.map(earning => (
              <div key={earning.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-xl">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Order #{earning.orderId}</h3>
                        <p className="text-gray-600">{earning.customerName}</p>
                        <p className="text-sm text-gray-500">
                          Delivered: {formatDate(earning.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Collected: {formatDateTime(earning.paymentDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(earning.deliveryFee)}</div>
                      <div className="text-sm text-gray-600">My Earnings</div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium mt-2 border ${getPaymentMethodColor(earning.paymentMethod)}`}>
                        {earning.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* PAYMENT BREAKDOWN */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Payment Breakdown
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-600">Order Value</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(earning.orderTotal)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-sm text-gray-600">My Delivery Fee</p>
                        <p className="text-xl font-bold text-green-600">{formatPrice(earning.deliveryFee)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-gray-600">
                          {earning.paymentMethod === 'Cash on Delivery' ? 'Total Collected' : 'Total Order Value'}
                        </p>
                        <p className="text-xl font-bold text-blue-600">{formatPrice(earning.totalPayment)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Delivery Route
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-medium text-gray-900">{earning.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-medium text-gray-900">{earning.deliveryLocation}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Notes */}
                  {earning.collectionNotes && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Collection Notes
                      </h4>
                      <p className="text-gray-800">{earning.collectionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsTracker;
