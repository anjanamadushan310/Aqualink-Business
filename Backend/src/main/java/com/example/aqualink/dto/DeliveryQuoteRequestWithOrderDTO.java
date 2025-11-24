package com.example.aqualink.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.aqualink.entity.Order;
import lombok.Data;

@Data
public class DeliveryQuoteRequestWithOrderDTO {
    private String sessionId;
    private Long orderId; // Add orderId field for updating existing orders
    private String sellerId;
    private String businessName;
    private List<CartItemDTO> items;
    private Double subtotal;
    private LocalDateTime createdAt;
    private String status;
    private OrderPreferencesDTO preferences;
    private DeliveryAddressDTO deliveryAddress;
    private String paymentMethod; // Payment method (CASH_ON_DELIVERY or CARD_PAYMENT)
    
    // Additional fields for delivery person order details view
    private Order.OrderStatus orderStatus;
    private LocalDateTime orderDateTime;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    // Seller details
    private String sellerName;
    private String sellerEmail;
    private String sellerPhone;
    private String sellerAddress;

    @Data
    public static class CartItemDTO {
        private Long cartItemId;
        private String productName;
        private String productType;
        private Integer quantity;
        private Double price;
        private String sellerId;
        private String sellerName;
    }

    @Data
    public static class OrderPreferencesDTO {
        private Integer quotesExpireAfter;
        private LocalDateTime quotesExpireOn;
    }

    @Data
    public static class DeliveryAddressDTO {
        private String place;
        private String street;
        private String district;
        private String town;
    }
}