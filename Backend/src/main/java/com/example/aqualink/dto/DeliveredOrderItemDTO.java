package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveredOrderItemDTO {

    private Long orderId;
    private Long orderItemId;
    private Long productId;
    private String productType;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private LocalDateTime deliveredDate;
    private Boolean hasReview;
    private Long reviewId;
}
