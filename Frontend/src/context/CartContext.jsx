import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, token } = useAuth();

  const effectiveUserId = user?.userId ?? user?.id ?? null;
  const isLoggedIn = Boolean(token && effectiveUserId);

  const loadCart = useCallback(async () => {
    if (!token || !effectiveUserId) {
      console.log('Cannot load cart - user not authenticated');
      setCartItems([]);
      setTotalAmount(0);
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading cart data...');
      const cart = await cartService.getCart();
      console.log('Cart data received:', cart);
      
      const items = Array.isArray(cart.cartItems) ? cart.cartItems : [];
      
      setCartItems(items);
      setTotalAmount(cart.totalAmount || 0);
      setCartCount(items.reduce((total, item) => total + (item.quantity || 0), 0));
      
      console.log(`Cart loaded successfully: ${items.length} items, total: ${cart.totalAmount}`);
    } catch (error) {
      console.error('Failed to load cart:', error);
      if (error.message && error.message.includes('auth')) {
        setCartItems([]);
        setTotalAmount(0);
        setCartCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [token, effectiveUserId]);

  useEffect(() => {
    if (isLoggedIn) {
      console.log('Authentication detected, loading cart for user:', effectiveUserId);
      loadCart();
    } else {
      console.log('User not authenticated, clearing cart state...');
      setCartItems([]);
      setTotalAmount(0);
      setCartCount(0);
    }
  }, [isLoggedIn, effectiveUserId, loadCart]);

  const addToCart = async (productId, productType, quantity = 1) => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      setLoading(true);
      console.log(`Adding to cart: productId=${productId}, type=${productType}, quantity=${quantity}`);
      
      await cartService.addToCart(productId, productType, quantity);
      
      console.log('Item added successfully, reloading cart...');
      await loadCart(); // Reload cart to get updated data
      
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to modify your cart');
    }

    try {
      setLoading(true);
      console.log(`Updating cart item: ${cartItemId} to quantity: ${quantity}`);
      
      await cartService.updateCartItem(cartItemId, quantity);
      
      console.log('Cart item updated successfully, reloading cart...');
      await loadCart();
      
      return true;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!isAuthenticated()) {
      throw new Error('Please log in to modify your cart');
    }

    try {
      setLoading(true);
      console.log(`Removing cart item: ${cartItemId}`);
      
      await cartService.removeFromCart(cartItemId);
      
      console.log('Cart item removed successfully, reloading cart...');
      await loadCart();
      
      return true;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      
      // Only call API if authenticated
      if (isAuthenticated()) {
        await cartService.clearCart();
      }
      
      // Always clear local state
      setCartItems([]);
      setTotalAmount(0);
      setCartCount(0);
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Still clear local state even if API fails
      setCartItems([]);
      setTotalAmount(0);
      setCartCount(0);
      // Don't throw error to prevent logout from failing
      return true;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cartItems,
    cartCount,
    totalAmount,
    loading,
    isLoading: loading, // Alias for compatibility
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart, // Expose loadCart for manual refresh
    refreshCart: loadCart // Another alias for manual refresh
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};