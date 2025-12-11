package com.example.aqualink.controller;

import com.example.aqualink.dto.ReviewDetailDTO;
import com.example.aqualink.dto.ReviewFilterDTO;
import com.example.aqualink.dto.ReviewManagementDTO;
import com.example.aqualink.dto.ReviewStatisticsDTO;
import com.example.aqualink.service.ReviewManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/review-management")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ReviewManagementController {

    private final ReviewManagementService reviewManagementService;

    /**
     * Get all reviews with filtering and pagination
     */
    @PostMapping("/list")
    public ResponseEntity<Page<ReviewManagementDTO>> getAllReviews(
            @RequestBody(required = false) ReviewFilterDTO filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/review-management/list - Page: {}, Size: {}, Filter: {}", page, size, filter);
        
        try {
            if (filter == null) {
                filter = new ReviewFilterDTO();
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<ReviewManagementDTO> reviews = reviewManagementService.getAllReviews(filter, pageable);
            
            log.info("Successfully retrieved {} reviews", reviews.getTotalElements());
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            log.error("Error retrieving reviews: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve reviews: " + e.getMessage());
        }
    }

    /**
     * Get review details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewDetailDTO> getReviewDetail(
            @PathVariable Long id,
            @RequestParam String reviewType) {
        
        log.info("GET /api/admin/review-management/{} - Type: {}", id, reviewType);
        
        try {
            ReviewDetailDTO review = reviewManagementService.getReviewDetail(id, reviewType);
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            log.error("Review not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error retrieving review detail: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve review detail: " + e.getMessage());
        }
    }

    /**
     * Delete a review
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReview(
            @PathVariable Long id,
            @RequestParam String reviewType) {
        
        log.info("DELETE /api/admin/review-management/{} - Type: {}", id, reviewType);
        
        try {
            reviewManagementService.deleteReview(id, reviewType);
            return ResponseEntity.ok(Map.of(
                "message", "Review deleted successfully",
                "reviewId", id.toString(),
                "reviewType", reviewType
            ));
        } catch (RuntimeException e) {
            log.error("Failed to delete review: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting review: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete review: " + e.getMessage());
        }
    }

    /**
     * Bulk delete reviews
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, String>> bulkDeleteReviews(
            @RequestBody Map<String, List<Long>> reviewIds) {
        
        log.info("POST /api/admin/review-management/bulk-delete - Product IDs: {}, Service IDs: {}", 
                 reviewIds.get("productReviewIds"), reviewIds.get("serviceReviewIds"));
        
        try {
            List<Long> productReviewIds = reviewIds.get("productReviewIds");
            List<Long> serviceReviewIds = reviewIds.get("serviceReviewIds");
            
            reviewManagementService.bulkDeleteReviews(productReviewIds, serviceReviewIds);
            
            int totalDeleted = (productReviewIds != null ? productReviewIds.size() : 0) +
                              (serviceReviewIds != null ? serviceReviewIds.size() : 0);
            
            return ResponseEntity.ok(Map.of(
                "message", "Reviews deleted successfully",
                "deletedCount", String.valueOf(totalDeleted)
            ));
        } catch (Exception e) {
            log.error("Error in bulk delete: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete reviews: " + e.getMessage());
        }
    }

    /**
     * Get review statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<ReviewStatisticsDTO> getReviewStatistics() {
        log.info("GET /api/admin/review-management/statistics");
        
        try {
            ReviewStatisticsDTO stats = reviewManagementService.getReviewStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error retrieving review statistics: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve statistics: " + e.getMessage());
        }
    }
}
