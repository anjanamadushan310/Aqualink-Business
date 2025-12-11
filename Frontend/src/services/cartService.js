import apiService from './apiService';
import { API_ENDPOINTS } from './apiConfig';

class CartService {
  // Get current cart
  async getCart() {
    try {
      const result = await apiService.get(API_ENDPOINTS.CART.GET_CART);
      return result;
    } catch (error) {
      console.error('CartService: Failed to get cart:', error);
      // If cart doesn't exist, return empty cart
      return { cartItems: [], totalAmount: 0 };
    }
  }

  // Add item to cart
  async addToCart(productId, productType, quantity = 1) {
    const result = await apiService.post(API_ENDPOINTS.CART.ADD_TO_CART, {
      productId,
      productType, // 'fish' or 'industrial'
      quantity
    });
    return result;
  }

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity) {
    return apiService.put(API_ENDPOINTS.CART.UPDATE_CART, {
      cartItemId,
      quantity
    });
  }

  // Remove item from cart
  async removeFromCart(cartItemId) {
    return apiService.delete(`${API_ENDPOINTS.CART.REMOVE_FROM_CART}/${cartItemId}`);
  }

  // Remove all items for a specific seller from the cart
  async removeSellerItems(sellerId) {
    return apiService.delete(`${API_ENDPOINTS.CART.REMOVE_SELLER_ITEMS}/${sellerId}`);
  }

  // Clear entire cart
  async clearCart() {
    return apiService.delete(API_ENDPOINTS.CART.CLEAR_CART);
  }

  // Get cart item count (for badge)
  async getCartItemCount() {
    try {
      const cart = await this.getCart();
      return cart.cartItems ? cart.cartItems.reduce((total, item) => total + item.quantity, 0) : 0;
    } catch (error) {
      return 0;
    }
  }
}

export default new CartService();