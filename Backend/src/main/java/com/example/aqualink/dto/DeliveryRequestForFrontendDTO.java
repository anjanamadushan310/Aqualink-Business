package com.example.aqualink.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRequestForFrontendDTO {
    
    private Long requestId;
    private String sessionId;
    private Long orderId;
    private String pickupAddress;
    private String deliveryAddress;
    private String customerName;
    private String customerPhone;
    private LocalDateTime deadline;
    private LocalDateTime createTime;
    private String orderDetails;
    private Double totalAmount;
    private Integer totalItems;
    private String district;
    private String town;
    
    // Seller address information
    private String sellerName;
    private String sellerPhone;
    private String sellerAddress;
    private String sellerDistrict;
    private String sellerTown;
}