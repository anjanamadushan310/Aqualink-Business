package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for unified review management in admin panel.
 * Handles both ProductReview and ServiceReview types.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewManagementDTO {
    private Long id;
    private String reviewType; // "PRODUCT" or "SERVICE"
    private String reviewerName;
    private String reviewerEmail;
    private String reviewerPhone;
    private Integer rating;
    private String comment;
    private Boolean verifiedPurchase; // Only for product reviews
    private LocalDateTime reviewedAt;
    
    // For product reviews
    private Long productId;
    private String productType; // "FISH" or "INDUSTRIAL"
    private Long orderId;
    
    // For service reviews
    private Long serviceId;
    private String serviceName;
    private Long bookingId;
    private Long serviceProviderId;
    private String serviceProviderName;
}
