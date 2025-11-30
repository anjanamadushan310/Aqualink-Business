import React, { useState } from 'react';
import ServiceDetails from './ServiceDetails';

const ServiceCard = ({ service, onBookingSuccess }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleViewDetails = () => {
    setShowDetailsModal(true);
  };

  const formatPrice = (price, maxPrice) => {
    if (maxPrice && maxPrice > price) {
      return `LKR ${price.toLocaleString()} - ${maxPrice.toLocaleString()}`;
    }
    return `from LKR ${price.toLocaleString()}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:8080${imagePath}`;
    }

    return `http://localhost:8080/uploads/${imagePath}`;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    setImageLoading(false);
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Service Image */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-200">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <img
            src={getImageUrl(service.imagePaths?.[0])}
            alt={service.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              service.available !== false 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {service.available !== false ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Service Name */}
          <div className="mb-3">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
              {service.name}
            </h4>

            {/* Rating and Review Count */}
            <div className="flex items-center gap-3 text-sm">
              {(service.averageRating > 0 || service.totalReviews > 0) && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span className="font-medium text-gray-700">
                    {service.averageRating ? service.averageRating.toFixed(1) : '0.0'}
                  </span>
                </div>
              )}
              {service.totalReviews > 0 && (
                <span className="text-gray-500">
                  <span className="font-medium text-blue-600">{service.totalReviews}</span> {service.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          {service.district && (
            <div className="mb-2 flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{service.district}</span>
            </div>
          )}

          {/* Category & Price */}
          <div className="space-y-2 mb-4">
            {service.category && (
              <div className="mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {service.category}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              {service.duration && (
                <div className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.duration}
                </div>
              )}
            </div>

            <div className="mb-4">
              <span className="text-xl font-bold text-blue-600">
                {formatPrice(service.price, service.maxPrice)}
              </span>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={handleViewDetails}
            disabled={service.available === false}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition duration-300 ${
              service.available === false
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
            }`}
          >
            {service.available === false ? 'Unavailable' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Service Details Modal */}
      {showDetailsModal && (
        <ServiceDetailsModal
          service={service}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onBookingSuccess={onBookingSuccess}
        />
      )}
    </>
  );
};

// Modal wrapper for ServiceDetails
const ServiceDetailsModal = ({ service, isOpen, onClose, onBookingSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Service Details Component */}
        <ServiceDetails
          service={service} 
          onBookingSuccess={onBookingSuccess}
        />
      </div>
    </div>
  );
};

export default ServiceCard;
