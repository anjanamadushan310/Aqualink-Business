import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../../config';
import ChatWithSeller from '../chat/ChatWithSeller';

const ServiceRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [updating, setUpdating] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatProduct, setChatProduct] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Filter bookings based on status
    if (statusFilter === 'ALL') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/service-provider/services/bookings?page=0&size=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status, notes = '') => {
    setUpdating(bookingId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/service-provider/services/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
        setSelectedBooking(null);
        alert(`Booking ${status.toLowerCase()} successfully!`);
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking status');
    } finally {
      setUpdating(null);
    }
  };

  const openChat = (booking) => {
    if (booking.service) {
      setChatProduct({
        id: booking.service.id,
        userId: booking.customerId,
        name: booking.service.name,
        productType: 'SERVICE',
        imagePaths: booking.service.imagePaths || []
      });
      setShowChatModal(true);
    }
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `Rs. ${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
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

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusCount = (status) => {
    return bookings.filter(b => b.status === status).length;
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
        <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-gray-600 mt-2">Manage your incoming service booking requests</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'PENDING', label: 'Pending', color: 'yellow' },
            { key: 'CONFIRMED', label: 'Confirmed', color: 'blue' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'purple' },
            { key: 'COMPLETED', label: 'Completed', color: 'green' },
            { key: 'CANCELLED', label: 'Cancelled', color: 'red' },
            { key: 'ALL', label: 'All', color: 'gray' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === filter.key
                  ? `bg-${filter.color}-600 text-white`
                  : `bg-${filter.color}-100 text-${filter.color}-700 hover:bg-${filter.color}-200`
              }`}
            >
              {filter.label}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-30 text-xs">
                {filter.key === 'ALL' ? bookings.length : getStatusCount(filter.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No {statusFilter.toLowerCase()} requests</h3>
          <p className="text-gray-500">You don't have any {statusFilter.toLowerCase()} service requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {booking.service?.name || 'Service'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Booking ID: #{booking.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(booking.quotedPrice)}</p>
                    <p className="text-xs text-gray-500 mt-1">Quoted Price</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="font-medium text-gray-900">{booking.customerName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{booking.customerPhone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{booking.customerLocation || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Preferred Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(booking.preferredDate)} {booking.preferredTime && `• ${booking.preferredTime}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Requirements */}
                {booking.customerRequirements && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-blue-600 font-semibold mb-1">Customer Requirements</p>
                        <p className="text-sm text-gray-700">{booking.customerRequirements}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provider Notes */}
                {booking.providerNotes && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-purple-600 font-semibold mb-1">Your Notes</p>
                        <p className="text-sm text-gray-700">{booking.providerNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking Timeline */}
                <div className="mb-4 text-xs text-gray-500 flex flex-wrap gap-4">
                  <span>Booked: {formatDate(booking.bookedAt)}</span>
                  {booking.confirmedAt && <span>Confirmed: {formatDate(booking.confirmedAt)}</span>}
                  {booking.completedAt && <span>Completed: {formatDate(booking.completedAt)}</span>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'CONFIRMED', 'Booking confirmed by provider')}
                        disabled={updating === booking.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Accept Booking
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for cancellation (optional):');
                          updateBookingStatus(booking.id, 'CANCELLED', reason || 'Cancelled by provider');
                        }}
                        disabled={updating === booking.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Decline
                      </button>
                    </>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'IN_PROGRESS', 'Service started')}
                      disabled={updating === booking.id}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      <ClockIcon className="w-5 h-5" />
                      Mark In Progress
                    </button>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'COMPLETED', 'Service completed successfully')}
                      disabled={updating === booking.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Mark Completed
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    View Details
                  </button>

                  <button
                    onClick={() => openChat(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Chat with Customer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-semibold text-lg">{selectedBooking.service?.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-bold text-xl text-green-600">{formatCurrency(selectedBooking.quotedPrice)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{selectedBooking.customerName || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedBooking.customerPhone || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedBooking.customerLocation || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Preferred Date & Time</p>
                  <p className="font-medium">{formatDate(selectedBooking.preferredDate)} {selectedBooking.preferredTime && `• ${selectedBooking.preferredTime}`}</p>
                </div>

                {selectedBooking.customerRequirements && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Customer Requirements</p>
                    <p className="p-3 bg-gray-50 rounded border border-gray-200">{selectedBooking.customerRequirements}</p>
                  </div>
                )}

                {selectedBooking.providerNotes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Provider Notes</p>
                    <p className="p-3 bg-gray-50 rounded border border-gray-200">{selectedBooking.providerNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && chatProduct && (
        <ChatWithSeller
          product={chatProduct}
          productType="SERVICE"
          onClose={() => {
            setShowChatModal(false);
            setChatProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceRequests;
