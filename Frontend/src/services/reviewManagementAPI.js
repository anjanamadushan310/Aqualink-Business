import apiService from './apiService';

const BASE_URL = '/admin/review-management';

const reviewManagementAPI = {
  /**
   * Get all reviews with filters and pagination
   */
  getAllReviews: async (filters = {}, page = 0, size = 10) => {
    try {
      const response = await apiService.post(`${BASE_URL}/list?page=${page}&size=${size}`, filters);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * Get review details by ID and type
   */
  getReviewDetail: async (id, reviewType) => {
    try {
      const response = await apiService.get(`${BASE_URL}/${id}?reviewType=${reviewType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review detail:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   */
  deleteReview: async (id, reviewType) => {
    try {
      const response = await apiService.delete(`${BASE_URL}/${id}?reviewType=${reviewType}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Bulk delete reviews
   */
  bulkDeleteReviews: async (productReviewIds = [], serviceReviewIds = []) => {
    try {
      const response = await apiService.post(`${BASE_URL}/bulk-delete`, {
        productReviewIds,
        serviceReviewIds
      });
      return response.data;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  },

  /**
   * Get review statistics
   */
  getStatistics: async () => {
    try {
      const response = await apiService.get(`${BASE_URL}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review statistics:', error);
      throw error;
    }
  }
};

export default reviewManagementAPI;
