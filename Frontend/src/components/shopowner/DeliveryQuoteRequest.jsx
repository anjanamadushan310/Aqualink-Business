import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import { districtToTowns } from "../../components/user-profile/locationData.jsx";
import deliveryService from "../../services/deliveryService";
import { ENV } from "../../config/env.js";

const EnhancedDeliveryRequest = () => {
  const { cartItems, totalAmount, clearCart, refreshCart } = useContext(CartContext);
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sellerId, businessName } = location.state || {};
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [availableTowns, setAvailableTowns] = useState([]);
  const [addressLoaded, setAddressLoaded] = useState(false); // Track if address has been loaded from profile
  const initialLoadRef = useRef(false); // Track if initial load has happened
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY'); // Default to cash on delivery
  const [deliveryAddress, setDeliveryAddress] = useState({
    place: '',
    street: '',
    district: '',
    town: ''
  });

  useEffect(() => {
    // Prevent infinite loop - only run once on mount
    if (initialLoadRef.current) {
      console.log('Initial load already completed, skipping useEffect');
      return;
    }

    console.log('Running initial load useEffect');
    initialLoadRef.current = true;

    // Debug cart data
    console.log('DeliveryQuoteRequest - Cart Data:', {
      cartItems,
      totalAmount,
      cartItemsLength: cartItems?.length,
      firstItem: cartItems?.length > 0 ? cartItems[0] : null
    });

    // Check if we have order data from Cart component via localStorage
    const storedOrderData = localStorage.getItem('aqualink_order_data');
    if (storedOrderData) {
      try {
        const orderData = JSON.parse(storedOrderData);
        console.log('Found stored order data from Cart:', orderData);
        
        // If cart context is empty but we have stored data, use the stored data
        if ((!cartItems || cartItems.length === 0) && orderData.items && orderData.items.length > 0) {
          console.log('Using stored order data as cart is empty');
          // Note: We can't directly set cartItems here as it's from context
          // The stored data will be used when submitting the quote request
        }
      } catch (error) {
        console.error('Error parsing stored order data:', error);
      }
    }

    // Load user's profile data (only once on page load)
    const loadUserProfile = async () => {
      // Only load address if it hasn't been loaded yet
      if (addressLoaded) {
        console.log('Address already loaded, skipping profile load');
        return;
      }

      try {
        console.log('Loading profile with token:', token ? 'Present' : 'Missing');

        const response = await axios.get(`${ENV.API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const profile = response.data;
        console.log('Full profile data:', JSON.stringify(profile, null, 2));

        // Extract address fields exactly as they are in UserProfile entity
        const district = profile.addressDistrict || '';
        const town = profile.addressTown || '';

        console.log('Extracted address data:', {
          district,
          town,
          isDistrictValid: district ? district in districtToTowns : false,
          availableTownsForDistrict: district ? districtToTowns[district] : []
        });

        // Set the address state with the exact field names from UserProfile entity
        const updatedAddress = {
          place: profile.addressPlace || '',
          street: profile.addressStreet || '',
          district: district,
          town: town
        };

        console.log('Setting delivery address state (first time only):', updatedAddress);
        
        // First update available towns for the district
        if (district) {
          const towns = districtToTowns[district] || [];
          console.log('Setting available towns:', {
            district,
            townsFound: towns.length > 0,
            towns,
            currentTown: town,
            isTownValid: towns.includes(town)
          });
          setAvailableTowns(towns);
          
          // If current town is not valid for this district, clear it
          if (town && !towns.includes(town)) {
            console.log('Town', town, 'is not valid for district', district, '- clearing town');
            updatedAddress.town = '';
          } else if (town) {
            // Keep the valid town
            console.log('Keeping valid town:', town, 'for district:', district);
            updatedAddress.town = town;
          }
        } else {
          // Clear towns if no district
          console.log('No district selected, clearing towns');
          setAvailableTowns([]);
          updatedAddress.town = '';
        }

        // Now set the address with potentially cleared town
        setDeliveryAddress(updatedAddress);
        setAddressLoaded(true); // Mark address as loaded so it won't reload

      } catch (error) {
        console.error('Error loading profile:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        toast.error('Failed to load your address information. Please enter it manually.');
        setAddressLoaded(true); // Mark as loaded even on error to prevent retries
      }
    };

    if (token) {
      // Refresh cart data first to ensure we have latest data
      refreshCart();
      loadUserProfile();
    } else {
      console.log('No token available, skipping profile load');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only run on mount and when token changes - intentionally excluding other deps to prevent infinite loop

  // Handle district/town state synchronization
  useEffect(() => {
    console.log('District changed. Current state:', {
      district: deliveryAddress.district,
      town: deliveryAddress.town
    });

    if (deliveryAddress.district) {
      const availableTownsForDistrict = districtToTowns[deliveryAddress.district] || [];
      console.log('Available towns for', deliveryAddress.district, ':', availableTownsForDistrict);
      
      setAvailableTowns(availableTownsForDistrict);

      // Validate if current town is valid for the selected district
      if (deliveryAddress.town && !availableTownsForDistrict.includes(deliveryAddress.town)) {
        console.log('Current town is not valid for selected district, resetting town');
        setDeliveryAddress(prev => ({
          ...prev,
          town: ''
        }));
      }
    } else {
      console.log('No district selected, clearing towns');
      setAvailableTowns([]);
      if (deliveryAddress.town) {
        setDeliveryAddress(prev => ({
          ...prev,
          town: ''
        }));
      }
    }
  }, [deliveryAddress.district, deliveryAddress.town]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    console.log('Address field change:', name, value);
    
    // Use the exact field names from UserProfile entity
    const fieldName = name === 'district' ? 'district' : 
                     name === 'town' ? 'town' :
                     name === 'place' ? 'place' :
                     name === 'street' ? 'street' : name;
    
    if (name === 'district') {
      // When district changes, update district and reset town
      setDeliveryAddress(prev => {
        console.log('Updating district to:', value);
        return {
          ...prev,
          district: value,
          town: '' // Reset town when district changes
        };
      });
      
      // Load towns for selected district
      const townsForDistrict = districtToTowns[value] || [];
      console.log('Setting available towns for district:', value, townsForDistrict);
      setAvailableTowns(townsForDistrict);
    } else {
      setDeliveryAddress(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }
  };

  const [preferences, setPreferences] = useState({
    quotesExpireAfter: 24,
    quotesExpireOn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  const handleSubmitQuoteRequest = async () => {
    setSending(true);
    setError(null);

    try {
      // Use the same logic as display to get correct items and total
      let itemsToUse = cartItems;
      let totalToUse = totalAmount;

      // If cart context is empty, try to use stored order data
      if (!cartItems || cartItems.length === 0) {
        const storedOrderData = localStorage.getItem('aqualink_order_data');
        if (storedOrderData) {
          try {
            const orderData = JSON.parse(storedOrderData);
            itemsToUse = orderData.items;
            totalToUse = orderData.subtotal;
          } catch (error) {
            console.error('Error parsing stored order data for submission:', error);
          }
        }
      }

      // Calculate actual total from items for accuracy
      const calculatedTotal = itemsToUse && itemsToUse.length > 0 
        ? itemsToUse.reduce((sum, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            return sum + (itemPrice * itemQuantity);
          }, 0)
        : 0;

      // Use calculated total if it's greater than 0, otherwise use totalToUse
      const finalTotal = calculatedTotal > 0 ? calculatedTotal : (totalToUse || 0);

      const requestData = {
        sessionId: crypto.randomUUID(),
        sellerId: sellerId,
        businessName: businessName,
        paymentMethod: paymentMethod, // Add payment method
        items: itemsToUse.map(item => ({
          cartItemId: item.cartItemId,
          productName: item.productName,
          productType: item.productType,
          quantity: item.quantity,
          price: item.price,
          sellerId: item.sellerId,
          sellerName: item.sellerName
        })),
        subtotal: finalTotal,
        preferences: {
          quotesExpireAfter: preferences.quotesExpireAfter,
          quotesExpireOn: new Date(preferences.quotesExpireOn).toISOString()
        },
        deliveryAddress: {
          place: deliveryAddress.place.trim(),
          street: deliveryAddress.street.trim(),
          district: deliveryAddress.district,
          town: deliveryAddress.town
        }
      };

      console.log('Submitting quote request with data:', requestData);
      console.log('Delivery address being sent:', requestData.deliveryAddress);

      // Validate delivery address
      if (!deliveryAddress.place.trim()) {
        toast.error('Please enter the place/building name');
        return;
      }
      if (!deliveryAddress.street.trim()) {
        toast.error('Please enter the street address');
        return;
      }
      if (!deliveryAddress.district) {
        toast.error('Please select a district');
        return;
      }
      if (!deliveryAddress.town) {
        toast.error('Please select a town');
        return;
      }

      console.log('About to send request to backend with address data:', {
        deliveryAddress: requestData.deliveryAddress,
        fullRequestData: requestData
      });

      const response = await deliveryService.createQuoteRequest(requestData);
      
      console.log('=== Backend Response Debug ===');
      console.log('Full response object:', response);
      console.log('response.success:', response?.success);
      console.log('response.data:', response?.data);
      console.log('response.data.orderId:', response?.data?.orderId);
      console.log('response.data.sessionId:', response?.data?.sessionId);
      console.log('Type of orderId:', typeof response?.data?.orderId);
      console.log('================================');

      if (response.success && response.data) {
        toast.success('Delivery quote request sent successfully! Delivery persons will be notified.');
        clearCart(); // Clear the cart after successful request
        
        // Prepare order data for quote acceptance page
        const orderData = {
          sessionId: response.data.sessionId || requestData.sessionId,
          orderId: response.data.orderId,
          sellerId: sellerId,
          businessName: businessName,
          paymentMethod: paymentMethod, // Include payment method
          items: requestData.items,
          subtotal: requestData.subtotal,
          deliveryAddress: requestData.deliveryAddress,
          preferences: requestData.preferences,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        console.log('=== Order Data to Store ===');
        console.log('orderData object:', orderData);
        console.log('orderData.orderId:', orderData.orderId);
        console.log('===========================');

        // Store order data in localStorage for QuoteAcceptance component
        localStorage.setItem('aqualink_order_data', JSON.stringify(orderData));
        
        // Verify storage
        const stored = localStorage.getItem('aqualink_order_data');
        console.log('=== Verification of Storage ===');
        console.log('Stored in localStorage:', stored);
        console.log('Parsed back:', JSON.parse(stored));
        console.log('================================');
        
        // Navigate to quote acceptance page within the dashboard
        navigate('/dashboard/quote-acceptance');
      } else {
        throw new Error(response.message || 'Failed to submit quote request');
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to submit quote request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleQuoteExpiryChange = (hours) => {
    setPreferences({
      quotesExpireAfter: hours,
      quotesExpireOn: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Page</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Request Delivery Quotes</h2>
      
      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
        {(() => {
          // Determine which items and total to display
          let itemsToShow = cartItems;
          let totalToShow = totalAmount;

          // If cart context is empty, try to use stored order data
          if (!cartItems || cartItems.length === 0) {
            const storedOrderData = localStorage.getItem('aqualink_order_data');
            if (storedOrderData) {
              try {
                const orderData = JSON.parse(storedOrderData);
                itemsToShow = orderData.items;
                totalToShow = orderData.subtotal;
                console.log('Displaying stored order data in summary:', { itemsToShow, totalToShow });
              } catch (error) {
                console.error('Error parsing stored order data for display:', error);
              }
            }
          }

          return itemsToShow && itemsToShow.length > 0 ? (
            <div className="space-y-4">
              {itemsToShow.map((item, index) => {
                console.log(`Item ${index}:`, item); // Debug each item
                const itemTotal = (item.price && item.quantity) ? (item.price * item.quantity) : 0;
                return (
                  <div key={item.cartItemId || index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity || 0} | Type: {item.productType || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs.{itemTotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Rs.{item.price || 0} each</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2">
                <p className="font-semibold">Total:</p>
                <p className="font-semibold">Rs.{(() => {
                  // Always calculate total from actual items to ensure accuracy
                  const calculatedTotal = itemsToShow.reduce((sum, item) => {
                    const itemPrice = parseFloat(item.price) || 0;
                    const itemQuantity = parseInt(item.quantity) || 0;
                    return sum + (itemPrice * itemQuantity);
                  }, 0);
                  
                  // Use calculated total if it's greater than 0, otherwise use totalToShow
                  return calculatedTotal > 0 ? calculatedTotal.toFixed(2) : (totalToShow ? totalToShow.toFixed(2) : '0.00');
                })()}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No items found</p>
              <p className="text-sm">Cart Items: {JSON.stringify(cartItems)}</p>
              <p className="text-sm">Total Amount: {totalAmount}</p>
              <p className="text-sm">Stored Data: {localStorage.getItem('aqualink_order_data') ? 'Found' : 'Not found'}</p>
            </div>
          );
        })()}
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Delivery Address</h3>
          {addressLoaded && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              ✏️ Loaded from profile - Edit as needed
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Place/Building
            </label>
            <input
              type="text"
              name="place"
              value={deliveryAddress.place}
              onChange={handleAddressChange}
              className="w-full border rounded-md py-2 px-3"
              placeholder="Enter building or place name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="street"
              value={deliveryAddress.street}
              onChange={handleAddressChange}
              className="w-full border rounded-md py-2 px-3"
              placeholder="Enter street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <select
              name="district"
              value={deliveryAddress.district || ''}
              onChange={handleAddressChange}
              className="w-full border rounded-md py-2 px-3"
            >
              <option value="">Select District</option>
              {Object.keys(districtToTowns).sort().map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Town
            </label>
            <div className="relative">
              <select
                name="town"
                value={deliveryAddress.town || ''}
                onChange={handleAddressChange}
                className={`w-full border rounded-md py-2 px-3 ${!deliveryAddress.district ? 'bg-gray-100' : 'bg-white'}`}
                disabled={!deliveryAddress.district}
              >
                <option value="">
                  {!deliveryAddress.district ? 'Select district first' : 'Select Town'}
                </option>
                {availableTowns.sort().map(town => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
              {!deliveryAddress.district && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">⚠️</span>
                </div>
              )}
            </div>
            {!deliveryAddress.district && (
              <p className="mt-1 text-sm text-gray-500">Please select a district first</p>
            )}
          </div>
        </div>
      </div>

      {/* Quote Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Quote Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quotes should expire after:
            </label>
            <select
              value={preferences.quotesExpireAfter}
              onChange={(e) => handleQuoteExpiryChange(parseInt(e.target.value))}
              className="w-full border rounded-md py-2 px-3"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={36}>36 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-green-500 bg-green-50">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH_ON_DELIVERY"
              checked={paymentMethod === 'CASH_ON_DELIVERY'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">💵 Cash on Delivery</span>
                <span className="text-sm text-green-600 font-semibold">Recommended</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Pay when you receive your order</p>
            </div>
          </label>

          <label className="flex items-center p-4 border-2 rounded-lg cursor-not-allowed opacity-60 bg-gray-50 border-gray-300">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD_PAYMENT"
              disabled
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">💳 Card Payment</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">Coming Soon</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Online payment - Not available yet</p>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmitQuoteRequest}
          disabled={sending}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {sending ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting...
            </div>
          ) : (
            'Submit Quote Request'
          )}
        </button>
      </div>
    </div>
  );
};

export default EnhancedDeliveryRequest;
