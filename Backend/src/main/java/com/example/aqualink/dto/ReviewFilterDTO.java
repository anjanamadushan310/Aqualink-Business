package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for filtering reviews in admin panel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFilterDTO {
    private String reviewType; // "PRODUCT", "SERVICE", or "ALL"
    private Integer minRating;
    private Integer maxRating;
    private Boolean verifiedPurchaseOnly; // For product reviews
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String searchTerm; // Search in reviewer name, email, or comment
    private String productType; // "FISH" or "INDUSTRIAL" for product reviews
    private Long serviceProviderId; // For filtering service reviews by provider
}
