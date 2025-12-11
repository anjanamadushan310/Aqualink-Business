package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EarningsFilterDTO {
    private String transactionType;
    private String paymentMethod;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String sellerType;
    private Long sellerId;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String searchTerm;
}