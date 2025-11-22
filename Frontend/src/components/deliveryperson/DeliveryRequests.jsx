import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import deliveryService from '../../services/deliveryService';

const DeliveryRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch available delivery quote requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setError('Please log in to view delivery requests');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await deliveryService.getAvailableQuoteRequests();
        
        if (response.success) {
          setRequests(response.data || []);
        } else {
          throw new Error(response.message || 'Failed to fetch requests');
        }
      } catch (err) {
        console.error('Error fetching delivery requests:', err);
        setError('Failed to load delivery requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const formatPrice = (price) => {
    return `Rs.${parseFloat(price || 0).toLocaleString('en-US', { 
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

  const handleCreateQuote = (request) => {
    setSelectedRequest(request);
    setShowQuoteModal(true);
  };

  const filteredRequests = requests.filter(req => {
    return (!searchTerm || 
      req.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.sessionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Requests</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Delivery Requests</h1>
              <p className="text-gray-600">Review delivery requests and create quotes for customers</p>
            </div>
          </div>
        </div>

        {/* Search Only */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by customer, request ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Delivery Requests */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No delivery requests found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'New delivery requests will appear here when customers place orders.'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.orderId || request.sessionId || request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Request #{request.sessionId || request.requestId}</h3>
                        <p className="text-gray-600">{request.customerName || 'N/A'}</p>
                        <p className="text-sm text-gray-500">
                          Request Date: {formatDateTime(request.createTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(request.totalAmount)}</div>
                      <div className="text-sm text-gray-600">Order Value</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* DELIVERY ROUTE */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Delivery Information
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pickup/Seller Details */}
                      <div key="pickup-info" className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-semibold text-gray-900">PICKUP FROM (SELLER)</span>
                        </div>
                        <div className="ml-7 space-y-1">
                          <p className="text-gray-800 font-medium">{request.sellerName || 'N/A'}</p>
                          <p className="text-gray-600">{request.sellerPhone || 'N/A'}</p>
                          <p className="text-sm text-gray-700 mt-2">{request.sellerAddress || request.pickupAddress || 'Address not available'}</p>
                          {request.sellerDistrict && request.sellerTown && (
                            <p className="text-sm text-gray-600 font-medium">{request.sellerDistrict}, {request.sellerTown}</p>
                          )}
                        </div>
                      </div>

                      {/* Delivery/Customer Details */}
                      <div key="delivery-info" className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                          <span className="font-semibold text-gray-900">DELIVER TO (CUSTOMER)</span>
                        </div>
                        <div className="ml-7 space-y-1">
                          <p className="text-gray-800 font-medium">{request.customerName || 'N/A'}</p>
                          <p className="text-gray-600">{request.customerPhone || 'N/A'}</p>
                          <p className="text-sm text-gray-700 mt-2">{request.deliveryAddress || 'N/A'}</p>
                          {request.district && request.town && (
                            <p className="text-sm text-gray-600 font-medium">{request.district}, {request.town}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ORDER DETAILS */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Order Summary ({request.totalItems || 0} items)
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div key="total-items">
                            <div className="text-2xl font-bold text-blue-600">{request.totalItems || 0}</div>
                            <div className="text-sm text-gray-600">Total Items</div>
                          </div>
                          <div key="order-value">
                            <div className="text-2xl font-bold text-green-600">{formatPrice(request.totalAmount)}</div>
                            <div className="text-sm text-gray-600">Order Value</div>
                          </div>
                          <div key="delivery-location">
                            <div className="text-lg font-semibold text-purple-600">{request.district}, {request.town}</div>
                            <div className="text-sm text-gray-600">Delivery Location</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Details:</span> {request.orderDetails}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CREATE QUOTE BUTTON */}
                  <div className="pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleCreateQuote(request)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center text-lg shadow-lg"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Create Quote
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE QUOTE MODAL */}
      <CreateQuoteModal 
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        request={selectedRequest}
      />
    </div>
  );
};

// CreateQuoteModal component
const CreateQuoteModal = ({ isOpen, onClose, request }) => {
  const { user } = useContext(AuthContext);
  const [quotePrice, setQuotePrice] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && request) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const validUntilDefault = tomorrow.toISOString().slice(0, 16);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const deliveryDefault = nextWeek.toISOString().slice(0, 10);
      
      setValidUntil(validUntilDefault);
      setDeliveryDate(deliveryDefault);
      setQuotePrice('');
      setErrors({});
    }
  }, [isOpen, request]);

  const validateForm = () => {
    const newErrors = {};

    if (!quotePrice || parseFloat(quotePrice) <= 0) {
      newErrors.quotePrice = 'Please enter a valid quote price';
    }

    if (!validUntil) {
      newErrors.validUntil = 'Please select quote validity date and time';
    } else {
      const validUntilDate = new Date(validUntil);
      const now = new Date();
      if (validUntilDate <= now) {
        newErrors.validUntil = 'Valid until must be in the future';
      }
    }

    if (!deliveryDate) {
      newErrors.deliveryDate = 'Please select delivery date';
    } else {
      const deliveryDateTime = new Date(deliveryDate);
      const now = new Date();
      deliveryDateTime.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (deliveryDateTime < now) {
        newErrors.deliveryDate = 'Delivery date must be today or later';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('=== CREATING DELIVERY QUOTE ===');
      console.log('Full request object:', request);
      console.log('request.id:', request.id);
      console.log('request.orderId:', request.orderId);
      
      // Debug authentication
      const token = localStorage.getItem('token');
      console.log('Auth Token exists:', !!token);
      console.log('User from context:', user);
      console.log('User roles:', user?.roles);
      console.log('Required role: DELIVERY_PERSON');
      console.log('==============================');
      
      const quoteData = {
        requestId: request.orderId || request.id, // Use orderId first, fallback to id
        deliveryFee: parseFloat(quotePrice),
        estimatedDeliveryTime: '45-90 minutes',
        deliveryDate: deliveryDate,
        expiresAt: validUntil,
        notes: 'Professional delivery service',
        deliveryPersonName: user?.name || 'Delivery Partner',
        deliveryPersonPhone: user?.phoneNumber || 'Phone not provided'
      };
      
      console.log('Sending quoteData:', quoteData);

      const response = await deliveryService.createQuote(quoteData);
      
      if (response.success) {
        alert('Quote created successfully! Customer will be notified.');
        onClose();
        
        // Refresh the requests list
        window.location.reload();
      } else {
        // Show the detailed error message from the service
        alert(response.message || 'Failed to create quote');
        return;
      }
      
    } catch (error) {
      console.error('Error creating quote:', error);
      alert(error.message || 'Failed to create quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Create Delivery Quote</h3>
              <p className="text-blue-100 mt-1">Request #{request.sessionId || request.id} - {request.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition duration-200"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quote Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quote Price (Delivery Fee) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">Rs.</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quotePrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your delivery price"
              />
            </div>
            {errors.quotePrice && (
              <p className="text-red-500 text-sm mt-1">{errors.quotePrice}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This is the amount you will charge for delivery service
            </p>
          </div>

          {/* Delivery Date - DATE ONLY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Delivery Date *
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.deliveryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.deliveryDate && (
              <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Which date do you plan to complete this delivery
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Quote...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Quote
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryRequests;
