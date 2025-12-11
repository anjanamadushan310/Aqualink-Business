package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopSellerDTO {
    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerType;
    private BigDecimal totalRevenue;
    private Long transactionCount;
}