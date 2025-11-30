package com.example.aqualink.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * ChatMessage Entity - Persistent Chat History
 * 
 * Functional Requirements:
 * 1. All messages are persisted to database
 * 2. Messages remain available as long as the chat room (and product) exists
 * 3. Supports text and image message types
 * 4. Ordered by timestamp for conversation continuity
 * 
 * Database Design:
 * - Indexed by chatRoomId for fast message retrieval
 * - Indexed by timestamp for chronological ordering
 * - Cascade delete with chat room ensures cleanup
 */
@Entity
@Table(name = "chat_messages",
    indexes = {
        @Index(name = "idx_chat_room_id", columnList = "chat_room_id"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_chat_room_timestamp", columnList = "chat_room_id, timestamp")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long chatRoomId;
    
    @Column(nullable = false)
    private Long senderId;
    
    @Column(nullable = false)
    private String senderName;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type = MessageType.TEXT;
    
    private String imageUrl;
    
    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
    
    @Column(nullable = false)
    private Boolean isRead = false;
    
    public enum MessageType {
        TEXT,
        IMAGE,
        SYSTEM
    }
}
