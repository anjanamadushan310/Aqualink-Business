package com.example.aqualink.repository;

import com.example.aqualink.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // Find reviews for a specific product
    @Query("SELECT pr FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType ORDER BY pr.reviewedAt DESC")
    List<ProductReview> findByProductIdAndProductType(@Param("productId") Long productId, @Param("productType") String productType);

    // Find reviews with pagination
    @Query("SELECT pr FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType ORDER BY pr.reviewedAt DESC")
    Page<ProductReview> findByProductIdAndProductType(@Param("productId") Long productId, @Param("productType") String productType, Pageable pageable);

    // Find reviews by user
    List<ProductReview> findByUserIdOrderByReviewedAtDesc(Long userId);

    // Check if user already reviewed this product
    @Query("SELECT pr FROM ProductReview pr WHERE pr.user.id = :userId AND pr.productId = :productId AND pr.productType = :productType")
    Optional<ProductReview> findByUserIdAndProductIdAndProductType(@Param("userId") Long userId, @Param("productId") Long productId, @Param("productType") String productType);

    // Check if review exists
    boolean existsByUserIdAndProductIdAndProductType(Long userId, Long productId, String productType);

    // Calculate average rating for a product
    @Query("SELECT AVG(pr.rating) FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType")
    Double findAverageRatingByProductIdAndProductType(@Param("productId") Long productId, @Param("productType") String productType);

    // Count reviews for a product
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType")
    Long countByProductIdAndProductType(@Param("productId") Long productId, @Param("productType") String productType);

    // Get rating distribution (count by rating value)
    @Query("SELECT pr.rating, COUNT(pr) FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType GROUP BY pr.rating ORDER BY pr.rating DESC")
    List<Object[]> getRatingDistribution(@Param("productId") Long productId, @Param("productType") String productType);

    // Find verified purchase reviews only
    @Query("SELECT pr FROM ProductReview pr WHERE pr.productId = :productId AND pr.productType = :productType AND pr.verifiedPurchase = true ORDER BY pr.reviewedAt DESC")
    List<ProductReview> findVerifiedPurchaseReviews(@Param("productId") Long productId, @Param("productType") String productType);
}
