package com.example.aqualink.repository;

import com.example.aqualink.entity.DeliveryQuote;
import com.example.aqualink.entity.DeliveryQuoteRequest;
import com.example.aqualink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliveryQuoteRepository extends JpaRepository<DeliveryQuote, Long> {
    
    List<DeliveryQuote> findByQuoteRequest(DeliveryQuoteRequest quoteRequest);
    
    List<DeliveryQuote> findByDeliveryPerson(User deliveryPerson);
    
    List<DeliveryQuote> findByDeliveryPersonAndStatus(User deliveryPerson, DeliveryQuote.QuoteStatus status);
    
    List<DeliveryQuote> findByQuoteRequestAndStatus(DeliveryQuoteRequest quoteRequest, DeliveryQuote.QuoteStatus status);
    
    @Query("SELECT dq FROM DeliveryQuote dq WHERE dq.validUntil <= :currentTime AND dq.status = 'PENDING'")
    List<DeliveryQuote> findExpiredQuotes(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT dq FROM DeliveryQuote dq WHERE dq.deliveryDate <= :expiryDate AND dq.status = 'PENDING'")
    List<DeliveryQuote> findQuotesToExpireByDeliveryDate(@Param("expiryDate") LocalDate expiryDate);
    
    boolean existsByQuoteRequestAndDeliveryPerson(DeliveryQuoteRequest quoteRequest, User deliveryPerson);
    
    @Query("SELECT dq FROM DeliveryQuote dq WHERE dq.deliveryPerson = :deliveryPerson ORDER BY dq.createdAt DESC")
    List<DeliveryQuote> findByDeliveryPersonOrderByCreatedAtDesc(@Param("deliveryPerson") User deliveryPerson);
}