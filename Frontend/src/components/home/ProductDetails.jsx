import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, MessageCircle, ShoppingCart, Truck, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductReviewsSection from '../common/ProductReviewsSection';
import apiService from '../../services/apiService';
import ChatWithSeller from '../chat/ChatWithSeller';
import LoginModal from '../auth/LoginModal';

const ProductDetails = ({ fish, onPurchaseSuccess }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(fish?.minimumQuantity || 1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch review summary when component mounts or fish changes
  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (fish?.id) {
        try {
          const data = await apiService.get(`/product-reviews/product/${fish.id}/FISH/summary`);
          setReviewSummary(data);
        } catch (err) {
          console.error('Error fetching review summary:', err);
        }
      }
    };
    fetchReviewSummary();
  }, [fish?.id]);

  // Function to construct full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      // Use a data URL for a placeholder image (gray square)
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      const fullUrl = `http://localhost:8080${imagePath}`;
      return fullUrl;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullUrl = `http://localhost:8080/uploads/${cleanPath}`;
    return fullUrl;
  };

  // Use fish data from props
  const productData = useMemo(() => ({
    name: fish?.name || "Fish Product",
    price: fish?.price || 0,
    rating: reviewSummary?.averageRating || fish?.rating || 0, // Use live review rating
    totalSold: fish?.totalSold || 0, // Dynamic total sold from backend
    reviewCount: reviewSummary?.totalReviews || fish?.reviewCount || 0, // Use live review count
    storeReviews: 3778, // You can add this to your fish model later
    minQuantity: fish?.minimumQuantity || 1,
    stock: fish?.stock || 0,
    description: fish?.description || "No description available",
    images: fish?.imageUrls?.length > 0 ? fish.imageUrls.map(getImageUrl) : [getImageUrl(null)]
  }), [fish, reviewSummary]);

  // Memoized calculations
  const subtotal = useMemo(() => quantity * productData.price, [quantity, productData.price]);
  
  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(productData.price), [productData.price]);

  const formattedSubtotal = useMemo(() => 
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(subtotal), [subtotal]);

  // Optimized event handlers
  const handleQuantityChange = useCallback((newQuantity) => {
    const validQuantity = Math.max(productData.minQuantity, parseInt(newQuantity) || productData.minQuantity);
    setQuantity(validQuantity);
  }, [productData.minQuantity]);

  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(prev => Math.max(productData.minQuantity, prev - 1));
  }, [productData.minQuantity]);

  const handleImageSelect = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setPendingAction('cart');
      setShowLoginModal(true);
      return;
    }

    // Check if user has SHOP_OWNER role
    if (!user?.roles?.includes('SHOP_OWNER')) {
      setShowRoleModal(true);
      return;
    }

    if (!fish || !fish.id) {
      alert('Product information is missing');
      return;
    }

    try {
      setAddingToCart(true);
      
      // Call addToCart with correct parameters: productId, productType, quantity
      await addToCart(fish.id, 'fish', quantity);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Optional: Call onPurchaseSuccess callback
      if (onPurchaseSuccess) {
        onPurchaseSuccess({ fish, quantity });
      }
      
      // Auto-navigate to cart page after successful addition
      setTimeout(() => {
        navigate('/cart');
      }, 1500); // Allow time to see success message
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  }, [fish, quantity, addToCart, isAuthenticated, onPurchaseSuccess, navigate, user]);

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

  const handleChatClick = () => {
    if (!isAuthenticated()) {
      setPendingAction('chat');
      setShowLoginModal(true);
      return;
    }
    if (user && user.userId === fish?.userId) {
      alert('You cannot chat with yourself');
      return;
    }
    setShowChat(true);
  };

  const handleLoginSuccess = () => {
    if (pendingAction === 'cart') {
      handleAddToCart();
    } else if (pendingAction === 'chat') {
      setShowChat(true);
    }
    setPendingAction(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Product Info & Images */}
        <div>
          {/* Product Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-3">{productData.name}</h1>

            <div className="flex items-center gap-4 mb-3">
              <StarRating rating={productData.rating} />
              <span className="text-gray-600">{productData.totalSold.toLocaleString()} Sold</span>
              <button className="text-blue-600 hover:underline">
                ({productData.reviewCount} reviews)
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              {/* Verified Badge */}
            {fish.activeStatus === 'VERIFIED' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                ✓ Verified
              </span>
            )}
            
            </div>
          </header>

          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnail Navigation */}
            <nav className="flex flex-col gap-2" aria-label="Product images">
              {productData.images.map((image, i) => (
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
                    alt={`${productData.name} view ${i + 1}`}
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
                  src={productData.images[selectedImage]}
                  alt={`${productData.name} - Main view`}
                  className="w-full h-80 object-cover transition-transform hover:scale-110"
                />
                
                
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Purchase Options */}
        <div className="space-y-6">
          <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
            {/* Price Section */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Price per fish</div>
              <div className="text-3xl font-bold text-green-600">{formattedPrice}</div>
              <div className="text-sm text-gray-600 mt-1">Stock: {productData.stock} available</div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= productData.minQuantity}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  min={productData.minQuantity}
                  max={productData.stock}
                  step={1}
                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Quantity"
                />
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= productData.stock}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">min {productData.minQuantity}</span>
              </div>
            </div>

            {/* Subtotal */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">Subtotal: {formattedSubtotal}</div>
              <div className="text-sm text-gray-600">({quantity} fish × {formattedPrice})</div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Added {quantity} {fish?.name} to cart! Redirecting to cart...
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                disabled={productData.stock === 0 || addingToCart}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  productData.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-blue-400 text-white cursor-not-allowed'
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
                    {productData.stock === 0 
                      ? 'Out of Stock' 
                      : 'Add to Cart'
                    }
                  </>
                )}
              </button>
              <button 
                className="w-full py-3 px-4 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChatClick}
                disabled={user && user.userId === fish?.userId}
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Seller
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <section className="mt-8">
        <div className="border border-gray-300 rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Product Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {productData.description}
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section - View Only */}
      <ProductReviewsSection 
        productId={fish?.id} 
        productType="FISH"
        allowReview={false}
        onReviewUpdate={() => {
          // Refresh review summary when a review is updated
          if (fish?.id) {
            apiService.get(`/product-reviews/product/${fish.id}/FISH/summary`)
              .then(data => setReviewSummary(data))
              .catch(err => console.error('Error refreshing review summary:', err));
          }
        }}
      />

      {/* Role Access Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowRoleModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <User className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Shop Owner Account Required
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Only Shop Owners can purchase fish from this platform.
                      </p>
                      <div className="mt-4 bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-700 font-medium mb-1">How to upgrade:</p>
                        <ol className="list-decimal list-inside text-sm text-blue-600 space-y-1">
                          <li>Go to <strong>Profile Menu</strong> (top right)</li>
                          <li>Select <strong>My Profile</strong></li>
                          <li>Click <strong>Add Additional Role</strong></li>
                          <li>Choose <strong>Register as Shop Owner</strong></li>
                        </ol>
                      </div>
                      <p className="mt-3 text-xs text-gray-400">
                        Note: You can have multiple roles on the same account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => navigate('/user-profile')}
                >
                  Go to Profile
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && fish && (
        <ChatWithSeller
          product={fish}
          productType="FISH"
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Login Modal - New Addition */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess} // Handle login success
        />
      )}
    </div>
  );
};

export default ProductDetails;
