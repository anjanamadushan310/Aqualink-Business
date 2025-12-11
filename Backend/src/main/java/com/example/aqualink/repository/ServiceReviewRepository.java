package com.example.aqualink.repository;

import com.example.aqualink.entity.ServiceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceReviewRepository extends JpaRepository<ServiceReview, Long> {

    // Service reviews
    Page<ServiceReview> findByServiceIdOrderByReviewedAtDesc(Long serviceId, Pageable pageable);

    // Customer's reviews
    Page<ServiceReview> findByCustomerIdOrderByReviewedAtDesc(Long customerId, Pageable pageable);

    // Check if customer already reviewed a booking
    boolean existsByBookingId(Long bookingId);

    // Calculate average rating for a service
    @Query("SELECT AVG(r.rating) FROM ServiceReview r WHERE r.service.id = :serviceId")
    Double getAverageRating(@Param("serviceId") Long serviceId);

    // Count reviews for a service
    Long countByServiceId(Long serviceId);

    // Get all reviews for services provided by a specific provider
    @Query("SELECT r FROM ServiceReview r WHERE r.service.serviceProviderId = :serviceProviderId")
    List<ServiceReview> findByServiceServiceProviderId(@Param("serviceProviderId") Long serviceProviderId);
    
    // Admin: Get all reviews with pagination
    @Query("SELECT sr FROM ServiceReview sr ORDER BY sr.reviewedAt DESC")
    Page<ServiceReview> findAllWithPagination(Pageable pageable);
    
        // Admin: Search reviews by term (reviewer name, email, comment, or service name)
        @Query("SELECT sr FROM ServiceReview sr " +
            "LEFT JOIN sr.service s " +
            "LEFT JOIN User u ON u.id = sr.customerId " +
            "WHERE (:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(COALESCE(sr.comment, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ) " +
            "ORDER BY sr.reviewedAt DESC")
        Page<ServiceReview> searchReviews(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Admin: Filter by rating range
    @Query("SELECT sr FROM ServiceReview sr WHERE sr.rating BETWEEN :minRating AND :maxRating ORDER BY sr.reviewedAt DESC")
    Page<ServiceReview> findByRatingRange(@Param("minRating") Integer minRating, @Param("maxRating") Integer maxRating, Pageable pageable);
    
    // Admin: Filter by service provider
    @Query("SELECT sr FROM ServiceReview sr WHERE sr.service.serviceProviderId = :serviceProviderId ORDER BY sr.reviewedAt DESC")
    Page<ServiceReview> findByServiceProviderIdWithPagination(@Param("serviceProviderId") Long serviceProviderId, Pageable pageable);
    
    // Admin: Get total count
    @Query("SELECT COUNT(sr) FROM ServiceReview sr")
    Long getTotalCount();
    
    // Admin: Get average rating for all services
    @Query("SELECT AVG(sr.rating) FROM ServiceReview sr")
    Double getOverallAverageRating();
    
    // Admin: Get rating distribution for all services
    @Query("SELECT sr.rating, COUNT(sr) FROM ServiceReview sr GROUP BY sr.rating ORDER BY sr.rating DESC")
    List<Object[]> getOverallRatingDistribution();
    
    // Admin: Get reviews this month
    @Query("SELECT COUNT(sr) FROM ServiceReview sr WHERE FUNCTION('YEAR', sr.reviewedAt) = FUNCTION('YEAR', CURRENT_DATE) AND FUNCTION('MONTH', sr.reviewedAt) = FUNCTION('MONTH', CURRENT_DATE)")
    Long countReviewsThisMonth();
    
    // Admin: Get reviews this week
    @Query("SELECT COUNT(sr) FROM ServiceReview sr WHERE FUNCTION('YEARWEEK', sr.reviewedAt) = FUNCTION('YEARWEEK', CURRENT_DATE)")
    Long countReviewsThisWeek();
}
