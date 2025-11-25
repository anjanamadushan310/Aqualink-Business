import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

// API Service integrated within the component
const API_BASE_URL = 'http://localhost:8080/api/admin/fish';

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

const fishApi = {
  // Get all fish
  getAllFish: () => api.get(''),
  
  // Get fish by status
  getFishByStatus: (status) => api.get(`/status/${status}`),
  
  // Get fish by ID
  getFishById: (id) => api.get(`/${id}`),
  
  // Update fish status
  updateFishStatus: (id, status) => api.put(`/${id}/status`, { activeStatus: status }),
  
  // Delete fish
  deleteFish: (id) => api.delete(`/${id}`),
  
  // Get statistics
  getFishStats: () => api.get('/stats')
};

const ProductManagement = () => {
  const [filter, setFilter] = useState('pending');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
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
        ? await fishApi.getAllFish()
        : await fishApi.getFishByStatus(filter);
      
      // Map the data to match your component structure
      const mappedProducts = response.data.map(fish => ({
        id: fish.id,
        name: fish.name,
        category: 'Fish',
        seller: fish.nicNumber || 'Unknown Seller',
        price: `LKR ${fish.price?.toFixed(2) || '0.00'}`,
        status: fish.activeStatus.toLowerCase(),
        // Use the first image URL or fallback to emoji
        image: fish.imageUrls && fish.imageUrls.length > 0 ? fish.imageUrls[0] : null,
        imageUrls: fish.imageUrls || [],
        createdAt: new Date(fish.createDateAndTime).toLocaleDateString(),
        stock: fish.stock,
        description: fish.description
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load fish ads');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fishApi.getFishStats();
      setStats(response.data);
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
      
      await fishApi.updateFishStatus(productId, statusMap[newStatus]);
      
      // Reload data after successful update
      await loadProducts();
      await loadStats();
      
      // Show success message (you can use a toast library here)
      alert(`Fish ad status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update fish ad status');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this fish ad?')) {
      try {
        await fishApi.deleteFish(productId);
        await loadProducts();
        await loadStats();
        alert('Fish ad deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete fish ad');
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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <button 
          onClick={() => loadProducts()} 
          className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fish Ads Management</h1>
          <p className="text-gray-600 mt-1">Review and manage fish advertisements from farm owners</p>
        </div>
        <button 
          onClick={() => { loadProducts(); loadStats(); }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fish Ads', value: stats.total || 0, color: 'bg-blue-500' },
          { label: 'Pending Review', value: stats.pending || 0, color: 'bg-yellow-500' },
          { label: 'Verified', value: stats.verified || 0, color: 'bg-green-500' },
          { label: 'Rejected', value: stats.rejected || 0, color: 'bg-red-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className={`w-8 h-8 ${stat.color} rounded-lg mb-2`}></div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {['all', 'pending', 'verified', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'verified' ? 'approved' : status}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Image Display */}
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <span 
                className="text-6xl" 
                style={{ display: product.image ? 'none' : 'block' }}
              >
                🐠
              </span>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)} capitalize`}>
                  {product.status === 'verified' ? 'approved' : product.status}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              <p className="text-sm text-gray-500 mb-2">by {product.seller}</p>
              {product.stock && (
                <p className="text-sm text-gray-500 mb-2">Stock: {product.stock}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-teal-600">{product.price}</span>
                <div className="flex space-x-1">
                  {product.status === 'pending' && (
                    <>
                      <button 
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Approve"
                        onClick={() => handleStatusUpdate(product.id, 'approved')}
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Reject"
                        onClick={() => handleStatusUpdate(product.id, 'rejected')}
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button 
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No fish ads found for the selected filter.</p>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
