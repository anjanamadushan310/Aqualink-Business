import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, MessageSquare, Loader } from 'lucide-react';
import apiService from '../../services/apiService';

const BookingModal = ({ service, onClose, onBookingSuccess, onChatClick }) => {
  const [formData, setFormData] = useState({
    customerRequirements: '',
    preferredDate: '',
    preferredTime: '',
    customerLocation: '',
    customerPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Format date to ISO string if needed, or keep as is if backend parses it
      // The backend expects LocalDateTime.parse format, which is usually 'YYYY-MM-DDTHH:mm:ss'
      // HTML date input gives 'YYYY-MM-DD'. We might need to append time or let user pick time separately.
      
      const bookingPayload = {
        serviceId: service.id,
        ...formData,
        preferredDate: new Date(formData.preferredDate + 'T' + (formData.preferredTime || '00:00')).toISOString()
      };

      await apiService.post('/bookings/create', bookingPayload);
      
      onBookingSuccess();
    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.response?.data || 'Failed to book service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-1">Book Service</h2>
          <p className="text-blue-100 text-sm">{service.name}</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          {/* Advisory Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="bg-blue-100 p-2 rounded-full h-fit">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Before you book</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Please chat with the service provider first to agree on a date and time availability.
                </p>
                <button
                  type="button"
                  onClick={onChatClick}
                  className="text-sm bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <MessageSquare size={14} />
                  Chat with Provider
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    name="preferredDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="time"
                    name="preferredTime"
                    required
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="customerLocation"
                  required
                  placeholder="Enter address for service"
                  value={formData.customerLocation}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="customerPhone"
                  required
                  placeholder="Your contact number"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements / Notes</label>
              <textarea
                name="customerRequirements"
                rows="3"
                placeholder="Any specific details about the job..."
                value={formData.customerRequirements}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Confirming Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
