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
}
