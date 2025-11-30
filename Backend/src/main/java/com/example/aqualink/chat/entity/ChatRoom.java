package com.example.aqualink.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * ChatRoom Entity - Context-Aware Chat Sessions
 * 
 * Functional Requirements:
 * 1. Each chat room is linked to a specific product (productId) and product type
 * 2. Chat history persists in the database as long as the product listing is active
 * 3. One-to-one mapping between buyer-seller-product combination
 * 4. Supports both FISH and INDUSTRIAL_STUFF product types
 * 
 * Database Design:
 * - Composite unique constraint ensures one chat room per buyer-seller-product
 * - Indexed for fast retrieval by participants and product
 * - Foreign key relationships maintain referential integrity
 */
@Entity
@Table(name = "chat_rooms",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"buyer_id", "seller_id", "product_id", "product_type"})
    },
    indexes = {
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_product_id", columnList = "product_id"),
        @Index(name = "idx_last_message_at", columnList = "last_message_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    
    @Column(name = "seller_id", nullable = false)
    private Long sellerId;
    
    /**
     * Product ID - Links this chat to a specific product listing
     * This creates a context-aware conversation specific to the selected product
     */
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    /**
     * Product Type - Distinguishes between FISH and INDUSTRIAL_STUFF listings
     * Required because product IDs may overlap between different product tables
     */
    @Column(name = "product_type", nullable = false, length = 20)
    private String productType; // "FISH" or "INDUSTRIAL_STUFF"
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime lastMessageAt = LocalDateTime.now();
    
    private String lastMessage;
    
    @Column(nullable = false)
    private Integer unreadCountBuyer = 0;
    
    @Column(nullable = false)
    private Integer unreadCountSeller = 0;
}
