package com.example.aqualink.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private Long chatRoomId;
    private Long senderId;
    private String senderName;
    private String content;
    private String type; // TEXT, IMAGE, SYSTEM
    private String imageUrl;
    private String timestamp;
    private Boolean isRead;
}
