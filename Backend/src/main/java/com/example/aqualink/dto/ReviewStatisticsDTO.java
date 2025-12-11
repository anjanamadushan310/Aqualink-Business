package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for review statistics in admin panel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatisticsDTO {
    private Long totalReviews;
    private Long productReviewsCount;
    private Long serviceReviewsCount;
    private Double averageRating;
    private Double productAverageRating;
    private Double serviceAverageRating;
    private Long verifiedPurchaseReviewsCount;
    private Map<Integer, Long> ratingDistribution; // rating -> count
    private Long reviewsThisMonth;
    private Long reviewsThisWeek;
}
