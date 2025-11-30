package com.example.aqualink.chat.repository;

import com.example.aqualink.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    Optional<ChatRoom> findByBuyerIdAndSellerIdAndProductIdAndProductType(
        Long buyerId, Long sellerId, Long productId, String productType
    );
    
    List<ChatRoom> findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(Long buyerId, Long sellerId);
    
    List<ChatRoom> findByBuyerIdOrderByLastMessageAtDesc(Long buyerId);
    
    List<ChatRoom> findBySellerIdOrderByLastMessageAtDesc(Long sellerId);
}
