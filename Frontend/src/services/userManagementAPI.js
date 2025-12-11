import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const userManagementAPI = {
  // Get all users with filters and pagination
  getAllUsers: async (filters = {}, pagination = {}) => {
    try {
      const params = {
        page: pagination.page || 0,
        size: pagination.size || 20,
        sortBy: pagination.sortBy || 'createdAt',
        sortDirection: pagination.sortDirection || 'DESC',
        ...filters
      };

      const response = await axios.get(`${API_BASE_URL}/api/admin/user-management`, {
        params,
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user details by ID
  getUserDetails: async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/user-management/${userId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, data) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/user-management/${userId}`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (soft delete)
  deleteUser: async (userId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/user-management/${userId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user account status (enable/disable)
  toggleUserStatus: async (userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/user-management/${userId}/toggle-status`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Add role to user
  addRoleToUser: async (userId, role, reason = '') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/user-management/${userId}/roles`,
        { userId, role, reason },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding role to user:', error);
      throw error;
    }
  },

  // Remove role from user
  removeRoleFromUser: async (userId, role) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/user-management/${userId}/roles/${role}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  },

  // Reset user password
  resetPassword: async (userId, newPassword) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/user-management/${userId}/reset-password`,
        { newPassword },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Bulk update user status
  bulkUpdateStatus: async (userIds, enabled) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/user-management/bulk-update-status`,
        { userIds, enabled },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  },

  // Get user statistics
  getUserStatistics: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/user-management/statistics`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
};

export default userManagementAPI;
