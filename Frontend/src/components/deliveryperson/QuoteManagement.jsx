import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';

const QuoteManagement = () => {
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Edit modal states
  const [editingQuote, setEditingQuote] = useState(null);
  const [editFormData, setEditFormData] = useState({
    deliveryFee: '',
    deliveryDate: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Fetch delivery person's quotes from API
  useEffect(() => {
    fetchMyQuotes();
  }, []);

  const fetchMyQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deliveryService.getMyQuotes();
      
      if (response.success && response.data) {
        console.log('Fetched quotes:', response.data);
        // Filter out ACCEPTED quotes - they belong in Approved Quotes page
        const nonAcceptedQuotes = response.data.filter(q => q.status !== 'ACCEPTED');
        setQuotes(nonAcceptedQuotes);
      } else {
        setError(response.message || 'Failed to fetch quotes');
        setQuotes([]);
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load quotes. Please try again later.');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (quote) => {
    setEditingQuote(quote);
    setEditFormData({
      deliveryFee: quote.deliveryFee.toString(),
      deliveryDate: quote.deliveryDate
    });
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingQuote(null);
    setEditFormData({ deliveryFee: '', deliveryDate: '' });
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const response = await deliveryService.updateQuote(editingQuote.id, {
        deliveryFee: parseFloat(editFormData.deliveryFee),
        deliveryDate: editFormData.deliveryDate
      });

      if (response.success) {
        // Refresh the quotes list
        await fetchMyQuotes();
        handleEditCancel();
        alert('Quote updated successfully!');
      } else {
        setEditError(response.message || 'Failed to update quote');
      }
    } catch (err) {
      console.error('Error updating quote:', err);
      setEditError('Failed to update quote. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Rs.0.00';
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return `Rs.${numPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'ACCEPTED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'EXPIRED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600';
      case 'ACCEPTED': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      case 'EXPIRED': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'PENDING': return 'border-yellow-300';
      case 'ACCEPTED': return 'border-green-300';
      case 'REJECTED': return 'border-red-300';
      case 'EXPIRED': return 'border-gray-300';
      default: return 'border-blue-300';
    }
  };

  const isValidityExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date() > new Date(validUntil);
  };

  const filteredQuotes = quotes
    .filter(quote => {
      const matchesStatus = filterStatus === 'all' || quote.status?.toLowerCase() === filterStatus.toLowerCase();
      const matchesSearch = !searchTerm || 
        quote.orderId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.id?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    })
    // Sort by priority: PENDING first (most recent), then REJECTED, then EXPIRED
    .sort((a, b) => {
      const statusPriority = { 'PENDING': 1, 'REJECTED': 2, 'EXPIRED': 3 };
      const priorityDiff = (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same status, show most recent first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Quotes</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMyQuotes}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
              <p className="text-gray-600">Track your pending, rejected, and expired delivery quotes</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 lg:mt-0">
              <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-800">
                  {quotes.filter(q => q.status === 'PENDING').length}
                </div>
                <div className="text-xs text-yellow-600">Pending</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                <div className="text-2xl font-bold text-red-800">
                  {quotes.filter(q => q.status === 'REJECTED').length}
                </div>
                <div className="text-xs text-red-600">Rejected</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {quotes.filter(q => q.status === 'EXPIRED').length}
                </div>
                <div className="text-xs text-gray-600">Expired</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by order ID or quote ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Quotes</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Priority Notice for Pending Quotes */}
        {quotes.filter(q => q.status === 'PENDING').length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">
                  {quotes.filter(q => q.status === 'PENDING').length} Pending Quote(s) - Action Required
                </h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Pending quotes are shown first. Review them before they expire.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quotes */}
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'Your quotes will appear here. Pending quotes are prioritized at the top.'
                }
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote, index) => (
              <div key={quote.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${getBorderColor(quote.status)} ${
                quote.status === 'PENDING' ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
              }`}>
                {/* Priority Badge for Pending Quotes */}
                {quote.status === 'PENDING' && (
                  <div className="bg-yellow-500 text-white px-4 py-1 text-xs font-semibold flex items-center justify-between">
                    <span>⚠️ PENDING - Priority #{index + 1}</span>
                    <span>Expires: {formatDateTime(quote.validUntil)}</span>
                  </div>
                )}
                
                {/* Header */}
                <div className={`p-6 border-b border-gray-200 ${
                  quote.status === 'PENDING' 
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50' 
                    : quote.status === 'REJECTED'
                      ? 'bg-gradient-to-r from-red-50 to-rose-50'
                      : 'bg-gradient-to-r from-gray-50 to-slate-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        quote.status === 'PENDING' 
                          ? 'bg-yellow-100' 
                          : quote.status === 'REJECTED'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                      }`}>
                        <svg className={`h-8 w-8 ${
                          quote.status === 'PENDING' 
                            ? 'text-yellow-600' 
                            : quote.status === 'REJECTED'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Quote #{quote.id}</h3>
                        <p className="text-gray-600">Order #{quote.orderId}</p>
                        <p className="text-sm text-gray-500">
                          Order Status: <span className="font-medium">{quote.orderStatus}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-full text-white font-semibold mb-2 ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </div>
                      <div className="text-2xl font-bold text-green-600">{formatPrice(quote.deliveryFee)}</div>
                      <div className="text-sm text-gray-600">Delivery Fee</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Quote Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Quote Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-blue-700">Delivery Fee:</span> <span className="font-medium">{formatPrice(quote.deliveryFee)}</span></p>
                        <p><span className="text-blue-700">Order Value:</span> <span className="font-medium">{formatPrice(quote.totalAmount)}</span></p>
                        <p><span className="text-blue-700">Delivery Date:</span> <span className="font-medium">{formatDate(quote.deliveryDate)}</span></p>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Order Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-green-700">Order ID:</span> <span className="font-medium">#{quote.orderId}</span></p>
                        <p><span className="text-green-700">Order Status:</span> <span className="font-medium">{quote.orderStatus}</span></p>
                        <p><span className="text-green-700">Total Amount:</span> <span className="font-medium">{formatPrice(quote.totalAmount)}</span></p>
                      </div>
                    </div>

                    <div className={`rounded-lg p-4 border ${
                      quote.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                      quote.status === 'ACCEPTED' ? 'bg-green-50 border-green-200' :
                      quote.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-semibold mb-2 ${
                        quote.status === 'PENDING' ? 'text-yellow-900' :
                        quote.status === 'ACCEPTED' ? 'text-green-900' :
                        quote.status === 'REJECTED' ? 'text-red-900' :
                        'text-gray-900'
                      }`}>Status Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className={getStatusTextColor(quote.status)}>Quote Status:</span> <span className="font-medium">{quote.status}</span></p>
                        <p><span className="text-gray-700">Quote ID:</span> <span className="font-medium">#{quote.id}</span></p>
                        {quote.status === 'ACCEPTED' && (
                          <p className="text-green-700 font-medium mt-2">✓ Quote Accepted!</p>
                        )}
                        {quote.status === 'REJECTED' && (
                          <p className="text-red-700 font-medium mt-2">✗ Quote Declined</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Button for Pending Quotes */}
                  {quote.status === 'PENDING' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleEditClick(quote)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2 font-medium shadow-md hover:shadow-lg"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Quote</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Edit Quote Modal */}
      {editingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Edit Quote</h2>
                  <p className="text-blue-100 text-sm mt-1">Quote #{editingQuote.id} • Order #{editingQuote.orderId}</p>
                </div>
                <button
                  onClick={handleEditCancel}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Fee (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editFormData.deliveryFee}
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryFee: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter delivery fee"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={editFormData.deliveryDate}
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {editLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Quote</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteManagement;
