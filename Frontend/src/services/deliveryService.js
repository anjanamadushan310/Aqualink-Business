import apiService from './apiService';
import { API_ENDPOINTS } from './apiConfig';

class DeliveryService {
  // Get all assigned orders
  async getMyOrders() {
    return apiService.get(API_ENDPOINTS.DELIVERY.MY_ORDERS);
  }

  // Get pending deliveries
  async getPendingDeliveries() {
    return apiService.get(API_ENDPOINTS.DELIVERY.PENDING_DELIVERIES);
  }

  // Get orders by status
  async getOrdersByStatus(status) {
    return apiService.get(API_ENDPOINTS.DELIVERY.ORDERS_BY_STATUS(status));
  }

  // Update order status
  async updateOrderStatus(orderStatusUpdate) {
    return apiService.put(API_ENDPOINTS.DELIVERY.UPDATE_STATUS, orderStatusUpdate);
  }

  // Complete delivery
  async completeDelivery(orderId) {
    return apiService.put(API_ENDPOINTS.DELIVERY.COMPLETE_DELIVERY(orderId));
  }

  // Start delivery
  async startDelivery(orderId) {
    return apiService.put(API_ENDPOINTS.DELIVERY.START_DELIVERY(orderId));
  }

  // Mark delivery as delivered
  async markAsDelivered(orderId) {
    return apiService.put(API_ENDPOINTS.DELIVERY.MARK_AS_DELIVERED(orderId));
  }

  // Cancel delivery
  async cancelDelivery(orderId, reason) {
    return apiService.put(API_ENDPOINTS.DELIVERY.CANCEL_DELIVERY(orderId), { reason });
  }

  // Pickup order
  async pickupOrder(orderId) {
    return apiService.put(API_ENDPOINTS.DELIVERY.PICKUP_ORDER(orderId));
  }

  // Get delivery statistics
  async getDeliveryStats() {
    return apiService.get(API_ENDPOINTS.DELIVERY.STATS);
  }

  // Custom status update with notes
  async updateStatusWithNotes(orderId, newStatus, notes = '') {
    return this.updateOrderStatus({
      orderId,
      newStatus,
      notes
    });
  }

  // ========== NEW QUOTE-RELATED METHODS ==========

  // Get available quote requests for delivery persons
  async getAvailableQuoteRequests() {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.AVAILABLE);
      return {
        success: true,
        data: data,
        message: 'Requests fetched successfully'
      };
    } catch (error) {
      console.error('Error in getAvailableQuoteRequests:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch available quote requests'
      };
    }
  }

  // Create a delivery quote
  async createQuote(quoteData) {
    try {
      const data = await apiService.post(API_ENDPOINTS.DELIVERY_QUOTES.CREATE, quoteData);
      return {
        success: true,
        data: data,
        message: 'Quote created successfully'
      };
    } catch (error) {
      console.error('Error in createQuote:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create quote';
      if (error.message.includes('403')) {
        errorMessage = 'Access denied. You need DELIVERY_PERSON role to create quotes. Please ensure you are logged in as a delivery person.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid quote data. Please check all fields and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage
      };
    }
  }

  // Get delivery person's quotes
  async getMyQuotes() {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.MY_QUOTES);
      return {
        success: true,
        data: data,
        message: 'Quotes fetched successfully'
      };
    } catch (error) {
      console.error('Error in getMyQuotes:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch quotes'
      };
    }
  }

  // Update delivery quote (only for PENDING quotes)
  async updateQuote(quoteId, quoteData) {
    try {
      const data = await apiService.put(API_ENDPOINTS.DELIVERY_QUOTES.UPDATE_QUOTE(quoteId), quoteData);
      return {
        success: true,
        data: data,
        message: 'Quote updated successfully'
      };
    } catch (error) {
      console.error('Error in updateQuote:', error);
      
      let errorMessage = 'Failed to update quote';
      if (error.message.includes('403')) {
        errorMessage = 'Access denied. You can only update your own quotes.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid quote data. Please check all fields and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage
      };
    }
  }

  // Get order details for delivery person's accepted quote
  async getOrderDetailsForDelivery(orderId) {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.ORDER_DETAILS(orderId));
      return {
        success: true,
        data: data,
        message: 'Order details fetched successfully'
      };
    } catch (error) {
      console.error('Error in getOrderDetailsForDelivery:', error);
      
      let errorMessage = 'Failed to fetch order details';
      if (error.message.includes('403')) {
        errorMessage = 'Access denied. You need an accepted quote for this order.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Order not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage
      };
    }
  }

  // ========== CUSTOMER/SHOP OWNER METHODS ==========

  // Create initial order for delivery quote request (called when page loads)
  async createInitialOrder(requestData) {
    try {
      const data = await apiService.post(API_ENDPOINTS.DELIVERY_QUOTES.CREATE_INITIAL_ORDER, requestData);
      return {
        success: true,
        data: data,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('Error in createInitialOrder:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create initial order'
      };
    }
  }

  // Create a delivery quote request (update existing order with address)
  async createQuoteRequest(requestData) {
    try {
      const data = await apiService.post(API_ENDPOINTS.DELIVERY_QUOTES.REQUEST, requestData);
      return {
        success: true,
        data: data,
        message: 'Quote request created successfully'
      };
    } catch (error) {
      console.error('Error in createQuoteRequest:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create quote request'
      };
    }
  }

  // Get quotes for a specific request (legacy - by sessionId)
  async getQuotesForRequest(sessionId) {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.QUOTES_FOR_REQUEST(sessionId));
      return {
        success: true,
        data: data,
        message: 'Quotes fetched successfully'
      };
    } catch (error) {
      console.error('Error in getQuotesForRequest:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch quotes for request'
      };
    }
  }

  // Get quotes for a specific order (by orderId)
  async getQuotesForOrder(orderId) {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.QUOTES_FOR_ORDER(orderId));
      return {
        success: true,
        data: data,
        message: 'Quotes fetched successfully'
      };
    } catch (error) {
      console.error('Error in getQuotesForOrder:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to fetch quotes';
      if (error.message.includes('403')) {
        errorMessage = 'Access denied. You do not have permission to view quotes for this order. Please ensure you are logged in with the correct account (SHOP_OWNER, FARM_OWNER, or INDUSTRIAL_STUFF_SELLER role required).';
      } else if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Order not found or no quotes available yet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        data: [],
        message: errorMessage
      };
    }
  }

  // Accept a delivery quote
  async acceptQuote(quoteId) {
    try {
      const data = await apiService.post(API_ENDPOINTS.DELIVERY_QUOTES.ACCEPT(quoteId));
      return {
        success: true,
        data: data,
        message: 'Quote accepted successfully'
      };
    } catch (error) {
      console.error('Error in acceptQuote:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to accept quote';
      if (error.message.includes('403')) {
        errorMessage = 'Access denied. You need SHOP_OWNER, FARM_OWNER, or INDUSTRIAL_STUFF_SELLER role to accept quotes. Please ensure you are logged in with the correct customer account.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Quote not found or has been withdrawn.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage
      };
    }
  }

  // Get customer's quote requests
  async getMyQuoteRequests() {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.MY_REQUESTS);
      return {
        success: true,
        data: data,
        message: 'Quote requests fetched successfully'
      };
    } catch (error) {
      console.error('Error in getMyQuoteRequests:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch quote requests'
      };
    }
  }

  // Get specific quote request details
  async getQuoteRequest(sessionId) {
    try {
      const data = await apiService.get(API_ENDPOINTS.DELIVERY_QUOTES.REQUEST_DETAILS(sessionId));
      return {
        success: true,
        data: data,
        message: 'Quote request details fetched successfully'
      };
    } catch (error) {
      console.error('Error in getQuoteRequest:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch quote request details'
      };
    }
  }

  // ========== COVERAGE AREA MANAGEMENT METHODS ==========

  // Get coverage area and availability data
  async getCoverageAreaData() {
    return apiService.get(API_ENDPOINTS.DELIVERY.COVERAGE_AREA_MANAGEMENT);
  }

  // Update coverage area and availability data
  async updateCoverageAreaData(coverageData) {
    return apiService.put(API_ENDPOINTS.DELIVERY.COVERAGE_AREA_MANAGEMENT, coverageData);
  }

  // Update only availability status
  async updateAvailabilityStatus(isAvailable) {
    return apiService.put(`${API_ENDPOINTS.DELIVERY.AVAILABILITY_STATUS}?isAvailable=${isAvailable}`);
  }
}

export default new DeliveryService();