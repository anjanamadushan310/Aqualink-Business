/**
 * QuoteAcceptance Component - Shop Owner Quote Review and Acceptance
 *
 * This component handles the complete delivery quote acceptance workflow:
 * 1. Load order data from localStorage (session-based storage)
 * 2. If localStorage is empty (page refresh), fallback to backend API
 * 3. Fetch available delivery quotes for the order
 * 4. Display quotes with sorting and filtering options
 * 5. Handle quote selection and order placement
 *
 * CRITICAL FALLBACK MECHANISM:
 * - localStorage gets cleared on page refresh
 * - Users access this page via sidebar navigation
 * - Backend provides getMyQuoteRequests() to restore order context
 * - Frontend reconstructs order data from backend response
 *
 * State Management:
 * - orderData: Current order information (items, address, preferences)
 * - quotes: List of delivery quotes from different providers
 * - selectedQuote: Currently selected quote ID
 * - loading/error: UI state management
 */

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import deliveryService from '../../services/deliveryService';

const QuoteAcceptance = () => {
  // ===== CONTEXT & STATE =====
  const { user } = useContext(AuthContext); // Current authenticated user

  // Order and quote data
  const [quotes, setQuotes] = useState([]); // List of delivery quotes
  const [orderData, setOrderData] = useState(null); // Current order information
  const [selectedQuote, setSelectedQuote] = useState(null); // Selected quote ID

  // UI state management
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortBy, setSortBy] = useState('price'); // Sort quotes by price or rating
  const [error, setError] = useState(null); // Error state for user feedback

  // Auto-refresh functionality
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // ===== COMPONENT INITIALIZATION =====
    loadOrderAndQuotes(); // Load order data and quotes on component mount

    // ===== AUTO-REFRESH SETUP =====
    // Set up automatic quote refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing quotes...');
        loadOrderAndQuotes(); // Refresh quotes periodically
      }, 30000); // 30 second intervals

      setRefreshInterval(interval); // Store interval ID for cleanup

      // Cleanup function to clear interval when component unmounts or autoRefresh changes
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [autoRefresh]); // Re-run effect when autoRefresh setting changes

  /**
   * Load order data and quotes - CRITICAL METHOD with fallback mechanism
   *
   * This method implements a robust data loading strategy:
   * 1. First, try to load from localStorage (fast, immediate)
   * 2. If localStorage is empty (page refresh), fallback to backend API
   * 3. Reconstruct order data from backend response
   * 4. Store reconstructed data in localStorage for future use
   * 5. Load delivery quotes using the order ID
   *
   * WHY THIS FALLBACK EXISTS:
   * - localStorage is session-based and clears on page refresh
   * - Users navigate to this page via sidebar at any time
   * - Must restore order context from backend when localStorage is lost
   */
  const loadOrderAndQuotes = async (showLoadingSpinner = false) => {
    try {
      // Show loading spinner if explicitly requested (for manual refresh)
      if (showLoadingSpinner) {
        setLoading(true);
      }

      // ===== STEP 1: CHECK LOCALSTORAGE =====
      // Try to get order data from browser's localStorage (session-based storage)
      let savedOrder = JSON.parse(localStorage.getItem('aqualink_order_data') || 'null');

      // Debug logging for troubleshooting
      console.log('=== Quote Acceptance Debug ===');
      console.log('Saved order from localStorage:', savedOrder);
      console.log('orderId type:', typeof savedOrder?.orderId);
      console.log('orderId value:', savedOrder?.orderId);

      // ===== STEP 2: FALLBACK TO BACKEND IF LOCALSTORAGE EMPTY =====
      // If localStorage is empty (null, undefined, or missing orderId)
      if (!savedOrder || !savedOrder.orderId) {
        console.log('localStorage empty - attempting to fetch most recent order from backend...');

        try {
          // Call backend API to get user's recent quote requests
          const recentOrdersResponse = await deliveryService.getMyQuoteRequests();
          console.log('My quote requests response:', recentOrdersResponse);

          // Check if backend returned data successfully
          if (recentOrdersResponse.success && recentOrdersResponse.data && recentOrdersResponse.data.length > 0) {
            // Get the most recent order (first in the list, assuming sorted by creation time)
            const mostRecentRequest = recentOrdersResponse.data[0];
            console.log('Most recent request:', mostRecentRequest);

            // ===== STEP 3: RECONSTRUCT ORDER DATA =====
            // Build complete order object from backend response
            // This mirrors the structure expected by the rest of the component
            savedOrder = {
              orderId: mostRecentRequest.orderId, // CRITICAL: Must be present in backend response!
              sessionId: mostRecentRequest.sessionId,
              sellerId: mostRecentRequest.sellerId,
              businessName: mostRecentRequest.businessName || 'Seller',
              items: mostRecentRequest.items || [], // Order items from backend
              subtotal: mostRecentRequest.subtotal || 0,
              deliveryAddress: {
                place: mostRecentRequest.deliveryAddress?.place || '',
                street: mostRecentRequest.deliveryAddress?.street || '',
                district: mostRecentRequest.deliveryAddress?.district || '',
                town: mostRecentRequest.deliveryAddress?.town || ''
              },
              preferences: mostRecentRequest.preferences || {},
              status: 'PENDING', // Default status for quote acceptance
              createdAt: mostRecentRequest.createTime || new Date().toISOString()
            };

            console.log('Reconstructed order data from backend:', savedOrder);

            // ===== STEP 4: STORE IN LOCALSTORAGE =====
            // Save reconstructed data for future use (prevents repeated API calls)
            localStorage.setItem('aqualink_order_data', JSON.stringify(savedOrder));
          } else {
            // No quote requests found - user hasn't submitted any delivery requests yet
            console.log('No recent quote requests found in backend');
            setError('NO_ORDER_SESSION');
            setLoading(false);
            return;
          }
        } catch (fetchError) {
          // Backend call failed - could be network issues or authentication problems
          console.error('Error fetching recent orders:', fetchError);
          setError('NO_ORDER_SESSION');
          setLoading(false);
          return;
        }
      }

      // ===== STEP 5: VALIDATE ORDER DATA =====
      // Ensure we have a valid orderId before proceeding
      if (!savedOrder.orderId) {
        console.log('No order ID found in order data:', savedOrder);
        console.log('Available keys in savedOrder:', Object.keys(savedOrder));
        // If there's a sessionId but no orderId, it means the user came from cart
        // but didn't submit the delivery request form properly
        if (savedOrder.sessionId) {
          setError('INCOMPLETE_REQUEST');
          setLoading(false);
          return;
        }
        setError('INVALID_ORDER_DATA');
        setLoading(false);
        return;
      }

      // ===== STEP 6: LOAD DELIVERY QUOTES =====
      // Now that we have valid order data, load the delivery quotes
      setOrderData(savedOrder);

      // Debug logging for quote fetching
      console.log('========================================');
      console.log('FETCHING QUOTES FROM BACKEND');
      console.log('Order ID:', savedOrder.orderId);
      console.log('Order ID type:', typeof savedOrder.orderId);
      console.log('Order data:', JSON.stringify(savedOrder, null, 2));
      console.log('API endpoint:', `/api/delivery-quotes/order/${savedOrder.orderId}/quotes`);
      
      // Debug authentication
      const token = localStorage.getItem('token');
      console.log('Auth Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN FOUND');
      console.log('User from context:', user);
      console.log('User roles:', user?.roles);
      console.log('Required roles: SHOP_OWNER, FARM_OWNER, or INDUSTRIAL_STUFF_SELLER');
      console.log('========================================');

      // Call backend to get quotes for this specific order
      const response = await deliveryService.getQuotesForOrder(savedOrder.orderId);
      console.log('========================================');
      console.log('BACKEND RESPONSE:');
      console.log('Response:', response);
      console.log('Success:', response?.success);
      console.log('Data:', response?.data);
      console.log('Number of quotes:', response?.data?.length);
      console.log('========================================');

      // ===== STEP 7: PROCESS QUOTE RESPONSE =====
      if (response.success && response.data) {
        // Transform backend quote data to match frontend format
        const transformedQuotes = response.data.map(quote => ({
          id: quote.id,
          deliveryPersonId: quote.deliveryPersonId,
          deliveryPersonName: quote.deliveryPersonName || `Delivery Partner ${quote.deliveryPersonId}`,
          deliveryPersonPhone: quote.deliveryPersonPhone || 'Not provided',
          deliveryFee: quote.deliveryFee,
          estimatedDeliveryTime: quote.estimatedDeliveryTime || '45-90 minutes',
          rating: quote.rating || 4.5,
          completedDeliveries: quote.completedDeliveries || 100,
          specialOffers: quote.specialOffers || 'Professional delivery service',
          quoteValidUntil: quote.expiresAt, // When quote expires
          notes: quote.notes || 'Professional delivery service provider',
          coverageArea: quote.coverageArea || 'Service area',
          deliveryDate: quote.deliveryDate || getDefaultDeliveryDate(),
          status: quote.status
        }));

        console.log('Transformed quotes:', transformedQuotes);
        setQuotes(transformedQuotes);

        // Clear any previous errors on successful load
        setError(null);
      } else {
        // No quotes available yet OR error occurred
        console.log('No quotes available or error occurred');
        console.log('Response message:', response.message);
        
        // If there's an error message, display it
        if (response.message && response.message.includes('Access denied')) {
          setError({
            type: 'AUTH_ERROR',
            message: response.message
          });
        } else if (response.message && response.message.includes('session has expired')) {
          setError({
            type: 'SESSION_EXPIRED',
            message: response.message
          });
        } else {
          // No quotes available yet - this is normal if delivery persons haven't responded
          setQuotes([]);
        }
      }

      setLoading(false);

    } catch (error) {
      // Handle any unexpected errors during the loading process
      console.error('Error loading quotes:', error);
      setError('LOAD_ERROR');
      setLoading(false);
    }
  };

  // Helper function to get default delivery date (2-3 days from today)
  const getDefaultDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
  };

  // Helper function to format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `Rs.${parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getQuoteStatus = (quote) => {
    const now = new Date();
    const expiry = new Date(quote.quoteValidUntil);
    
    if (now > expiry) {
      return { status: 'expired', text: 'Quote Expired', color: 'text-red-600' };
    }

    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    const hoursUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60));
    
    if (daysUntilExpiry < 1) {
      return { 
        status: 'expiring_soon', 
        text: `Expires in ${hoursUntilExpiry}h`, 
        color: 'text-orange-600' 
      };
    }
    
    return { 
      status: 'valid', 
      text: `Valid for ${daysUntilExpiry} more day(s)`, 
      color: 'text-green-600' 
    };
  };

  const getSortedQuotes = () => {
    const validQuotes = quotes.filter(quote => {
      const status = getQuoteStatus(quote);
      return status.status === 'valid' || status.status === 'expiring_soon';
    });

    return [...validQuotes].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.deliveryFee - b.deliveryFee;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  };

  const placeOrder = async () => {
    if (!selectedQuote) {
      alert('Please select a delivery quote first');
      return;
    }

    const quote = quotes.find(q => q.id === selectedQuote);
    const status = getQuoteStatus(quote);
    
    if (status.status === 'expired') {
      alert('Selected quote is no longer valid. Please choose another quote.');
      setSelectedQuote(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Debug authentication
      console.log('=== ACCEPTING QUOTE ===');
      const token = localStorage.getItem('token');
      console.log('Auth Token exists:', !!token);
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('User email:', payload.sub || payload.email);
        console.log('User roles:', payload.roles);
        console.log('Required roles: SHOP_OWNER, FARM_OWNER, or INDUSTRIAL_STUFF_SELLER');
      }
      console.log('Quote ID:', selectedQuote);
      console.log('======================');
      
      // Accept the quote using the backend API
      const response = await deliveryService.acceptQuote(selectedQuote);

      if (response.success) {
        // Create order object for frontend tracking
        const finalOrder = {
          orderId: response.data.id || 'ORD' + Date.now(),
          sessionId: orderData.sessionId,
          items: orderData.items,
          subtotal: orderData.subtotal,
          deliveryFee: quote.deliveryFee,
          totalAmount: orderData.subtotal + quote.deliveryFee,
          deliveryPartner: {
            name: quote.deliveryPersonName,
            rating: quote.rating,
            completedDeliveries: quote.completedDeliveries
          },
          deliveryDate: quote.deliveryDate,
          orderDate: new Date().toISOString(),
          status: 'CONFIRMED',
          backendOrderId: response.data.id
        };

        // Store order in localStorage for frontend tracking
        const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        existingOrders.push(finalOrder);
        localStorage.setItem('customerOrders', JSON.stringify(existingOrders));

        // Clear cart and quote data
        localStorage.removeItem('selected_delivery_quote');
        localStorage.removeItem('aqualink_order_data');
        localStorage.removeItem('aqualink_received_quotes');

        // Stop auto-refresh
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }

        alert(`Order placed successfully! Order ID: ${finalOrder.orderId}\n\nYour order has been confirmed and assigned to ${quote.deliveryPersonName}.\nYou will receive updates on the delivery progress.`);
        
        // Redirect to order confirmation or dashboard
        window.location.href = `/order-confirmation/${finalOrder.orderId}`;

      } else {
        // Show detailed error message from the service
        const errorMsg = response.message || 'Failed to accept quote';
        console.error('Quote acceptance failed:', errorMsg);
        setError({
          type: 'ACCEPT_ERROR',
          message: errorMsg
        });
        alert(errorMsg);
      }

    } catch (error) {
      console.error('Order placement error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotes from delivery partners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessages = {
      'NO_ORDER_SESSION': {
        title: 'No Order Session Found',
        message: 'You need to start from your cart to request delivery quotes.',
        icon: '🛒',
        steps: [
          'Add items to your cart',
          'Go to cart and click "🌊 Delivery with Aqualink"',
          'Fill in delivery details and click "Send Quote Request"',
          'You\'ll be redirected here to view and accept quotes'
        ],
        primaryAction: { text: 'Go to Cart', link: '/cart' },
        secondaryAction: null
      },
      'INCOMPLETE_REQUEST': {
        title: 'Incomplete Delivery Request',
        message: 'You started a delivery request but didn\'t complete it. Please fill in your delivery details and submit the request.',
        icon: '📝',
        steps: [
          'Fill in your delivery address',
          'Select delivery preferences',
          'Click "Send Quote Request" button',
          'Wait for delivery partners to respond with quotes'
        ],
        primaryAction: { text: 'Complete Request', link: '/delivery-request' },
        secondaryAction: { text: 'Start Over', link: '/cart' }
      },
      'INVALID_ORDER_DATA': {
        title: 'Invalid Order Data',
        message: 'The order data is corrupted or incomplete. Please create a new quote request.',
        icon: '⚠️',
        steps: [
          'Go back to your cart',
          'Click "🌊 Delivery with Aqualink"',
          'Complete the delivery request form',
          'Submit to receive quotes'
        ],
        primaryAction: { text: 'Go to Cart', link: '/cart' },
        secondaryAction: { text: 'Clear Data & Retry', onClick: () => {
          localStorage.removeItem('aqualink_order_data');
          window.location.reload();
        }}
      },
      'LOAD_ERROR': {
        title: 'Error Loading Quotes',
        message: 'Failed to load delivery quotes. Please check your connection and try again.',
        icon: '🔌',
        steps: [
          'Check your internet connection',
          'Make sure the backend server is running',
          'Try refreshing the page',
          'If problem persists, start a new quote request'
        ],
        primaryAction: { text: 'Try Again', onClick: () => window.location.reload() },
        secondaryAction: { text: 'Go to Cart', link: '/cart' }
      }
    };

    const errorConfig = errorMessages[error] || errorMessages['LOAD_ERROR'];

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">{errorConfig.icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{errorConfig.title}</h2>
          <p className="text-red-600 mb-4">{errorConfig.message}</p>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">How to proceed:</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              {errorConfig.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="space-x-4">
            {errorConfig.primaryAction && (
              <button 
                onClick={errorConfig.primaryAction.onClick || (() => window.location.href = errorConfig.primaryAction.link)} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {errorConfig.primaryAction.text}
              </button>
            )}
            {errorConfig.secondaryAction && (
              <button 
                onClick={errorConfig.secondaryAction.onClick || (() => window.location.href = errorConfig.secondaryAction.link)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                {errorConfig.secondaryAction.text}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sortedQuotes = getSortedQuotes();
  const expiredQuotes = quotes.filter(quote => {
    const status = getQuoteStatus(quote);
    return status.status === 'expired';
  });

  const selectedQuoteData = selectedQuote ? quotes.find(q => q.id === selectedQuote) : null;
  const totalAmount = selectedQuoteData ? orderData.subtotal + selectedQuoteData.deliveryFee : orderData.subtotal;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Quote & Complete Order</h1>
          <p className="text-gray-600">Choose your delivery partner and payment method to place your order</p>
        </div>

        {/* REMOVED: Order Information section with delivery date display */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quotes Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sorting Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Available Quotes ({sortedQuotes.length})
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="price">Price (Low to High)</option>
                    <option value="rating">Rating (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Auto-refresh controls */}
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="text-blue-600"
                    />
                    <span className="text-blue-800 text-sm font-medium">Auto-refresh quotes (every 30s)</span>
                  </label>
                  {autoRefresh && (
                    <span className="text-blue-600 text-xs">🔄 Active</span>
                  )}
                </div>
                <button 
                  onClick={() => loadOrderAndQuotes(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh Now'}
                </button>
              </div>
              
              {expiredQuotes.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ {expiredQuotes.length} quote(s) have expired and are not shown
                  </p>
                </div>
              )}
            </div>

            {/* Quotes Display */}
            {sortedQuotes.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Waiting for Quotes</h3>
                <p className="text-gray-600 mb-6">
                  Your quote request has been sent to delivery partners. Please check back soon for responses.
                </p>
                <div className="space-x-4">
                  <button 
                    onClick={() => loadOrderAndQuotes()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Refresh Quotes
                  </button>
                  <button 
                    onClick={() => window.location.href = '/delivery-request'}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Send New Request
                  </button>
                  <button 
                    onClick={() => window.location.href = '/cart'}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuotes.map((quote, index) => {
                  const status = getQuoteStatus(quote);
                  const isSelected = selectedQuote === quote.id;
                  const isValid = status.status === 'valid' || status.status === 'expiring_soon';

                  return (
                    <div 
                      key={quote.id}
                      className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        isSelected && isValid
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : !isValid
                            ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => isValid && setSelectedQuote(quote.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">{quote.deliveryPersonName}</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4 ml-9">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rating:</span>
                              <div className="flex items-center">
                                <span className="text-yellow-500 mr-1">⭐</span>
                                <span className="font-semibold">{quote.rating}</span>
                              </div>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Deliveries:</span>
                              <span className="font-semibold">{quote.completedDeliveries}</span>
                            </div>

                            {/* ADDED: Delivery Date Display */}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery Date:</span>
                              <span className="font-semibold text-green-700">{formatDate(quote.deliveryDate)}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Quote Status:</span>
                              <span className={`font-semibold ${status.color}`}>{status.text}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-gray-900">{formatPrice(quote.deliveryFee)}</div>
                          <div className="text-sm text-gray-600">Delivery Fee</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-4">
                {orderData?.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(orderData?.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold">
                    {selectedQuoteData ? formatPrice(selectedQuoteData.deliveryFee) : 'Select quote'}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button 
                onClick={placeOrder}
                disabled={!selectedQuote || isProcessing}
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Order...
                  </div>
                ) : selectedQuote ? (
                  `Place Order - ${formatPrice(totalAmount)}`
                ) : (
                  'Select Quote to Continue'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">
                    {typeof error === 'object' ? error.message : error}
                  </p>
                  {typeof error === 'object' && error.type === 'AUTH_ERROR' && (
                    <p className="text-xs text-red-500 mt-2">
                      Debug info - Check browser console for authentication details
                    </p>
                  )}
                </div>
              )}

              {!selectedQuote && (
                <p className="text-orange-600 text-sm text-center mt-2 font-medium">
                  Please select a delivery quote first
                </p>
              )}

              <p className="text-xs text-gray-600 text-center mt-3">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteAcceptance;
