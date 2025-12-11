import apiService from './apiService';

const BASE_URL = '/admin/earnings-management';

const earningsManagementAPI = {
  // Get all transactions with filters and pagination
  getAllTransactions: async (filters = {}, page = 0, size = 20) => {
    try {
      const response = await apiService.post(
        `${BASE_URL}/list?page=${page}&size=${size}`,
        filters
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings transactions:', error);
      throw error;
    }
  },

  // Get earnings statistics
  getStatistics: async () => {
    try {
      const response = await apiService.get(`${BASE_URL}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings statistics:', error);
      throw error;
    }
  }
};

export default earningsManagementAPI;
