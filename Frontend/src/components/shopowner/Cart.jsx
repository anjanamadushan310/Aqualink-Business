import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../home/BookingModal';
import ChatWithSeller from '../chat/ChatWithSeller';
import cartService from '../../services/cartService';

const Cart = () => {
  const { cartItems, cartCount, loading, updateCartItem, removeFromCart, clearCart, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [bookingService, setBookingService] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatProduct, setChatProduct] = useState(null);

  useEffect(() => {
    console.log('Cart component mounted, authentication status:', isAuthenticated());
    console.log('Cart items:', cartItems);
    console.log('Cart count:', cartCount);
    console.log('Loading state:', loading);
    
    if (!isAuthenticated()) {
      console.log('User not authenticated for cart access');
      // Optionally redirect to login or show a message
    }
  }, [isAuthenticated, cartItems, cartCount, loading]);

  const formatPrice = (price) => {
    return `Rs.${parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getTotalAmount = () => {
    if (!cartItems || cartItems.length === 0) {
      return 0;
    }

    return cartItems.reduce((sum, item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
      if (Number.isNaN(itemTotal)) {
        return sum;
      }
      return sum + itemTotal;
    }, 0);
  };

  // Group cart items by seller
  const groupItemsBySeller = (items) => {
    if (!items || items.length === 0) return {};
    
    return items.reduce((groups, item) => {
      const sellerId = item.sellerId || 'unknown';
      const businessName = item.businessName || item.sellerName || 'Unknown Business';
      const isOwnItem = user && user.userId === item.sellerId;
      
      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerId,
          businessName,
          sellerName: item.sellerName,
          isOwnItem,
          items: [],
          totalAmount: 0
        };
      }
      
      groups[sellerId].items.push(item);
      groups[sellerId].totalAmount += (item.price * item.quantity);
      
      return groups;
    }, {});
  };

  const getSellerGroups = () => {
    const groups = Object.values(groupItemsBySeller(cartItems || []));
    // Sort so that user's own items appear first
    return groups.sort((a, b) => {
      if (a.isOwnItem && !b.isOwnItem) return -1;
      if (!a.isOwnItem && b.isOwnItem) return 1;
      return 0;
    });
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (!isAuthenticated()) {
      alert('Please log in to modify your cart.');
      return;
    }
    
    if (newQuantity < 1) {
      await removeItem(cartItemId);
      return;
    }
    try {
      await updateCartItem(cartItemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Your session has expired. Please log in again.');
      } else {
        alert('Failed to update quantity. Please try again.');
      }
    }
  };

  const removeItem = async (cartItemId) => {
    if (!isAuthenticated()) {
      alert('Please log in to modify your cart.');
      return;
    }
    
    try {
      await removeFromCart(cartItemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      if (error.message.includes('Authentication failed')) {
        alert('Your session has expired. Please log in again.');
      } else {
        alert('Failed to remove item. Please try again.');
      }
    }
  };

  const handleBookClick = (item) => {
    setBookingService({
      id: item.productId,
      name: item.productName,
      cartItemId: item.cartItemId,
      ...item
    });
  };

  const handleBookingSuccess = async () => {
    if (bookingService && bookingService.cartItemId) {
      try {
        await removeFromCart(bookingService.cartItemId);
        alert('Service booked successfully! The item has been removed from your cart.');
      } catch (error) {
        console.error('Error removing booked service from cart:', error);
        alert('Service booked successfully!');
      }
    }
    setBookingService(null);
  };

  const handleDeliveryRequestClick = async (sellerGroup) => {
    if (!sellerGroup.sellerId) {
      alert('Missing seller information for this delivery request.');
      return;
    }

    const physicalItems = sellerGroup.items.filter(item => item.productType !== 'service');

    if (physicalItems.length === 0) {
      alert('No physical products available for delivery in this seller group.');
      return;
    }

    const physicalSubtotal = physicalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      sessionId: 'SESSION_' + Date.now() + '_' + sellerGroup.sellerId,
      sellerId: sellerGroup.sellerId,
      businessName: sellerGroup.businessName,
      sellerName: sellerGroup.sellerName,
      items: physicalItems,
      subtotal: physicalSubtotal,
      createdAt: new Date().toISOString(),
      status: 'REQUESTING_QUOTES'
    };

    localStorage.setItem('aqualink_order_data', JSON.stringify(orderData));

    try {
      await cartService.removeSellerItems(sellerGroup.sellerId);
    } catch (error) {
      console.error('Failed to remove seller items from cart:', error);
      alert(error.message || 'Failed to remove items for this seller. Please try again.');
      return;
    }

    if (refreshCart) {
      await refreshCart();
    }

    navigate('/delivery-request', {
      state: {
        sellerId: sellerGroup.sellerId,
        businessName: sellerGroup.businessName
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
              <p className="text-gray-600">Review your items and request delivery quotes</p>
            </div>
            <button
              onClick={() => refreshCart && refreshCart()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Cart'}
            </button>
          </div>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-yellow-800 font-semibold">Authentication Required</h3>
                <p className="text-yellow-700 text-sm">Please log in to access your cart and make purchases.</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cart Items ({cartItems ? cartItems.length : 0})</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Loading cart...</div>
              </div>
            )}
            
            {!loading && (!cartItems || cartItems.length === 0) ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some items to get started!</p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              !loading && (
                <div className="space-y-6">
                  {getSellerGroups().map((sellerGroup) => (
                    <div key={sellerGroup.sellerId} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      {/* Seller Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            sellerGroup.isOwnItem ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <span className={`font-bold text-sm ${
                              sellerGroup.isOwnItem ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {sellerGroup.businessName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-lg text-gray-900">{sellerGroup.businessName}</h3>
                              {sellerGroup.isOwnItem && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                  Your Items
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Seller: {sellerGroup.sellerName}
                              {sellerGroup.isOwnItem && ' (You)'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Group Total</div>
                          <div className={`font-bold text-lg ${
                            sellerGroup.isOwnItem ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {formatPrice(sellerGroup.totalAmount)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Items from this seller */}
                      <div className="space-y-3">
                        {/* Physical Items (Fish, Industrial) */}
                        {sellerGroup.items.filter(item => item.productType !== 'service').length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Products for Delivery</h4>
                            <div className="space-y-3">
                              {sellerGroup.items.filter(item => item.productType !== 'service').map(item => (
                                <div key={item.cartItemId} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-lg">{item.productName}</h4>
                                      <p className="text-gray-600">{formatPrice(item.price)} each</p>
                                      <p className="text-sm text-gray-500 capitalize">{item.productType}</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-3">
                                        <button 
                                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 font-semibold"
                                        >
                                          -
                                        </button>
                                        <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
                                        <button 
                                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 font-semibold"
                                        >
                                          +
                                        </button>
                                      </div>
                                      
                                      <div className="text-right min-w-0">
                                        <div className="font-bold text-lg">{formatPrice(item.price * item.quantity)}</div>
                                        <button 
                                          onClick={() => removeItem(item.cartItemId)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Service Items */}
                        {sellerGroup.items.filter(item => item.productType === 'service').length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Services (Booking Only)</h4>
                            <div className="space-y-3">
                              {sellerGroup.items.filter(item => item.productType === 'service').map(item => (
                                <div key={item.cartItemId} className="bg-white rounded-lg p-4 border border-blue-200 bg-blue-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-lg">{item.productName}</h4>
                                      <p className="text-gray-600">{formatPrice(item.price)}</p>
                                      <p className="text-sm text-blue-600 font-medium capitalize">Service Booking</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <button
                                        onClick={() => handleBookClick(item)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                                      >
                                        📅 Book Now
                                      </button>
                                      <div className="text-right min-w-0">
                                        <div className="font-bold text-lg">{formatPrice(item.price * item.quantity)}</div>
                                        <button 
                                          onClick={() => removeItem(item.cartItemId)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Delivery Options for Physical Items */}
                        {!sellerGroup.isOwnItem && sellerGroup.items.some(item => item.productType !== 'service') && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Delivery Options (Products Only)</h5>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => {
                                  alert('This feature is not available yet.');
                                }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
                              >
                                🚚 Delivery with Courier Service
                              </button>
                              <button
                                onClick={() => handleDeliveryRequestClick(sellerGroup)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg"
                              >
                                🌊 Delivery with Aqualink
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Booking Action for Services - Removed as per new requirement */}
                        {/* Services are now booked individually */}
                        
                        {sellerGroup.isOwnItem && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                            <div className="text-gray-600 mb-2">
                              <span className="text-sm">💡 These are your own products</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              You cannot request delivery quotes for your own items. 
                              These items will need to be handled separately or purchased by other customers.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Overall Cart Summary */}
        {!loading && cartItems && cartItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Cart Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-semibold">{cartItems.length} items</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Sellers:</span>
                  <span className="font-semibold">{getSellerGroups().length} seller{getSellerGroups().length > 1 ? 's' : ''}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">{formatPrice(getTotalAmount())}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">+ delivery fees (will be added after quote selection)</p>
                </div>
                
                {/* Seller Breakdown */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Breakdown by Seller:</h4>
                  <div className="space-y-2">
                    {getSellerGroups().map((group) => (
                      <div key={group.sellerId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{group.businessName}:</span>
                        <span className="font-medium">{formatPrice(group.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <button 
                    onClick={async () => {
                      if (!isAuthenticated()) {
                        alert('Please log in to modify your cart.');
                        return;
                      }
                      
                      if (window.confirm('Are you sure you want to clear your entire cart? This will remove all items from all sellers.')) {
                        try {
                          await clearCart();
                        } catch (error) {
                          if (error.message.includes('Authentication failed')) {
                            alert('Your session has expired. Please log in again.');
                          } else {
                            alert('Failed to clear cart. Please try again.');
                          }
                        }
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                  >
                    Clear Entire Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Quote Request Settings - for setting default preferences */}
      </div>

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal
          service={bookingService}
          onClose={() => setBookingService(null)}
          onBookingSuccess={handleBookingSuccess}
          onChatClick={() => {
            // Close booking modal and open chat
            const productForChat = {
              ...bookingService,
              userId: bookingService.sellerId // Map sellerId to userId for ChatWithSeller
            };
            setChatProduct(productForChat);
            setBookingService(null);
            setShowChat(true);
          }}
        />
      )}

      {/* Chat Modal */}
      {showChat && chatProduct && (
        <ChatWithSeller
          product={chatProduct}
          productType="SERVICE"
          onClose={() => {
            setShowChat(false);
            setChatProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Cart;