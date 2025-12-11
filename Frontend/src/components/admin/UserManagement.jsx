import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import userManagementAPI from '../../services/userManagementAPI';
import UserEditModal from './modals/UserEditModal';
import UserDetailModal from './modals/UserDetailModal';
import RoleManagementModal from './modals/RoleManagementModal';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    active: '',
    enabled: '',
    verificationStatus: ''
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalItems: 0,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  });
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [pagination.page, pagination.size, pagination.sortBy, pagination.sortDirection]);

  useEffect(() => {
    // Reset to page 0 when filters change
    if (pagination.page !== 0) {
      setPagination(prev => ({ ...prev, page: 0 }));
    } else {
      fetchUsers();
    }
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = {};
      if (filters.search) filterParams.search = filters.search;
      if (filters.role) filterParams.role = filters.role;
      if (filters.active !== '') filterParams.active = filters.active === 'true';
      if (filters.enabled !== '') filterParams.enabled = filters.enabled === 'true';
      if (filters.verificationStatus) filterParams.verificationStatus = filters.verificationStatus;
      
      const response = await userManagementAPI.getAllUsers(filterParams, {
        page: pagination.page,
        size: pagination.size,
        sortBy: pagination.sortBy,
        sortDirection: pagination.sortDirection
      });
      
      setUsers(response.users || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalItems: response.totalItems || 0
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await userManagementAPI.getUserStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (column) => {
    setPagination(prev => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userManagementAPI.toggleUserStatus(userId);
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await userManagementAPI.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.size === 0) {
      alert('Please select users first');
      return;
    }

    const userIds = Array.from(selectedUsers);
    try {
      if (action === 'enable') {
        await userManagementAPI.bulkUpdateStatus(userIds, true);
      } else if (action === 'disable') {
        await userManagementAPI.bulkUpdateStatus(userIds, false);
      }
      setSelectedUsers(new Set());
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      alert('Failed to perform bulk action');
    }
  };

  const toggleUserSelection = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'SHOP_OWNER': 'bg-blue-100 text-blue-800',
      'FARM_OWNER': 'bg-green-100 text-green-800',
      'EXPORTER': 'bg-orange-100 text-orange-800',
      'SERVICE_PROVIDER': 'bg-cyan-100 text-cyan-800',
      'INDUSTRIAL_STUFF_SELLER': 'bg-indigo-100 text-indigo-800',
      'DELIVERY_PERSON': 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600">Total Users</div>
              <div className="text-2xl font-bold text-blue-900">{statistics.totalUsers || 0}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="text-2xl font-bold text-green-900">{statistics.activeUsers || 0}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm font-medium text-yellow-600">Inactive</div>
              <div className="text-2xl font-bold text-yellow-900">{statistics.inactiveUsers || 0}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-600">Enabled</div>
              <div className="text-2xl font-bold text-purple-900">{statistics.enabledUsers || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, NIC, or phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="SHOP_OWNER">Shop Owner</option>
              <option value="FARM_OWNER">Farm Owner</option>
              <option value="EXPORTER">Exporter</option>
              <option value="SERVICE_PROVIDER">Service Provider</option>
              <option value="INDUSTRIAL_STUFF_SELLER">Industrial Seller</option>
              <option value="DELIVERY_PERSON">Delivery Person</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={filters.enabled}
              onChange={(e) => handleFilterChange('enabled', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>

            <select
              value={filters.verificationStatus}
              onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Verification</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.size} user(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('enable')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Enable Selected
              </button>
              <button
                onClick={() => handleBulkAction('disable')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Disable Selected
              </button>
            </div>
          </div>
          <button
            onClick={() => setSelectedUsers(new Set())}
            className="text-gray-600 hover:text-gray-900"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table - Desktop */}
      {!loading && !error && (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('id')}
                    >
                      ID
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.logoUrl ? (
                            <img src={user.logoUrl} alt="" className="h-8 w-8 rounded-full mr-3" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                            >
                              {role.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                            user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                            user.active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Manage Roles"
                          >
                            <ShieldCheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={user.enabled ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            title={user.enabled ? 'Disable Account' : 'Enable Account'}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                    {user.logoUrl ? (
                      <img src={user.logoUrl} alt="" className="h-12 w-12 rounded-full" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">#{user.id}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {user.roles?.map((role, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRoleModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
                  >
                    Roles
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{pagination.page * pagination.size + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min((pagination.page + 1) * pagination.size, pagination.totalItems)}
                    </span> of{' '}
                    <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    {[...Array(pagination.totalPages)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(idx)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === idx
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {users.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
            fetchStatistics();
          }}
        />
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showRoleModal && selectedUser && (
        <RoleManagementModal
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
            fetchUsers();
            fetchStatistics();
          }}
        />
      )}

      {showDeleteModal && selectedUser && (
        <ConfirmDeleteModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
