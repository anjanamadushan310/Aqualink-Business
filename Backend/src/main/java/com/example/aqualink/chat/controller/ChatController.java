package com.example.aqualink.chat.controller;

import com.example.aqualink.chat.dto.ChatMessageDTO;
import com.example.aqualink.chat.dto.ChatRoomDTO;
import com.example.aqualink.chat.service.ChatService;
import com.example.aqualink.security.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/room")
    public ResponseEntity<?> getOrCreateChatRoom(
            @RequestParam Long sellerId,
            @RequestParam Long productId,
            @RequestParam String productType,
            HttpServletRequest request) {
        try {
            Long buyerId = getCurrentUserId(request);
            ChatRoomDTO room = chatService.getOrCreateChatRoom(buyerId, sellerId, productId, productType);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getUserChatRooms(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            List<ChatRoomDTO> rooms = chatService.getUserChatRooms(userId);
            return ResponseEntity.ok(rooms);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/seller/rooms")
    public ResponseEntity<?> getSellerChatRooms(HttpServletRequest request) {
        try {
            Long sellerId = getCurrentUserId(request);
            List<ChatRoomDTO> rooms = chatService.getSellerChatRooms(sellerId);
            return ResponseEntity.ok(rooms);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<?> getChatMessages(
            @PathVariable Long chatRoomId,
            HttpServletRequest request) {
        try {
            getCurrentUserId(request); // Verify authentication
            List<ChatMessageDTO> messages = chatService.getChatMessages(chatRoomId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/message/text")
    public ResponseEntity<?> sendTextMessage(
            @RequestParam Long chatRoomId,
            @RequestParam String content,
            HttpServletRequest request) {
        try {
            Long senderId = getCurrentUserId(request);
            ChatMessageDTO message = chatService.sendTextMessage(chatRoomId, senderId, content);
            
            // Send via WebSocket
            messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, message);
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/message/image")
    public ResponseEntity<?> sendImageMessage(
            @RequestParam Long chatRoomId,
            @RequestParam("image") MultipartFile image,
            HttpServletRequest request) {
        try {
            Long senderId = getCurrentUserId(request);
            ChatMessageDTO message = chatService.sendImageMessage(chatRoomId, senderId, image);
            
            // Send via WebSocket
            messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, message);
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/read/{chatRoomId}")
    public ResponseEntity<?> markMessagesAsRead(
            @PathVariable Long chatRoomId,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            chatService.markMessagesAsRead(chatRoomId, userId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        }
        throw new RuntimeException("Unauthorized");
    }
}
