package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for detailed review information in admin panel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDetailDTO {
    private Long id;
    private String reviewType;
    private Integer rating;
    private String comment;
    private LocalDateTime reviewedAt;
    
    // Reviewer information
    private Long reviewerId;
    private String reviewerName;
    private String reviewerEmail;
    private String reviewerPhone;
    private String reviewerDistrict;
    private String reviewerTown;
    
    // Product review specific
    private Long productId;
    private String productType;
    private Boolean verifiedPurchase;
    private Long orderId;
    private String orderStatus;
    private LocalDateTime orderDate;
    
    // Service review specific
    private Long serviceId;
    private String serviceName;
    private String serviceCategory;
    private Long bookingId;
    private String bookingStatus;
    private LocalDateTime bookingDate;
    private Long serviceProviderId;
    private String serviceProviderName;
    private String serviceProviderEmail;
}
