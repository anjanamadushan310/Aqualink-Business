package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewResponseDTO {

    private Long id;
    private Long userId;
    private String userName;
    private Long productId;
    private String productType;
    private String productName;
    private Integer rating;
    private String comment;
    private LocalDateTime reviewedAt;
    private Boolean verifiedPurchase;
    private Long orderId;
}
