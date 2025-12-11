package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for earnings/transaction management in admin panel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EarningsTransactionDTO {
    private Long id;
    private String transactionType; // "PRODUCT_ORDER", "SERVICE_BOOKING", "DELIVERY_FEE"
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDateTime transactionDate;
    private String status; // Order/Booking status
    
    // Buyer/Customer information
    private Long buyerId;
    private String buyerName;
    private String buyerEmail;
    
    // Seller/Provider information
    private Long sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerType; // "SHOP_OWNER", "SERVICE_PROVIDER", "DELIVERY_PERSON"
    
    // Related entity details
    private Long relatedEntityId; // Order ID, Booking ID, or Quote ID
    private String description;
    private Integer itemCount; // For orders
}