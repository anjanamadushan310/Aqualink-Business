package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDeliveryDTO {
    private Long orderId;
    private String customerNicNumber;
    private String customerName;
    private String customerPhone;
    private LocalDate orderDate;
    private String shippingAddress;
    private String orderStatus;
    private BigDecimal totalAmount;
    private BigDecimal deliveryFee;
    private String deliveryRequiredStatus;
    private LocalDate deliveryStartDate;
    private List<OrderItemDTO> orderItems;
    private String cancellationReason;
    private LocalDateTime cancelledDateTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDTO {
        private Long orderItemId;
        private String productName;
        private String productType; // fish, industrial
        private Integer quantity;
        private BigDecimal price;
        private String productImage;
        private String sellerName;
        private String sellerPhone;
    }
}