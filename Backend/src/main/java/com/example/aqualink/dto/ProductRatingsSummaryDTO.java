package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRatingsSummaryDTO {

    private Long productId;
    private String productType;
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution; // Rating value -> Count
    private List<ProductReviewResponseDTO> recentReviews;
}
