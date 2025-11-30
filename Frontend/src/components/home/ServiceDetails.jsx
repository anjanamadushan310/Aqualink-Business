import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle, Calendar, MapPin, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductReviewsSection from '../common/ProductReviewsSection';
import apiService from '../../services/apiService';
import ChatWithSeller from '../chat/ChatWithSeller';
import LoginModal from '../auth/LoginModal';
import BookingModal from './BookingModal';

const ServiceDetails = ({ service, onBookingSuccess }) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch review summary when component mounts or service changes
  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (service?.id) {
        try {
          const data = await apiService.get(`/services/${service.id}/reviews/summary`);
          setReviewSummary(data);
        } catch (err) {
          console.error('Error fetching review summary:', err);
        }
      }
    };
    fetchReviewSummary();
  }, [service?.id]);

  // Function to construct full image URL
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

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `http://localhost:8080/uploads/${cleanPath}`;
  };

  // Use service data from props
  const serviceData = useMemo(() => ({
    name: service?.name || "Service",
    price: service?.price || 0,
    maxPrice: service?.maxPrice,
    rating: reviewSummary?.averageRating || service?.rating || 0,
    reviewCount: reviewSummary?.totalReviews || service?.reviewCount || 0,
    description: service?.description || "No description available",
    district: service?.district,
    images: service?.imagePaths?.length > 0 ? service.imagePaths.map(getImageUrl) : [getImageUrl(null)],
    providerName: service?.providerName || "Service Provider"
  }), [service, reviewSummary]);

  const formatPrice = (price, maxPrice) => {
    const formatter = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    });

    if (maxPrice && maxPrice > price) {
      return `${formatter.format(price)} - ${formatter.format(maxPrice)}`;
    }
    return `from ${formatter.format(price)}`;
  };

  const handleImageSelect = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  const handleBookService = () => {
    if (!isAuthenticated()) {
      setPendingAction('book');
      setShowLoginModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      setPendingAction('cart');
      setShowLoginModal(true);
      return;
    }

    if (!service || !service.id) {
      alert('Service information is missing');
      return;
    }

    try {
      setAddingToCart(true);
      
      // Call addToCart with correct parameters: productId, productType, quantity
      await addToCart(service.id, 'service', 1);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Auto-navigate to cart page after successful addition
      setTimeout(() => {
        navigate('/cart');
      }, 1500); // Allow time to see success message
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add service to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleChatClick = () => {
    if (!isAuthenticated()) {
      setPendingAction('chat');
      setShowLoginModal(true);
      return;
    }
    if (user && user.userId === service?.serviceProviderId) {
      alert('You cannot chat with yourself');
      return;
    }
    setShowChat(true);
  };

  const handleLoginSuccess = () => {
    if (pendingAction === 'book') {
      setShowBookingModal(true);
    } else if (pendingAction === 'chat') {
      setShowChat(true);
    } else if (pendingAction === 'cart') {
      handleAddToCart();
    }
    setPendingAction(null);
  };

  // Star rating component
  const StarRating = ({ rating, size = 'w-4 h-4' }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i}
          className={`${size} ${
            i <= Math.floor(rating) 
              ? 'fill-yellow-400 text-yellow-400' 
              : i === Math.ceil(rating) && rating % 1 !== 0
                ? 'fill-yellow-200 text-yellow-200'
                : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="ml-2 font-semibold text-sm">{rating}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Service Info & Images */}
        <div>
          {/* Service Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-3">{serviceData.name}</h1>

            <div className="flex items-center gap-4 mb-3">
              <StarRating rating={serviceData.rating} />
              <button className="text-blue-600 hover:underline">
                ({serviceData.reviewCount} reviews)
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
               {serviceData.district && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {serviceData.district}
                </span>
              )}
            </div>
          </header>

          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnail Navigation */}
            <nav className="flex flex-col gap-2" aria-label="Service images">
              {serviceData.images.map((image, i) => (
                <button
                  key={i}
                  onClick={() => handleImageSelect(i)}
                  className={`w-16 h-16 border-2 rounded-lg overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedImage === i ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={image}
                    alt={`${serviceData.name} view ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </nav>

            {/* Main Image Display */}
            <div className="flex-1 relative">
              <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                <img
                  src={serviceData.images[selectedImage]}
                  alt={`${serviceData.name} - Main view`}
                  className="w-full h-80 object-cover transition-transform hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Options */}
        <div className="space-y-6">
          <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
            {/* Price Section */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Service Price</div>
              <div className="text-3xl font-bold text-green-600">
                {formatPrice(serviceData.price, serviceData.maxPrice)}
              </div>
            </div>

            {/* Provider Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <div className="text-sm text-gray-500">Provided by</div>
                    <div className="font-semibold">{serviceData.providerName}</div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Added {serviceData.name} to cart! Redirecting to cart...
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart || (user && user.userId === service?.serviceProviderId)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  addingToCart
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : user && user.userId === service?.serviceProviderId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
              <button 
                onClick={handleBookService}
                className="w-full py-3 px-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book Now
              </button>
              <button 
                className="w-full py-3 px-4 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChatClick}
                disabled={user && user.userId === service?.serviceProviderId}
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Provider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <section className="mt-8">
        <div className="border border-gray-300 rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Service Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {serviceData.description}
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section - View Only */}
      <ProductReviewsSection 
        productId={service?.id} 
        productType="SERVICE"
        allowReview={false}
        customEndpoint={`/services/${service?.id}/reviews`}
        customSummaryEndpoint={`/services/${service?.id}/reviews/summary`}
        onReviewUpdate={() => {
          if (service?.id) {
            apiService.get(`/services/${service.id}/reviews/summary`)
              .then(data => setReviewSummary(data))
              .catch(err => console.error('Error refreshing review summary:', err));
          }
        }}
      />

      {/* Chat Modal */}
      {showChat && service && (
        <ChatWithSeller
          product={{
            ...service,
            userId: service.serviceProviderId // Map serviceProviderId to userId for ChatWithSeller
          }}
          productType="SERVICE"
          onClose={() => setShowChat(false)}
        />
      )}
      
      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          service={service}
          onClose={() => setShowBookingModal(false)}
          onBookingSuccess={() => {
            setShowBookingModal(false);
            if (onBookingSuccess) onBookingSuccess();
          }}
          onChatClick={() => {
            // Close booking modal and open chat
            setShowBookingModal(false);
            handleChatClick();
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default ServiceDetails;
