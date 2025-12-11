import React, { useState, useEffect } from 'react';

const formatLkr = (amount) => {
  const value = Number(amount) || 0;
  return `Rs. ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ServiceAdsForm = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/service-provider/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setServices(data.content || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/service-provider/services/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data.content || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Service Provider Dashboard</h1>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Services
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings
              </button>
            </nav>
          </div>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Services</h2>
              <button
                onClick={() => setShowAddService(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Add New Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceProviderCard key={service?.id || Math.random()} service={service} onUpdate={fetchServices} />
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bookings</h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onUpdate={fetchBookings} />
              ))}
            </div>
          </div>
        )}

        {/* Add Service Modal */}
        {showAddService && (
          <AddServiceModal
            onClose={() => setShowAddService(false)}
            onSuccess={() => {
              setShowAddService(false);
              fetchServices();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Service Card for Provider
const ServiceProviderCard = ({ service, onUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!service) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Service data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{service.name || 'Unnamed Service'}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.approvalStatus)}`}>
          {service.approvalStatus || 'UNKNOWN'}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{service.description || 'No description'}</p>

      <div className="space-y-2 text-sm text-gray-600">
        <div>Category: {service.category || 'N/A'}</div>
        <div>Price: {formatLkr(service.price)}</div>
        <div>Rating: {service.reviewRate?.toFixed(1) || '0.0'} ({service.reviewCount || 0} reviews)</div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
          Edit
        </button>
        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
          View
        </button>
      </div>
    </div>
  );
};

// Booking Card
const BookingCard = ({ booking, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateBookingStatus = async (status, quotedPrice = null) => {
    if (!booking?.id) {
      alert('Invalid booking data');
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/service-provider/services/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          quotedPrice,
          providerNotes: ''
        })
      });

      if (response.ok) {
        alert('Booking updated successfully');
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!booking) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Booking data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.service?.name || 'Service Name'}</h3>
          <p className="text-sm text-gray-600">Booking #{booking.id || 'N/A'}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
          {booking.status || 'UNKNOWN'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <div className="font-medium">Customer Requirements:</div>
          <div>{booking.customerRequirements || 'N/A'}</div>
        </div>
        <div>
          <div className="font-medium">Preferred Date:</div>
          <div>{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'N/A'}</div>
        </div>
        <div>
          <div className="font-medium">Location:</div>
          <div>{booking.customerLocation || 'N/A'}</div>
        </div>
        <div>
          <div className="font-medium">Phone:</div>
          <div>{booking.customerPhone || 'N/A'}</div>
        </div>
      </div>

      {booking.status === 'PENDING' && (
        <div className="flex space-x-2">
          <button
            onClick={() => updateBookingStatus('CONFIRMED')}
            disabled={isUpdating}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
          >
            {isUpdating ? 'Updating...' : 'Confirm'}
          </button>
          <button
            onClick={() => updateBookingStatus('CANCELLED')}
            disabled={isUpdating}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {booking.status === 'CONFIRMED' && (
        <div className="flex space-x-2">
          <button
            onClick={() => updateBookingStatus('IN_PROGRESS')}
            disabled={isUpdating}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
          >
            Start Service
          </button>
        </div>
      )}

      {booking.status === 'IN_PROGRESS' && (
        <div className="flex space-x-2">
          <button
            onClick={() => updateBookingStatus('COMPLETED')}
            disabled={isUpdating}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-300"
          >
            Complete Service
          </button>
        </div>
      )}
    </div>
  );
};

// Add Service Modal
const AddServiceModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    maxPrice: '',
    duration: '',
    location: '',
    requirements: '',
  });
  const [images, setImages] = useState([]); // New state for images
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5); // Limit to 5 files
    setImages(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Create FormData to match backend expectations
      const formDataToSend = new FormData();

      // Convert service data to JSON string and append as 'serviceData'
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null
      };
      formDataToSend.append('serviceData', JSON.stringify(serviceData));

      // Append images to FormData
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      console.log('Sending FormData with serviceData:', serviceData);
      console.log('Number of images:', images.length);

      const response = await fetch('http://localhost:8080/api/service-provider/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header - let the browser set it automatically for FormData
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Service added successfully! It will be available after admin approval.');
        onSuccess();
      } else {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        throw new Error(`Failed to add service: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold">Add New Service</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Gardening">Gardening</option>
                  <option value="Painting">Painting</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({...formData, maxPrice: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 2 hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Customer location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="2"
                placeholder="What customer needs to provide..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images (up to 5)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {images.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Selected images ({images.length}/5):</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = images.filter((_, i) => i !== index);
                            setImages(newImages);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
              >
                {isSubmitting ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceAdsForm;
