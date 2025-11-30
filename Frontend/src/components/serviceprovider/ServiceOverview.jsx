import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CubeIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../../config';

const ServiceOverview = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    activeServices: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageBookingValue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/service-provider/services/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/service-provider/services/bookings?page=0&size=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your services.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-yellow-600">● {stats.pendingBookings} Pending</span>
                <span className="text-green-600">● {stats.completedBookings} Done</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-2">
                This month: {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeServices}</p>
              <p className="text-xs text-gray-500 mt-2">
                Avg: {formatCurrency(stats.averageBookingValue)}/booking
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <CubeIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.totalReviews} reviews
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <StarIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
          <a href="/dashboard/service-requests" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All →
          </a>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {booking.service?.name || 'Service'}
                    </h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer: {booking.customerName || 'N/A'} • {booking.customerLocation || 'Location not specified'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Booked: {formatDate(booking.bookedAt)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-gray-900">{formatCurrency(booking.quotedPrice)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(booking.preferredDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/service-requests"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          <ClipboardDocumentListIcon className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg mb-2">Manage Requests</h3>
          <p className="text-sm text-blue-100">View and respond to booking requests</p>
          {stats.pendingBookings > 0 && (
            <div className="mt-3 inline-block bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              {stats.pendingBookings} Pending
            </div>
          )}
        </a>

        <a
          href="/dashboard/my-services"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <CubeIcon className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg mb-2">My Services</h3>
          <p className="text-sm text-purple-100">Manage your service listings</p>
          <div className="mt-3 inline-block bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
            {stats.activeServices} Active
          </div>
        </a>

        <a
          href="/dashboard/messages"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
        >
          <ArrowTrendingUpIcon className="w-8 h-8 mb-3" />
          <h3 className="font-bold text-lg mb-2">View Analytics</h3>
          <p className="text-sm text-green-100">Check your service history & earnings</p>
        </a>
      </div>
    </div>
  );
};

export default ServiceOverview;
