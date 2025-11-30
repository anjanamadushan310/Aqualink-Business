package com.example.aqualink.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDTO {
    private Long id;
    private Long buyerId;
    private String buyerName;
    private Long sellerId;
    private String sellerName;
    private Long productId;
    private String productType;
    private String productName;
    private String productImage;
    private String createdAt;
    private String lastMessageAt;
    private String lastMessage;
    private Integer unreadCount;
}
