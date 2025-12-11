package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EarningsStatisticsDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalProductRevenue;
    private BigDecimal totalServiceRevenue;
    private BigDecimal totalDeliveryRevenue;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueToday;
    private Long totalTransactions;
    private Long productOrdersCount;
    private Long serviceBookingsCount;
    private Long deliveryTransactionsCount;
    private Map<String, BigDecimal> revenueByPaymentMethod;
    private Map<String, Long> transactionsByStatus;
    private java.util.List<TopSellerDTO> topSellers;
    private Map<String, BigDecimal> monthlyRevenueTrend;
}