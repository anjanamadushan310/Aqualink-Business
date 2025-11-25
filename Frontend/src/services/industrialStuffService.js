import api from './api';
import API_ENDPOINTS from './apiConfig';

const industrialStuffService = {
  // Get all available industrial stuff
  getAllIndustrialStuff: async () => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.INDUSTRIAL);
    return response.data;
  },

  // Get industrial stuff by ID
  getIndustrialStuffById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.INDUSTRIAL_DETAILS(id));
    return response.data;
  },

  // Search industrial stuff
  searchIndustrialStuff: async (query) => {
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS.INDUSTRIAL}/search`, {
      params: { q: query }
    });
    return response.data;
  },

  // Get my approved industrial stuff ads (for sellers)
  getMyApprovedIndustrialStuff: async () => {
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS.INDUSTRIAL}/my-approved`);
    return response.data;
  },

  // Update industrial stuff stock
  updateIndustrialStuffStock: async (industrialId, newStock) => {
    const response = await api.put(
      `${API_ENDPOINTS.PRODUCTS.INDUSTRIAL}/${industrialId}/stock`,
      { stock: newStock }
    );
    return response.data;
  },

  // Purchase industrial stuff
  purchaseIndustrialStuff: async (purchaseData) => {
    const response = await api.post(
      `${API_ENDPOINTS.PRODUCTS.INDUSTRIAL}/${purchaseData.industrialId}/purchase`,
      purchaseData
    );
    return response.data;
  }
};

export default industrialStuffService;
