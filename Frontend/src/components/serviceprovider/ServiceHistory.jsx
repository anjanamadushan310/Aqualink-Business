import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../../config';

const ServiceHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('COMPLETED');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalCancelled: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeTab, dateFilter, bookings]);

  const fetchBookingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/service-provider/services/bookings?page=0&size=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allBookings = data.content || [];
        setBookings(allBookings);
        calculateStats(allBookings);
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsList) => {
    const completed = bookingsList.filter(b => b.status === 'COMPLETED');
    const cancelled = bookingsList.filter(b => b.status === 'CANCELLED');
    const totalRevenue = completed.reduce((sum, b) => sum + (b.quotedPrice || 0), 0);
    
    setStats({
      totalCompleted: completed.length,
      totalCancelled: cancelled.length,
      totalRevenue: totalRevenue,
      averageRating: 0 // TODO: Calculate from reviews
    });
  };

  const filterBookings = () => {
    let filtered = bookings.filter(b => b.status === activeTab);

    if (dateFilter.startDate) {
      filtered = filtered.filter(b => 
        new Date(b.completedAt || b.bookedAt) >= new Date(dateFilter.startDate)
      );
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(b => 
        new Date(b.completedAt || b.bookedAt) <= new Date(dateFilter.endDate)
      );
    }

    setFilteredBookings(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Service', 'Customer', 'Date', 'Price', 'Status', 'Location'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.service?.name || 'N/A',
      b.customerName || 'N/A',
      formatDate(b.completedAt || b.bookedAt),
      b.quotedPrice || 0,
      b.status,
      b.customerLocation || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-history-${activeTab.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service History</h1>
          <p className="text-gray-600 mt-2">View your completed and cancelled service bookings</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredBookings.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-2">{stats.totalCompleted}</p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Cancelled</p>
              <p className="text-3xl font-bold mt-2">{stats.totalCancelled}</p>
            </div>
            <XCircleIcon className="w-12 h-12 text-red-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <CurrencyDollarIcon className="w-12 h-12 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Avg Rating</p>
              <p className="text-3xl font-bold mt-2">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}</p>
            </div>
            <StarIcon className="w-12 h-12 text-yellow-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({stats.totalCompleted})
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'CANCELLED'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({stats.totalCancelled})
            </button>
          </div>

          {/* Date Filters */}
          <div className="flex gap-2 items-center">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No {activeTab.toLowerCase()} bookings</h3>
          <p className="text-gray-500">
            {dateFilter.startDate || dateFilter.endDate
              ? 'No bookings found for the selected date range.'
              : `You don't have any ${activeTab.toLowerCase()} bookings yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Revenue Summary for Filtered Results */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700 font-medium">Showing {filteredBookings.length} bookings</p>
                {activeTab === 'COMPLETED' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Total revenue: {formatCurrency(filteredBookings.reduce((sum, b) => sum + (b.quotedPrice || 0), 0))}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className={`bg-white rounded-lg shadow-md border-l-4 p-6 hover:shadow-lg transition-shadow ${
                  activeTab === 'COMPLETED' ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {booking.service?.name || 'Service'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Customer: {booking.customerName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Booking ID: #{booking.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(booking.quotedPrice)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activeTab === 'COMPLETED' ? 'Earned' : 'Lost'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{booking.customerLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{booking.customerPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{activeTab === 'COMPLETED' ? 'Completed On' : 'Cancelled On'}</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(booking.completedAt || booking.bookedAt)}
                    </p>
                  </div>
                </div>

                {booking.customerRequirements && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Requirements</p>
                    <p className="text-sm text-gray-700">{booking.customerRequirements}</p>
                  </div>
                )}

                {booking.providerNotes && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Your Notes</p>
                    <p className="text-sm text-gray-700">{booking.providerNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
