package com.example.aqualink.repository;

import com.example.aqualink.entity.Service;
import com.example.aqualink.entity.Service.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    // Public approved services only
    Page<Service> findByApprovalStatusAndAvailable(ApprovalStatus status, Boolean available, Pageable pageable);

    // Search approved services
    @Query("SELECT s FROM Service s WHERE s.approvalStatus = 'APPROVED' AND s.available = true AND " +
            "(LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Service> searchApprovedServices(@Param("search") String search, Pageable pageable);

    // Service provider's services
    Page<Service> findByServiceProviderIdOrderByCreatedAtDesc(Long serviceProviderId, Pageable pageable);

    // Admin pending approvals
    Page<Service> findByApprovalStatusOrderByCreatedAtAsc(ApprovalStatus status, Pageable pageable);

    // Category filter
    Page<Service> findByApprovalStatusAndCategoryAndAvailable(ApprovalStatus status, String category, Boolean available, Pageable pageable);

    // Count by approval status
    Long countByApprovalStatus(ApprovalStatus status);

    // Service provider count by status
    Long countByServiceProviderIdAndApprovalStatus(Long serviceProviderId, ApprovalStatus status);

    // Count active services by provider
    Long countByServiceProviderIdAndAvailable(Long serviceProviderId, Boolean available);

    // Top rated services
    @Query("SELECT s FROM Service s WHERE s.approvalStatus = 'APPROVED' AND s.available = true AND s.reviewCount > 0 ORDER BY s.reviewRate DESC")
    Page<Service> findTopRatedServices(Pageable pageable);

    // Exists by name and service provider ID
    boolean existsByNameAndServiceProviderId(String name, Long serviceProviderId);
}
