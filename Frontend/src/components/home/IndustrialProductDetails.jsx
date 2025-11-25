import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, MessageCircle, ShoppingCart, Truck, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductReviewsSection from '../common/ProductReviewsSection';

const IndustrialProductDetails = ({ industrial, onPurchaseSuccess }) => {
  const { addToCart, isLoading } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Function to construct full image URL
  const getImageUrl = useCallback((imagePath) => {
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

    const fullUrl = `http://localhost:8080/uploads/${imagePath}`;
    return fullUrl;
  }, []);

  // Use industrial data from props
  const productData = useMemo(() => ({
    name: industrial?.name || "Industrial Product",
    price: industrial?.price || 0,
    rating: industrial?.rating || 0,
    totalSold: industrial?.soldCount || 0,
    reviewCount: industrial?.reviewCount || 0,
    storeReviews: 3778,
    stock: industrial?.stock || 0,
    description: industrial?.description || "No description available",
    images: industrial?.imageUrls?.length > 0 ? industrial.imageUrls.map(getImageUrl) : [getImageUrl(null)],
    category: industrial?.category,
    district: industrial?.district,
    inStock: industrial?.inStock
  }), [industrial, getImageUrl]);

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
    const validQuantity = Math.max(1, parseInt(newQuantity) || 1);
    setQuantity(validQuantity);
  }, []);

  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const handleImageSelect = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  const toggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated()) {
      alert('Please log in to add items to cart');
      return;
    }

    if (!industrial || !industrial.id) {
      alert('Product information is missing');
      return;
    }

    try {
      setAddingToCart(true);
      
      // Call addToCart with correct parameters: productId, productType, quantity
      await addToCart(industrial.id, 'industrial', quantity);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Optional: Call onPurchaseSuccess callback
      if (onPurchaseSuccess) {
        onPurchaseSuccess({ industrial, quantity });
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
  }, [industrial, quantity, addToCart, isAuthenticated, onPurchaseSuccess, navigate]);

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
              {/* Category Badge */}
              {productData.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {productData.category}
                </span>
              )}
              
              {/* District Badge */}
              {productData.district && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  {productData.district}
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
                
                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart 
                    className={`w-6 h-6 ${
                      isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    }`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Purchase Options */}
        <div className="space-y-6">
          <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
            {/* Price Section */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Price per item</div>
              <div className="text-3xl font-bold text-green-600">{formattedPrice}</div>
              <div className="text-sm text-gray-600 mt-1">
                Stock: {productData.stock} available
                {!productData.inStock && (
                  <span className="ml-2 text-red-600 font-medium">(Out of Stock)</span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  min="1"
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
              </div>
            </div>

            {/* Subtotal */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">Subtotal: {formattedSubtotal}</div>
              <div className="text-sm text-gray-600">({quantity} items × {formattedPrice})</div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Added {quantity} {industrial?.name} to cart! Redirecting to cart...
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                disabled={productData.stock === 0 || addingToCart || !isAuthenticated}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  productData.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : !isAuthenticated
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
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
                      : !isAuthenticated 
                      ? 'Login to Add to Cart'
                      : 'Add to Cart'
                    }
                  </>
                )}
              </button>
              <button className="w-full py-3 px-4 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
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
        productId={industrial?.id} 
        productType="INDUSTRIAL"
        allowReview={false}
      />
    </div>
  );
};

export default IndustrialProductDetails;