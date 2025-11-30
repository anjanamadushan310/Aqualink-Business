package com.example.aqualink.chat.controller;

import com.example.aqualink.chat.dto.ChatMessageDTO;
import com.example.aqualink.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO messageDTO) {
        try {
            System.out.println("=== WebSocket Message Received ===");
            System.out.println("Chat Room ID: " + messageDTO.getChatRoomId());
            System.out.println("Sender ID: " + messageDTO.getSenderId());
            System.out.println("Content: " + messageDTO.getContent());
            
            ChatMessageDTO savedMessage = chatService.sendTextMessage(
                messageDTO.getChatRoomId(),
                messageDTO.getSenderId(),
                messageDTO.getContent()
            );

            System.out.println("Message saved with ID: " + savedMessage.getId());
            
            // Send to chat room topic
            String topic = "/topic/chat/" + savedMessage.getChatRoomId();
            System.out.println("Broadcasting to topic: " + topic);
            
            messagingTemplate.convertAndSend(topic, savedMessage);
            
            System.out.println("Message broadcast successfully");
        } catch (Exception e) {
            System.err.println("Error in WebSocket message handler: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.typing")
    public void userTyping(@Payload ChatMessageDTO messageDTO) {
        messagingTemplate.convertAndSend(
            "/topic/typing/" + messageDTO.getChatRoomId(),
            messageDTO.getSenderName() + " is typing..."
        );
    }
}
