package com.example.aqualink.service;

import com.example.aqualink.dto.ProductRatingsSummaryDTO;
import com.example.aqualink.dto.ProductReviewRequestDTO;
import com.example.aqualink.dto.ProductReviewResponseDTO;
import com.example.aqualink.entity.*;
import com.example.aqualink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;

    @Transactional
    public ProductReviewResponseDTO createReview(ProductReviewRequestDTO request, Long userId) {
        // Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already reviewed this product
        if (productReviewRepository.existsByUserIdAndProductIdAndProductType(
                userId, request.getProductId(), request.getProductType())) {
            throw new RuntimeException("You have already reviewed this product");
        }

        // Validate product exists
        String productName = validateAndGetProductName(request.getProductId(), request.getProductType());

        // Order ID is required - verify it belongs to this user and contains this product
        if (request.getOrderId() == null) {
            throw new RuntimeException("Order ID is required. You can only review products you have received.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify order belongs to the user
        if (!order.getBuyerUser().getId().equals(userId)) {
            throw new RuntimeException("This order does not belong to you");
        }

        // Verify order status is DELIVERED
        if (order.getOrderStatus() != Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("You can only review products from delivered orders. Current status: " + order.getOrderStatus());
        }

        // Check if order contains this product
        boolean productInOrder = order.getOrderItems().stream()
                .anyMatch(item -> item.getProductId().equals(request.getProductId()) 
                        && item.getProductType().equals(request.getProductType()));

        if (!productInOrder) {
            throw new RuntimeException("This product is not in the specified order");
        }

        // Create review
        ProductReview review = new ProductReview();
        review.setUser(user);
        review.setProductId(request.getProductId());
        review.setProductType(request.getProductType());
        review.setProductName(productName);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        review.setOrder(order);
        review.setVerifiedPurchase(true);

        ProductReview savedReview = productReviewRepository.save(review);
        return mapToResponseDTO(savedReview);
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponseDTO> getProductReviews(Long productId, String productType) {
        List<ProductReview> reviews = productReviewRepository.findByProductIdAndProductType(productId, productType);
        return reviews.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductRatingsSummaryDTO getProductRatingsSummary(Long productId, String productType) {
        ProductRatingsSummaryDTO summary = new ProductRatingsSummaryDTO();
        summary.setProductId(productId);
        summary.setProductType(productType);

        // Get average rating
        Double avgRating = productReviewRepository.findAverageRatingByProductIdAndProductType(productId, productType);
        summary.setAverageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);

        // Get total reviews
        Long totalReviews = productReviewRepository.countByProductIdAndProductType(productId, productType);
        summary.setTotalReviews(totalReviews);

        // Get rating distribution
        List<Object[]> distribution = productReviewRepository.getRatingDistribution(productId, productType);
        Map<Integer, Long> ratingMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingMap.put(i, 0L);
        }
        for (Object[] row : distribution) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingMap.put(rating, count);
        }
        summary.setRatingDistribution(ratingMap);

        // Get recent reviews (top 5)
        Pageable pageable = PageRequest.of(0, 5);
        List<ProductReview> recentReviews = productReviewRepository
                .findByProductIdAndProductType(productId, productType, pageable)
                .getContent();
        summary.setRecentReviews(recentReviews.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList()));

        return summary;
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponseDTO> getUserReviews(Long userId) {
        List<ProductReview> reviews = productReviewRepository.findByUserIdOrderByReviewedAtDesc(userId);
        return reviews.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }

        productReviewRepository.delete(review);
    }

    @Transactional
    public ProductReviewResponseDTO updateReview(Long reviewId, ProductReviewRequestDTO request, Long userId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        ProductReview updatedReview = productReviewRepository.save(review);
        return mapToResponseDTO(updatedReview);
    }

    @Transactional(readOnly = true)
    public boolean hasUserReviewedProduct(Long userId, Long productId, String productType) {
        return productReviewRepository.existsByUserIdAndProductIdAndProductType(userId, productId, productType);
    }

    private String validateAndGetProductName(Long productId, String productType) {
        if ("FISH".equals(productType)) {
            Fish fish = fishRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Fish product not found"));
            return fish.getName();
        } else if ("INDUSTRIAL".equals(productType)) {
            IndustrialStuff industrial = industrialStuffRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Industrial product not found"));
            return industrial.getName();
        } else {
            throw new RuntimeException("Invalid product type");
        }
    }

    private ProductReviewResponseDTO mapToResponseDTO(ProductReview review) {
        ProductReviewResponseDTO dto = new ProductReviewResponseDTO();
        dto.setId(review.getId());
        dto.setUserId(review.getUser().getId());
        dto.setUserName(review.getUser().getFullName());
        dto.setProductId(review.getProductId());
        dto.setProductType(review.getProductType());
        dto.setProductName(review.getProductName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setVerifiedPurchase(review.getVerifiedPurchase());
        dto.setOrderId(review.getOrder() != null ? review.getOrder().getId() : null);
        return dto;
    }
}
