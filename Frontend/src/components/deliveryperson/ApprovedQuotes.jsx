import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';

const ApprovedQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedQuotes, setGroupedQuotes] = useState({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [startingDelivery, setStartingDelivery] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchApprovedQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deliveryService.getMyQuotes();
      
      if (response.success && response.data) {
        // Filter only accepted quotes that are NOT yet shipped, delivered, or canceled
        // SHIPPED and DELIVERED orders should appear in current deliveries page
        // CANCELED orders should appear in cancelled deliveries page
        const acceptedQuotes = response.data.filter(q => 
          q.status === 'ACCEPTED' && 
          q.orderStatus !== 'SHIPPED' && 
          q.orderStatus !== 'DELIVERED' &&
          q.orderStatus !== 'CANCELED'
        );
        setQuotes(acceptedQuotes);
        
        // Group quotes by delivery date
        const grouped = groupQuotesByDate(acceptedQuotes);
        setGroupedQuotes(grouped);
        
        // Auto-select first date if available
        const dates = Object.keys(grouped).sort();
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } else {
        setError(response.message || 'Failed to fetch approved quotes');
        setQuotes([]);
      }
    } catch (err) {
      console.error('Error fetching approved quotes:', err);
      setError('Failed to load approved quotes. Please try again later.');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const groupQuotesByDate = (quotesArray) => {
    const grouped = {};
    
    quotesArray.forEach(quote => {
      if (quote.deliveryDate) {
        // Extract just the date part (YYYY-MM-DD)
        const dateStr = quote.deliveryDate.split('T')[0];
        
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(quote);
      }
    });
    
    return grouped;
  };

  useEffect(() => {
    fetchApprovedQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (price) => {
    if (!price) return 'Rs.0.00';
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return `Rs.${numPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isToday = (dateString) => {
    const today = new Date();
    const compareDate = new Date(dateString);
    return today.toDateString() === compareDate.toDateString();
  };

  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const compareDate = new Date(dateString);
    return tomorrow.toDateString() === compareDate.toDateString();
  };

  const getDateLabel = (dateString) => {
    if (isToday(dateString)) return 'Today';
    if (isTomorrow(dateString)) return 'Tomorrow';
    return getDayOfWeek(dateString);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingOrderDetails(true);
      
      // Use the new delivery-person-specific endpoint
      const response = await deliveryService.getOrderDetailsForDelivery(orderId);
      
      if (response.success && response.data) {
        // Convert the response to match our expected format
        const orderData = {
          id: response.data.orderId,
          totalAmount: response.data.subtotal,
          orderStatus: response.data.orderStatus,
          orderDateTime: response.data.orderDateTime,
          buyerUser: {
            name: response.data.customerName || 'Customer',
            email: response.data.customerEmail || 'N/A',
            phoneNumber: response.data.customerPhone || 'N/A'
          },
          sellerName: response.data.sellerName,
          sellerEmail: response.data.sellerEmail,
          sellerPhone: response.data.sellerPhone,
          sellerAddress: response.data.sellerAddress,
          addressPlace: response.data.deliveryAddress?.place || 'N/A',
          addressStreet: response.data.deliveryAddress?.street || 'N/A',
          addressTown: response.data.deliveryAddress?.town || 'N/A',
          addressDistrict: response.data.deliveryAddress?.district || 'N/A',
          orderItems: response.data.items?.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            productType: item.productType
          })) || []
        };
        
        setSelectedOrderDetails(orderData);
        setShowDetailsModal(true);
      } else {
        setError(response.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrderDetails(null);
    setSuccessMessage(null);
  };

  const handleStartDelivery = async (orderId) => {
    try {
      setStartingDelivery(true);
      setError(null);
      
      const response = await deliveryService.startDelivery(orderId);
      
      if (response) {
        setSuccessMessage('Delivery started successfully! Order status updated.');
        
        // Update the order status in the selected order details
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            orderStatus: 'SHIPPED'
          });
        }
        
        // Optionally refresh the quotes list
        setTimeout(() => {
          setSuccessMessage(null);
          closeDetailsModal();
          fetchApprovedQuotes();
        }, 2000);
      }
    } catch (err) {
      console.error('Error starting delivery:', err);
      setError(err.message || 'Failed to start delivery. Please try again.');
    } finally {
      setStartingDelivery(false);
    }
  };

  const selectedQuotes = selectedDate ? (groupedQuotes[selectedDate] || []) : [];
  const totalEarningsForDate = selectedQuotes.reduce(
    (sum, q) => sum + (parseFloat(q.deliveryFee) || 0), 
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approved quotes...</p>
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
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Approved Quotes</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchApprovedQuotes}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Approved Quotes Yet</h3>
            <p className="text-gray-600">
              You don't have any accepted delivery quotes at the moment. 
              Once customers accept your quotes, they will appear here organized by delivery date.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Approved Deliveries</h1>
              <p className="text-green-100">View your scheduled deliveries organized by date</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 lg:mt-0">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">{quotes.length}</div>
                <div className="text-sm text-green-100">Total Approved</div>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">{Object.keys(groupedQuotes).length}</div>
                <div className="text-sm text-green-100">Delivery Days</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Date List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Delivery Dates
              </h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {Object.keys(groupedQuotes).sort().map(date => {
                  const quotesForDate = groupedQuotes[date];
                  const isSelected = selectedDate === date;
                  const dateLabel = getDateLabel(date);
                  
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`text-xs font-medium mb-1 ${
                            isSelected ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {dateLabel}
                          </div>
                          <div className="font-semibold">{formatDateShort(date)}</div>
                        </div>
                        <div className={`text-center px-3 py-1 rounded-full ${
                          isSelected 
                            ? 'bg-white bg-opacity-25' 
                            : 'bg-blue-100'
                        }`}>
                          <div className={`text-lg font-bold ${
                            isSelected ? 'text-white' : 'text-blue-700'
                          }`}>
                            {quotesForDate.length}
                          </div>
                          <div className={`text-xs ${
                            isSelected ? 'text-blue-100' : 'text-blue-600'
                          }`}>
                            {quotesForDate.length === 1 ? 'delivery' : 'deliveries'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Content - Deliveries for Selected Date */}
          <div className="lg:col-span-2">
            {selectedDate && (
              <div className="space-y-4">
                {/* Date Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{getDateLabel(selectedDate)}</div>
                      <h2 className="text-2xl font-bold text-gray-900">{formatDate(selectedDate)}</h2>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <div className="text-sm text-gray-500">Total Earnings</div>
                      <div className="text-2xl font-bold text-green-600">{formatPrice(totalEarningsForDate)}</div>
                    </div>
                  </div>
                </div>

                {/* Deliveries List */}
                <div className="space-y-4">
                  {selectedQuotes.map((quote, index) => (
                    <div 
                      key={quote.id} 
                      className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 border-b border-green-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Order #{quote.orderId}</h3>
                              <p className="text-sm text-gray-600">Quote ID: #{quote.id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{formatPrice(quote.deliveryFee)}</div>
                            <div className="text-xs text-gray-500">Delivery Fee</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <div>
                                <div className="text-xs text-gray-500">Order Value</div>
                                <div className="font-semibold text-gray-900">{formatPrice(quote.totalAmount)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <div className="text-xs text-gray-500">Order Status</div>
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                    quote.orderStatus === 'SHIPPED' || quote.orderStatus === 'DELIVERED' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {quote.orderStatus === 'SHIPPED' && (
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                                      </svg>
                                    )}
                                    {quote.orderStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approved
                            </span>
                            <button 
                              onClick={() => fetchOrderDetails(quote.orderId)}
                              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedQuotes.length} {selectedQuotes.length === 1 ? 'Delivery' : 'Deliveries'} Scheduled
                      </h3>
                      <p className="text-sm text-gray-600">for {formatDate(selectedDate)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expected Earnings</div>
                      <div className="text-3xl font-bold text-green-600">{formatPrice(totalEarningsForDate)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {loadingOrderDetails ? (
              <div className="bg-white rounded-lg shadow-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading order details...</p>
              </div>
            ) : selectedOrderDetails ? (
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg z-10">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Order Details</h2>
                    <p className="text-blue-100">Order #{selectedOrderDetails.id}</p>
                    {(selectedOrderDetails.orderStatus === 'SHIPPED' || selectedOrderDetails.orderStatus === 'DELIVERED') && (
                      <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                        </svg>
                        {selectedOrderDetails.orderStatus === 'DELIVERED' ? 'Delivered' : 'Delivery In Progress'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeDetailsModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Order ID</div>
                    <div className="text-xl font-bold text-gray-900">#{selectedOrderDetails.id}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm text-green-600 mb-1">Total Amount</div>
                    <div className="text-xl font-bold text-gray-900">{formatPrice(selectedOrderDetails.totalAmount)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-sm text-purple-600 mb-1">Order Status</div>
                    <div className="text-xl font-bold text-gray-900">{selectedOrderDetails.orderStatus}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-semibold text-gray-900">{selectedOrderDetails.buyerUser?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-semibold text-gray-900">{selectedOrderDetails.buyerUser?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-semibold text-gray-900">{selectedOrderDetails.buyerUser?.phoneNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Order Date</div>
                      <div className="font-semibold text-gray-900">{formatDateTime(selectedOrderDetails.orderDateTime)}</div>
                    </div>
                  </div>
                </div>

                {/* Seller Information */}
                {(selectedOrderDetails.sellerName || selectedOrderDetails.sellerEmail || selectedOrderDetails.sellerPhone) && (
                  <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Seller Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrderDetails.sellerName && (
                        <div>
                          <div className="text-sm text-gray-500">Name</div>
                          <div className="font-semibold text-gray-900">{selectedOrderDetails.sellerName}</div>
                        </div>
                      )}
                      {selectedOrderDetails.sellerEmail && (
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-semibold text-gray-900">{selectedOrderDetails.sellerEmail}</div>
                        </div>
                      )}
                      {selectedOrderDetails.sellerPhone && (
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-semibold text-gray-900">{selectedOrderDetails.sellerPhone}</div>
                        </div>
                      )}
                      {selectedOrderDetails.sellerAddress && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-gray-500">Address</div>
                          <div className="font-semibold text-gray-900">{selectedOrderDetails.sellerAddress}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address
                  </h3>
                  <div className="bg-white rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedOrderDetails.addressPlace && (
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <div className="text-sm text-gray-500">Place</div>
                            <div className="font-semibold text-gray-900">{selectedOrderDetails.addressPlace}</div>
                          </div>
                        </div>
                      )}
                      {selectedOrderDetails.addressStreet && (
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <div>
                            <div className="text-sm text-gray-500">Street</div>
                            <div className="font-semibold text-gray-900">{selectedOrderDetails.addressStreet}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Town & District</div>
                          <div className="font-semibold text-gray-900">
                            {selectedOrderDetails.addressTown}, {selectedOrderDetails.addressDistrict}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Full Address Display */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">Complete Address</div>
                      <div className="font-medium text-gray-900 text-lg">
                        {[
                          selectedOrderDetails.addressPlace,
                          selectedOrderDetails.addressStreet,
                          selectedOrderDetails.addressTown,
                          selectedOrderDetails.addressDistrict
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order Items ({selectedOrderDetails.orderItems?.length || 0})
                    </h3>
                  </div>
                  <div className="p-4">
                    {selectedOrderDetails.orderItems && selectedOrderDetails.orderItems.length > 0 ? (
                      <div className="space-y-3">
                        {selectedOrderDetails.orderItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{item.productName || 'Product'}</div>
                                  <div className="text-sm text-gray-500">
                                    Quantity: <span className="font-medium text-gray-700">{item.quantity}</span>
                                    {item.productType && (
                                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        {item.productType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-gray-900 text-lg">{formatPrice(item.price * item.quantity)}</div>
                              <div className="text-sm text-gray-500">{formatPrice(item.price)} each</div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-300">
                          <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <span className="text-lg font-bold text-gray-900">Order Total</span>
                            <span className="text-2xl font-bold text-blue-600">{formatPrice(selectedOrderDetails.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No order items found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Quote Information */}
                {quotes.find(q => q.orderId === selectedOrderDetails.id) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your Approved Quote
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-500">Quote ID</div>
                        <div className="text-lg font-bold text-gray-900">
                          #{quotes.find(q => q.orderId === selectedOrderDetails.id).id}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-500">Delivery Fee</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(quotes.find(q => q.orderId === selectedOrderDetails.id).deliveryFee)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-500">Delivery Date</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatDate(quotes.find(q => q.orderId === selectedOrderDetails.id).deliveryDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 rounded-b-lg">
                {/* Success Message */}
                {successMessage && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </div>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeDetailsModal}
                    disabled={startingDelivery}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStartDelivery(selectedOrderDetails.id)}
                    disabled={startingDelivery || selectedOrderDetails.orderStatus === 'SHIPPED' || selectedOrderDetails.orderStatus === 'DELIVERED'}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {startingDelivery ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting...
                      </>
                    ) : selectedOrderDetails.orderStatus === 'DELIVERED' ? (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Delivered
                      </>
                    ) : selectedOrderDetails.orderStatus === 'SHIPPED' ? (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                        </svg>
                        Delivery In Progress
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Start Delivery
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedQuotes;
