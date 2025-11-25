import React, { useState, useEffect } from 'react';
import industrialStuffService from '../../services/industrialStuffService';
import { PencilIcon, CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function IndustrialStuffStockManagement() {
  const [industrialAds, setIndustrialAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApprovedIndustrialStuff();
  }, []);

  const fetchApprovedIndustrialStuff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await industrialStuffService.getMyApprovedIndustrialStuff();
      setIndustrialAds(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch industrial stuff ads');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (industrial) => {
    setEditingId(industrial.id);
    setEditStock(industrial.stock.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStock('');
  };

  const handleSaveStock = async (industrialId) => {
    const newStock = parseInt(editStock);
    
    if (isNaN(newStock) || newStock < 0) {
      alert('Please enter a valid stock number (0 or greater)');
      return;
    }

    try {
      setSaving(true);
      await industrialStuffService.updateIndustrialStuffStock(industrialId, newStock);
      
      // Update local state
      setIndustrialAds(industrialAds.map(industrial => 
        industrial.id === industrialId ? { ...industrial, stock: newStock } : industrial
      ));
      
      setEditingId(null);
      setEditStock('');
    } catch (err) {
      alert(err.message || 'Failed to update stock');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (industrial) => {
    if (industrial.imageUrls && industrial.imageUrls.length > 0) {
      return industrial.imageUrls[0];
    }
    return '/placeholder-industrial.jpg';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchApprovedIndustrialStuff}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Industrial Stuff Stock Management</h1>
        <p className="text-gray-600 mt-1">Manage stock levels for your approved industrial stuff advertisements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900">{industrialAds.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">
                {industrialAds.filter(i => i.stock > 0).length}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {industrialAds.filter(i => i.stock === 0).length}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Stuff Ads Table */}
      {industrialAds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Industrial Stuff Ads</h3>
          <p className="text-gray-600">You don't have any approved industrial stuff advertisements yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {industrialAds.map((industrial) => (
                  <tr key={industrial.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={getImageUrl(industrial)}
                            alt={industrial.name}
                            onError={(e) => {
                              e.target.src = '/placeholder-industrial.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{industrial.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {industrial.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Rs. {industrial.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === industrial.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-24 px-2 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className={`text-sm font-medium ${
                          industrial.stock === 0 ? 'text-red-600' : 
                          industrial.stock < 10 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {industrial.stock} units
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        industrial.stock === 0 
                          ? 'bg-red-100 text-red-800'
                          : industrial.stock < 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {industrial.stock === 0 ? 'Out of Stock' : industrial.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === industrial.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveStock(industrial.id)}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(industrial)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
