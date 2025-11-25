import apiService from './apiService';

const productReviewService = {
  // Create a new review
  createReview: async (reviewData) => {
    const response = await apiService.post('/product-reviews', reviewData);
    return response.data;
  },

  // Get all reviews for a product
  getProductReviews: async (productId, productType) => {
    const response = await apiService.get(`/product-reviews/product/${productId}/${productType}`);
    return response.data;
  },

  // Get rating summary for a product
  getProductRatingsSummary: async (productId, productType) => {
    const response = await apiService.get(`/product-reviews/product/${productId}/${productType}/summary`);
    return response.data;
  },

  // Get user's reviews
  getUserReviews: async () => {
    const response = await apiService.get('/product-reviews/my-reviews');
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    const response = await apiService.put(`/product-reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await apiService.delete(`/product-reviews/${reviewId}`);
    return response.data;
  },

  // Check if user has reviewed a product
  checkIfUserReviewed: async (productId, productType) => {
    const response = await apiService.get(`/product-reviews/check/${productId}/${productType}`);
    return response.data;
  }
};

export default productReviewService;
