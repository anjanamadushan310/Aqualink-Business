# Product Review and Rating System Documentation

## Overview
A comprehensive review and rating system for Fish and Industrial products in the Aqualink platform. Customers can rate products (1-5 stars), write detailed reviews, and view ratings summaries with distribution charts.

---

## Backend Implementation

### 1. Entity: ProductReview
**Location:** `Backend/src/main/java/com/example/aqualink/entity/ProductReview.java`

**Key Features:**
- Unique constraint: One review per user per product
- Supports both Fish and Industrial products via `productType` field
- Links to orders for verified purchase badges
- Automatic timestamp on creation
- Rating validation (1-5 stars)

**Fields:**
```java
- id: Long (Primary Key)
- user: User (ManyToOne - reviewer)
- productId: Long (product reference)
- productType: String (FISH or INDUSTRIAL)
- productName: String (cached for performance)
- order: Order (optional - for verified purchases)
- rating: Integer (1-5)
- comment: String (TEXT, max 1000 chars)
- reviewedAt: LocalDateTime
- verifiedPurchase: Boolean
```

### 2. Repository: ProductReviewRepository
**Location:** `Backend/src/main/java/com/example/aqualink/repository/ProductReviewRepository.java`

**Key Queries:**
- `findByProductIdAndProductType()` - Get all reviews for a product
- `findAverageRatingByProductIdAndProductType()` - Calculate average rating
- `countByProductIdAndProductType()` - Total review count
- `getRatingDistribution()` - 5-star to 1-star breakdown
- `findVerifiedPurchaseReviews()` - Only verified purchases
- `existsByUserIdAndProductIdAndProductType()` - Check duplicate reviews

### 3. Service: ProductReviewService
**Location:** `Backend/src/main/java/com/example/aqualink/service/ProductReviewService.java`

**Business Logic:**
- ✅ Validates product exists before review
- ✅ Prevents duplicate reviews from same user
- ✅ Verifies order ownership for verified purchases
- ✅ Checks product is in order before marking verified
- ✅ Calculates rating summaries with distributions
- ✅ Enforces user can only modify their own reviews

**Key Methods:**
```java
createReview(request, userId)          // Submit new review
getProductReviews(productId, type)     // Get all reviews
getProductRatingsSummary(id, type)     // Rating stats + recent reviews
getUserReviews(userId)                 // User's review history
updateReview(reviewId, request, userId) // Edit existing review
deleteReview(reviewId, userId)         // Remove review
hasUserReviewedProduct(...)            // Check review status
```

### 4. Controller: ProductReviewController
**Location:** `Backend/src/main/java/com/example/aqualink/controller/ProductReviewController.java`

**REST Endpoints:**

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/product-reviews` | ✅ SHOP_OWNER, EXPORTER, FARM_OWNER | Create review |
| GET | `/api/product-reviews/product/{id}/{type}` | ❌ | Get product reviews |
| GET | `/api/product-reviews/product/{id}/{type}/summary` | ❌ | Get rating summary |
| GET | `/api/product-reviews/my-reviews` | ✅ | Get user's reviews |
| PUT | `/api/product-reviews/{id}` | ✅ | Update review |
| DELETE | `/api/product-reviews/{id}` | ✅ | Delete review |
| GET | `/api/product-reviews/check/{id}/{type}` | ✅ | Check if reviewed |

### 5. DTOs

**ProductReviewRequestDTO:**
```java
- productId: Long (required)
- productType: String (FISH or INDUSTRIAL, required)
- rating: Integer (1-5, required)
- comment: String (max 1000 chars, optional)
- orderId: Long (optional - for verified purchase)
```

**ProductReviewResponseDTO:**
```java
- id, userId, userName, productId, productType, productName
- rating, comment, reviewedAt
- verifiedPurchase, orderId
```

**ProductRatingsSummaryDTO:**
```java
- productId, productType
- averageRating: Double (rounded to 1 decimal)
- totalReviews: Long
- ratingDistribution: Map<Integer, Long> (5→count, 4→count, ...)
- recentReviews: List<ProductReviewResponseDTO> (top 5)
```

---

## Frontend Implementation

### 1. Components

#### StarRating.jsx
**Location:** `Frontend/src/components/common/StarRating.jsx`

**Props:**
- `rating`: Number (0-5)
- `maxStars`: Number (default 5)
- `size`: String ('sm', 'md', 'lg', 'xl')
- `interactive`: Boolean (clickable stars)
- `onRatingChange`: Function (called when star clicked)

**Features:**
- Yellow filled stars for rating
- Gray empty stars
- Interactive mode for selecting rating
- Responsive sizing

#### ReviewForm.jsx
**Location:** `Frontend/src/components/common/ReviewForm.jsx`

**Props:**
- `productId`: Number
- `productType`: String ('FISH' or 'INDUSTRIAL')
- `orderId`: Number (optional)
- `onReviewSubmitted`: Function
- `onCancel`: Function

**Features:**
- Interactive star rating selector
- Text area for comments (1000 char limit)
- Character counter
- Validation (rating required)
- Loading states
- Error handling

#### ReviewItem.jsx
**Location:** `Frontend/src/components/common/ReviewItem.jsx`

**Props:**
- `review`: Object (review data)
- `currentUserId`: Number
- `onDelete`: Function

**Features:**
- User avatar with initial
- Formatted date display
- Star rating display
- "Verified Purchase" badge
- Delete button (only for own reviews)

#### ProductReviewsSection.jsx
**Location:** `Frontend/src/components/common/ProductReviewsSection.jsx`

**Props:**
- `productId`: Number
- `productType`: String
- `allowReview`: Boolean

**Features:**
- **Rating Summary Card:**
  - Large average rating display
  - Star visualization
  - Total review count
  - 5-tier distribution bars

- **Write Review:**
  - Button to open review form
  - Checks if user already reviewed
  - Shows helpful messages

- **Reviews List:**
  - All reviews sorted by date (newest first)
  - Delete functionality for own reviews
  - Empty state message

### 2. Service
**Location:** `Frontend/src/services/productReviewService.js`

Provides clean API methods:
```javascript
createReview(reviewData)
getProductReviews(productId, productType)
getProductRatingsSummary(productId, productType)
getUserReviews()
updateReview(reviewId, reviewData)
deleteReview(reviewId)
checkIfUserReviewed(productId, productType)
```

### 3. Integration

**ProductDetails.jsx (Fish Products):**
```jsx
import ProductReviewsSection from '../common/ProductReviewsSection';

<ProductReviewsSection 
  productId={fish?.id} 
  productType="FISH"
  allowReview={isAuthenticated()}
/>
```

**IndustrialProductDetails.jsx (Industrial Products):**
```jsx
import ProductReviewsSection from '../common/ProductReviewsSection';

<ProductReviewsSection 
  productId={industrial?.id} 
  productType="INDUSTRIAL"
  allowReview={isAuthenticated()}
/>
```

---

## Database Schema

**Table: product_reviews**
```sql
CREATE TABLE product_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_type VARCHAR(255) NOT NULL,
    product_name VARCHAR(255),
    order_id BIGINT,
    rating INT NOT NULL,
    comment TEXT,
    reviewed_at DATETIME NOT NULL,
    verified_purchase BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    
    UNIQUE KEY unique_user_product (user_id, product_id, product_type)
);
```

**Indexes:**
- Primary key on `id`
- Foreign keys on `user_id`, `order_id`
- Unique constraint on `(user_id, product_id, product_type)`
- Composite index on `(product_id, product_type)` for fast queries

---

## User Flows

### 1. Customer Reviews a Product

**Prerequisites:**
- User must be logged in
- User must have SHOP_OWNER, EXPORTER, or FARM_OWNER role
- User can only review each product once

**Steps:**
1. Navigate to product details page
2. Scroll to reviews section
3. Click "Write a Review" button
4. Select rating (1-5 stars)
5. Optionally write detailed comment
6. Click "Submit Review"
7. Review appears immediately in list
8. Button changes to "You have already reviewed this product"

### 2. Viewing Product Reviews

**Anyone can view:**
- No login required
- Shows average rating prominently
- Distribution chart (5-star breakdown)
- Recent reviews (top 5)
- All reviews in chronological order

### 3. Managing Reviews

**User can:**
- Delete own reviews (shows delete button)
- Cannot edit reviews (must delete and create new)
- Cannot review same product twice

---

## Features & Validations

### ✅ Implemented Features
1. ⭐ 1-5 star rating system
2. 📝 Text reviews (optional, max 1000 chars)
3. 🛡️ Verified purchase badges (if linked to order)
4. 📊 Rating distribution visualization
5. 🔢 Average rating calculation (rounded to 1 decimal)
6. 👤 User attribution with names
7. 📅 Review timestamps
8. 🚫 Duplicate review prevention
9. 🗑️ Delete own reviews
10. 🔒 Role-based access control

### ✅ Business Rules
1. One review per user per product
2. Must own order to mark as verified purchase
3. Product must exist before review
4. Only review author can delete
5. Rating must be 1-5
6. Comment max 1000 characters

### ✅ Security
1. JWT authentication required for writing reviews
2. User can only modify own reviews
3. Order ownership verified for verified purchases
4. SQL injection prevented via JPA
5. XSS prevented via React escaping

---

## Usage Examples

### Backend API Call (Create Review)
```bash
POST /api/product-reviews
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "productId": 12,
  "productType": "FISH",
  "rating": 5,
  "comment": "Excellent quality fish! Very healthy and active.",
  "orderId": 45
}
```

### Backend API Response (Rating Summary)
```json
{
  "productId": 12,
  "productType": "FISH",
  "averageRating": 4.3,
  "totalReviews": 127,
  "ratingDistribution": {
    "5": 85,
    "4": 30,
    "3": 8,
    "2": 3,
    "1": 1
  },
  "recentReviews": [
    {
      "id": 456,
      "userId": 78,
      "userName": "John Doe",
      "productId": 12,
      "productType": "FISH",
      "productName": "Tilapia",
      "rating": 5,
      "comment": "Great product!",
      "reviewedAt": "2025-11-25T10:30:00",
      "verifiedPurchase": true,
      "orderId": 45
    }
  ]
}
```

### Frontend Usage
```jsx
import ProductReviewsSection from './components/common/ProductReviewsSection';

<ProductReviewsSection 
  productId={product.id} 
  productType="FISH"
  allowReview={user?.isLoggedIn}
/>
```

---

## Testing Checklist

### Backend Tests
- [ ] Create review with valid data
- [ ] Prevent duplicate reviews
- [ ] Validate rating range (1-5)
- [ ] Calculate average correctly
- [ ] Rating distribution sums correctly
- [ ] Only author can delete
- [ ] Verified purchase validation
- [ ] Product existence check

### Frontend Tests
- [ ] Display reviews list
- [ ] Show rating summary
- [ ] Submit new review
- [ ] Interactive star rating
- [ ] Character counter works
- [ ] Delete own review
- [ ] Hide delete for others' reviews
- [ ] Show "already reviewed" message
- [ ] Display verified badge

### Integration Tests
- [ ] Review persists to database
- [ ] Average updates after new review
- [ ] Distribution updates correctly
- [ ] Delete removes from list
- [ ] Unauthorized user cannot review
- [ ] Review appears immediately after submit

---

## Future Enhancements

### Potential Features
1. 📸 Review photos/videos
2. 👍 Helpful/Unhelpful voting
3. 💬 Seller responses to reviews
4. 🏆 Top reviewer badges
5. 📱 Email notifications for new reviews
6. 🔍 Filter/sort reviews (most helpful, highest/lowest rating)
7. ✏️ Edit reviews (instead of delete+recreate)
8. 📈 Seller analytics dashboard for reviews
9. 🎯 Review incentives/rewards
10. 🛡️ Admin moderation tools

---

## Troubleshooting

### Common Issues

**Issue: "You have already reviewed this product"**
- User can only review each product once
- Delete existing review to write new one

**Issue: "This product is not in the specified order"**
- Order must contain the product to mark as verified
- Check order_items table for product_id match

**Issue: Reviews not loading**
- Check browser console for errors
- Verify API endpoint is accessible
- Check CORS configuration

**Issue: Cannot submit review**
- Ensure user is logged in
- Check user has correct role (SHOP_OWNER, EXPORTER, FARM_OWNER)
- Verify rating is selected (required field)

---

## Related Files

### Backend
- Entity: `ProductReview.java`
- Repository: `ProductReviewRepository.java`
- Service: `ProductReviewService.java`
- Controller: `ProductReviewController.java`
- DTOs: `ProductReviewRequestDTO.java`, `ProductReviewResponseDTO.java`, `ProductRatingsSummaryDTO.java`
- Updated: `Fish.java`, `IndustrialStuff.java` (added transient rating fields)

### Frontend
- Components: `StarRating.jsx`, `ReviewForm.jsx`, `ReviewItem.jsx`, `ProductReviewsSection.jsx`
- Service: `productReviewService.js`
- Updated: `ProductDetails.jsx`, `IndustrialProductDetails.jsx`

---

## Summary

The review and rating system provides a complete solution for customer feedback on products. It includes:
- ⭐ Visual star ratings
- 📝 Text reviews
- 📊 Statistical summaries
- 🛡️ Verified purchase badges
- 🔒 Secure, role-based access
- 🎨 Beautiful, responsive UI

The system is production-ready and fully integrated into the Aqualink platform.
