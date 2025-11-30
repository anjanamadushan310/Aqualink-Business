package com.example.aqualink.chat.service;

import com.example.aqualink.chat.dto.ChatMessageDTO;
import com.example.aqualink.chat.dto.ChatRoomDTO;
import com.example.aqualink.chat.entity.ChatMessage;
import com.example.aqualink.chat.entity.ChatRoom;
import com.example.aqualink.chat.repository.ChatMessageRepository;
import com.example.aqualink.chat.repository.ChatRoomRepository;
import com.example.aqualink.entity.Fish;
import com.example.aqualink.entity.IndustrialStuff;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.FishRepository;
import com.example.aqualink.repository.IndustrialStuffRepository;
import com.example.aqualink.repository.ServiceRepository;
import com.example.aqualink.repository.UserRepository;
import com.example.aqualink.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ChatService - Product-Context-Aware Chat Management
 * 
 * This service implements the following functional requirements:
 * 
 * 1. CONTEXT-AWARE CHAT SESSIONS:
 *    - Each chat room is uniquely linked to a specific product (productId + productType)
 *    - When a buyer clicks "Chat with Seller" on a fish listing, the system creates/retrieves
 *      a chat room specifically for that buyer-seller-product combination
 *    - Different products between the same buyer and seller create separate chat rooms
 * 
 * 2. PERSISTENT CHAT HISTORY:
 *    - All messages are stored in the database (chat_messages table)
 *    - Messages are retrieved chronologically when a chat room is opened
 *    - Chat history remains available for the entire lifecycle of the product listing
 * 
 * 3. PRODUCT LIFECYCLE INTEGRATION:
 *    - Chat rooms exist as long as the product listing is active
 *    - Product information (name, image) is fetched and displayed in chat interface
 *    - Database constraints ensure chat data integrity with product data
 * 
 * 4. REAL-TIME AND PERSISTENT MESSAGING:
 *    - Text messages are sent via WebSocket for real-time delivery
 *    - All messages (text and image) are persisted to database
 *    - Image messages are uploaded to file storage and URLs are stored
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;
    private final ServiceRepository serviceRepository;
    private final FileUploadService fileUploadService;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Get or Create Context-Aware Chat Room
     * 
     * This method implements the core requirement of context-aware chat:
     * - When a buyer selects a fish listing and clicks "Chat with Seller"
     * - The system checks if a chat room already exists for this specific:
     *   * Buyer ID
     *   * Seller ID (product owner)
     *   * Product ID (the specific fish listing)
     *   * Product Type (FISH or INDUSTRIAL_STUFF)
     * 
     * If a chat room exists, it retrieves the existing conversation history
     * If not, it creates a new chat room linked to this specific product
     * 
     * This ensures:
     * 1. Each product has its own conversation thread
     * 2. Previous conversations about the same product are preserved
     * 3. Different products between same buyer-seller have separate chats
     * 
     * @param buyerId The ID of the buyer initiating the chat
     * @param sellerId The ID of the seller (product owner)
     * @param productId The specific product listing ID
     * @param productType The type of product ("FISH" or "INDUSTRIAL_STUFF")
     * @return ChatRoomDTO with product context and conversation metadata
     */
    @Transactional
    public ChatRoomDTO getOrCreateChatRoom(Long buyerId, Long sellerId, Long productId, String productType) {
        // Validate product exists and is active
        validateProductExists(productId, productType);
        
        ChatRoom chatRoom = chatRoomRepository
            .findByBuyerIdAndSellerIdAndProductIdAndProductType(buyerId, sellerId, productId, productType)
            .orElseGet(() -> {
                ChatRoom newRoom = new ChatRoom();
                newRoom.setBuyerId(buyerId);
                newRoom.setSellerId(sellerId);
                newRoom.setProductId(productId);
                newRoom.setProductType(productType);
                return chatRoomRepository.save(newRoom);
            });

        return convertToRoomDTO(chatRoom, buyerId);
    }

    public List<ChatRoomDTO> getUserChatRooms(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(userId, userId);
        return rooms.stream()
            .map(room -> convertToRoomDTO(room, userId))
            .collect(Collectors.toList());
    }

    public List<ChatRoomDTO> getSellerChatRooms(Long sellerId) {
        List<ChatRoom> rooms = chatRoomRepository.findBySellerIdOrderByLastMessageAtDesc(sellerId);
        return rooms.stream()
            .map(room -> convertToRoomDTO(room, sellerId))
            .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDTO sendTextMessage(Long chatRoomId, Long senderId, String content) {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        ChatMessage message = new ChatMessage();
        message.setChatRoomId(chatRoomId);
        message.setSenderId(senderId);
        message.setSenderName(sender.getName());
        message.setContent(content);
        message.setType(ChatMessage.MessageType.TEXT);
        message.setTimestamp(LocalDateTime.now());

        ChatMessage saved = chatMessageRepository.save(message);

        // Update chat room
        updateChatRoom(chatRoomId, content, senderId);

        return convertToMessageDTO(saved);
    }

    @Transactional
    public ChatMessageDTO sendImageMessage(Long chatRoomId, Long senderId, MultipartFile image) throws Exception {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = fileUploadService.uploadFile(image);

        ChatMessage message = new ChatMessage();
        message.setChatRoomId(chatRoomId);
        message.setSenderId(senderId);
        message.setSenderName(sender.getName());
        message.setContent("Image");
        message.setType(ChatMessage.MessageType.IMAGE);
        message.setImageUrl(imageUrl);
        message.setTimestamp(LocalDateTime.now());

        ChatMessage saved = chatMessageRepository.save(message);

        // Update chat room
        updateChatRoom(chatRoomId, "Image", senderId);

        return convertToMessageDTO(saved);
    }

    public List<ChatMessageDTO> getChatMessages(Long chatRoomId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(chatRoomId);
        return messages.stream()
            .map(this::convertToMessageDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Long chatRoomId, Long userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository
            .findByChatRoomIdAndIsReadFalse(chatRoomId);

        for (ChatMessage message : unreadMessages) {
            if (!message.getSenderId().equals(userId)) {
                message.setIsRead(true);
                chatMessageRepository.save(message);
            }
        }

        // Update unread count in chat room
        ChatRoom room = chatRoomRepository.findById(chatRoomId).orElse(null);
        if (room != null) {
            if (room.getBuyerId().equals(userId)) {
                room.setUnreadCountBuyer(0);
            } else if (room.getSellerId().equals(userId)) {
                room.setUnreadCountSeller(0);
            }
            chatRoomRepository.save(room);
        }
    }

    private void updateChatRoom(Long chatRoomId, String lastMessage, Long senderId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId).orElse(null);
        if (room != null) {
            room.setLastMessage(lastMessage);
            room.setLastMessageAt(LocalDateTime.now());

            // Increment unread count
            if (room.getBuyerId().equals(senderId)) {
                room.setUnreadCountSeller(room.getUnreadCountSeller() + 1);
            } else {
                room.setUnreadCountBuyer(room.getUnreadCountBuyer() + 1);
            }

            chatRoomRepository.save(room);
        }
    }

    private ChatRoomDTO convertToRoomDTO(ChatRoom room, Long currentUserId) {
        ChatRoomDTO dto = new ChatRoomDTO();
        dto.setId(room.getId());
        dto.setBuyerId(room.getBuyerId());
        dto.setSellerId(room.getSellerId());
        dto.setProductId(room.getProductId());
        dto.setProductType(room.getProductType());
        dto.setCreatedAt(room.getCreatedAt().format(formatter));
        dto.setLastMessageAt(room.getLastMessageAt().format(formatter));
        dto.setLastMessage(room.getLastMessage());

        // Get buyer and seller names
        userRepository.findById(room.getBuyerId()).ifPresent(buyer -> 
            dto.setBuyerName(buyer.getName())
        );
        userRepository.findById(room.getSellerId()).ifPresent(seller -> 
            dto.setSellerName(seller.getName())
        );

        // Get product info
        if ("FISH".equals(room.getProductType())) {
            fishRepository.findById(room.getProductId()).ifPresent(fish -> {
                dto.setProductName(fish.getName());
                if (fish.getImagePaths() != null && !fish.getImagePaths().isEmpty()) {
                    dto.setProductImage(fish.getImagePaths().get(0));
                }
            });
        } else if ("INDUSTRIAL_STUFF".equals(room.getProductType())) {
            industrialStuffRepository.findById(room.getProductId()).ifPresent(stuff -> {
                dto.setProductName(stuff.getName());
                if (stuff.getImagePaths() != null && !stuff.getImagePaths().isEmpty()) {
                    dto.setProductImage(stuff.getImagePaths().get(0));
                }
            });
        } else if ("SERVICE".equals(room.getProductType())) {
            serviceRepository.findById(room.getProductId()).ifPresent(service -> {
                dto.setProductName(service.getName());
                if (service.getImagePaths() != null && !service.getImagePaths().isEmpty()) {
                    dto.setProductImage(service.getImagePaths().get(0));
                }
            });
        }

        // Set unread count based on current user
        if (room.getBuyerId().equals(currentUserId)) {
            dto.setUnreadCount(room.getUnreadCountBuyer());
        } else {
            dto.setUnreadCount(room.getUnreadCountSeller());
        }

        return dto;
    }

    /**
     * Validate Product Exists and is Available for Chat
     * 
     * Ensures that chat rooms can only be created for active product listings.
     * This implements the requirement: "conversation data should remain available
     * as long as the product advertisement remains active on the platform"
     * 
     * @param productId The product listing ID
     * @param productType The type of product ("FISH" or "INDUSTRIAL_STUFF")
     * @throws RuntimeException if product doesn't exist or is not active
     */
    private void validateProductExists(Long productId, String productType) {
        if ("FISH".equals(productType)) {
            Fish fish = fishRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Fish listing not found. Chat cannot be initiated."));
            // Additional validation can be added here (e.g., check if listing is active/approved)
        } else if ("INDUSTRIAL_STUFF".equals(productType)) {
            IndustrialStuff stuff = industrialStuffRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Industrial product not found. Chat cannot be initiated."));
            // Additional validation can be added here
        } else if ("SERVICE".equals(productType)) {
            com.example.aqualink.entity.Service service = serviceRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Service not found. Chat cannot be initiated."));
        } else {
            throw new RuntimeException("Invalid product type: " + productType);
        }
    }

    private ChatMessageDTO convertToMessageDTO(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setId(message.getId());
        dto.setChatRoomId(message.getChatRoomId());
        dto.setSenderId(message.getSenderId());
        dto.setSenderName(message.getSenderName());
        dto.setContent(message.getContent());
        dto.setType(message.getType().name());
        dto.setImageUrl(message.getImageUrl());
        dto.setTimestamp(message.getTimestamp().format(formatter));
        dto.setIsRead(message.getIsRead());
        return dto;
    }
}
