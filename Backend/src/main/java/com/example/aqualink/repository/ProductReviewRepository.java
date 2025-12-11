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
    
    // Count reviews by user email
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE pr.user.email = :email")
    long countByUserEmail(@Param("email") String email);
    
    // Admin: Get all reviews with pagination
    @Query("SELECT pr FROM ProductReview pr ORDER BY pr.reviewedAt DESC")
    Page<ProductReview> findAllWithPagination(Pageable pageable);
    
    // Admin: Search reviews by term (reviewer name, email, or comment)
    @Query("SELECT pr FROM ProductReview pr WHERE " +
           "LOWER(pr.user.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(pr.user.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(pr.comment) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<ProductReview> searchReviews(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Admin: Filter by rating range
    @Query("SELECT pr FROM ProductReview pr WHERE pr.rating BETWEEN :minRating AND :maxRating ORDER BY pr.reviewedAt DESC")
    Page<ProductReview> findByRatingRange(@Param("minRating") Integer minRating, @Param("maxRating") Integer maxRating, Pageable pageable);
    
    // Admin: Filter by product type
    @Query("SELECT pr FROM ProductReview pr WHERE pr.productType = :productType ORDER BY pr.reviewedAt DESC")
    Page<ProductReview> findByProductType(@Param("productType") String productType, Pageable pageable);
    
    // Admin: Get total count
    @Query("SELECT COUNT(pr) FROM ProductReview pr")
    Long getTotalCount();
    
    // Admin: Get average rating for all products
    @Query("SELECT AVG(pr.rating) FROM ProductReview pr")
    Double getOverallAverageRating();
    
    // Admin: Get rating distribution for all products
    @Query("SELECT pr.rating, COUNT(pr) FROM ProductReview pr GROUP BY pr.rating ORDER BY pr.rating DESC")
    List<Object[]> getOverallRatingDistribution();
    
    // Admin: Count verified purchase reviews
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE pr.verifiedPurchase = true")
    Long countVerifiedPurchaseReviews();
    
    // Admin: Get reviews this month
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE FUNCTION('YEAR', pr.reviewedAt) = FUNCTION('YEAR', CURRENT_DATE) AND FUNCTION('MONTH', pr.reviewedAt) = FUNCTION('MONTH', CURRENT_DATE)")
    Long countReviewsThisMonth();
    
    // Admin: Get reviews this week
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE FUNCTION('YEARWEEK', pr.reviewedAt) = FUNCTION('YEARWEEK', CURRENT_DATE)")
    Long countReviewsThisWeek();
}
