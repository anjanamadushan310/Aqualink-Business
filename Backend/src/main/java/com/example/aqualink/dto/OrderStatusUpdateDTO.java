package com.example.aqualink.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateDTO {
    
    private Long orderId;
    private String newStatus;
    private String notes;
    private String deliveryPersonNic; // Used for delivery person operations
    private String cancellationReason; // Reason for canceling the order
}