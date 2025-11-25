import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// API Service for Industrial Stuff
const API_BASE_URL = 'http://localhost:8080/api/admin/industrial';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Get JWT token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const industrialApi = {
  // Get all industrial items
  getAllIndustrial: () => api.get(''),
  // Get industrial items by status
  getIndustrialByStatus: (status) => api.get(`/status/${status}`),
  // Get industrial item by ID
  getIndustrialById: (id) => api.get(`/${id}`),
  // Update industrial item status
  updateIndustrialStatus: (id, status) => api.put(`/${id}/status`, { activeStatus: status }),
  // Delete industrial item
  deleteIndustrial: (id) => api.delete(`/${id}`),
};

const StuffManagement = () => {
  const [filter, setFilter] = useState('pending');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadStats();
  }, [filter]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = filter === 'all' 
        ? await industrialApi.getAllIndustrial() 
        : await industrialApi.getIndustrialByStatus(filter);
      
      // Map the data to match your component structure
      const mappedProducts = response.data.map(industrial => ({
        id: industrial.id,
        name: industrial.name,
        category: industrial.category || 'Industrial',
        seller: industrial.nicNumber || 'Unknown Seller',
        price: `LKR ${industrial.price?.toFixed(2) || '0.00'}`,
        status: industrial.activeStatus.toLowerCase(),
        image: industrial.imageUrls && industrial.imageUrls.length > 0 
          ? industrial.imageUrls[0] 
          : null,
        imageUrls: industrial.imageUrls || [],
        createdAt: new Date(industrial.createDateAndTime).toLocaleDateString(),
        stock: industrial.stock,
        description: industrial.description,
        soldCount: industrial.soldCount || 0,
        inStock: industrial.inStock
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load industrial products');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await industrialApi.getAllIndustrial();
      const allProducts = response.data;
      
      const statsData = {
        total: allProducts.length,
        pending: allProducts.filter(p => p.activeStatus === 'PENDING').length,
        verified: allProducts.filter(p => p.activeStatus === 'VERIFIED').length,
        rejected: allProducts.filter(p => p.activeStatus === 'REJECTED').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      const statusMap = {
        'approved': 'VERIFIED',
        'rejected': 'REJECTED', 
        'pending': 'PENDING'
      };

      await industrialApi.updateIndustrialStatus(productId, statusMap[newStatus]);
      
      // Reload data after successful update
      await loadProducts();
      await loadStats();
      
      alert(`Industrial product status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update product status');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this industrial product?')) {
      try {
        await industrialApi.deleteIndustrial(productId);
        await loadProducts();
        await loadStats();
        alert('Industrial product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };

  const filteredProducts = products.filter(product => 
    filter === 'all' || product.status === filter
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Industrial Products Management</h1>
        <p className="text-gray-600">Manage and approve industrial equipment and supplies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Total Products', value: stats.total, color: 'bg-blue-500' },
          { label: 'Pending Approval', value: stats.pending, color: 'bg-yellow-500' },
          { label: 'Approved', value: stats.verified, color: 'bg-green-500' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-md p-3`}>
                <div className="text-white text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'verified', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} 
                {status !== 'all' && `(${stats[status] || 0})`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No industrial products found</h3>
          <p className="text-gray-500">No products found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              <div className="h-48 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <div className="text-4xl text-white">🏭</div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                <p className="text-sm text-gray-500 mb-2">by {product.seller}</p>
                
                {product.stock && (
                  <p className="text-sm text-gray-600 mb-2">
                    Stock: {product.stock} | Sold: {product.soldCount}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-blue-600">{product.price}</span>
                  <span className="text-xs text-gray-500">{product.createdAt}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {product.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(product.id, 'approved')}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(product.id, 'rejected')}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center justify-center"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center justify-center"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StuffManagement;
