package com.example.aqualink.service;

import com.example.aqualink.entity.DeliveryQuote;
import com.example.aqualink.repository.DeliveryQuoteRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * QuoteExpirationScheduler - Automatic quote expiration service
 * 
 * This service runs daily at 11:59 PM to automatically expire delivery quotes
 * that have reached their delivery date. Quotes are expired on the day before
 * the delivery date at 11:59 PM to give customers time to make arrangements.
 * 
 * Schedule: Every day at 23:59:00 (11:59 PM)
 */
@Service
@RequiredArgsConstructor
public class QuoteExpirationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(QuoteExpirationScheduler.class);
    private final DeliveryQuoteRepository deliveryQuoteRepository;

    /**
     * Scheduled task that runs every day at 11:59 PM
     * Cron expression: "0 59 23 * * *"
     * - Second: 0
     * - Minute: 59
     * - Hour: 23 (11 PM)
     * - Day of month: * (every day)
     * - Month: * (every month)
     * - Day of week: * (every day of week)
     */
    @Scheduled(cron = "0 59 23 * * *")
    @Transactional
    public void expireQuotesBeforeDeliveryDate() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        logger.info("=== QUOTE EXPIRATION SCHEDULER STARTED ===");
        logger.info("Current time: {}", now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        logger.info("Checking for quotes with delivery date on or before: {}", tomorrow);

        try {
            // Find all PENDING quotes where delivery date is tomorrow or earlier
            // This means today is the day before delivery date (or past it)
            List<DeliveryQuote> quotesToExpire = deliveryQuoteRepository
                    .findQuotesToExpireByDeliveryDate(tomorrow);

            if (quotesToExpire.isEmpty()) {
                logger.info("No quotes to expire at this time");
            } else {
                logger.info("Found {} quote(s) to expire", quotesToExpire.size());

                int expiredCount = 0;
                for (DeliveryQuote quote : quotesToExpire) {
                    try {
                        logger.info("Expiring quote ID: {} | Delivery Date: {} | Order ID: {} | Delivery Person: {}",
                                quote.getId(),
                                quote.getDeliveryDate(),
                                quote.getQuoteRequest().getOrderId(),
                                quote.getDeliveryPerson().getEmail());

                        // Update quote status to EXPIRED
                        quote.setStatus(DeliveryQuote.QuoteStatus.EXPIRED);
                        deliveryQuoteRepository.save(quote);
                        
                        expiredCount++;
                        logger.info("✓ Quote ID {} successfully expired", quote.getId());

                    } catch (Exception e) {
                        logger.error("Failed to expire quote ID {}: {}", quote.getId(), e.getMessage(), e);
                    }
                }

                logger.info("Successfully expired {}/{} quotes", expiredCount, quotesToExpire.size());
            }

        } catch (Exception e) {
            logger.error("Error in quote expiration scheduler: {}", e.getMessage(), e);
        }

        logger.info("=== QUOTE EXPIRATION SCHEDULER COMPLETED ===");
    }

    /**
     * Manual expiration check - can be called on-demand
     * This method can be triggered manually via an admin endpoint if needed
     */
    @Transactional
    public int expireQuotesManually() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        logger.info("Manual quote expiration triggered");

        List<DeliveryQuote> quotesToExpire = deliveryQuoteRepository
                .findQuotesToExpireByDeliveryDate(tomorrow);

        int expiredCount = 0;
        for (DeliveryQuote quote : quotesToExpire) {
            quote.setStatus(DeliveryQuote.QuoteStatus.EXPIRED);
            deliveryQuoteRepository.save(quote);
            expiredCount++;
        }

        logger.info("Manually expired {} quotes", expiredCount);
        return expiredCount;
    }

    /**
     * For testing purposes - runs every minute
     * Comment out the @Scheduled annotation to disable
     * Uncomment for testing only
     */
    // @Scheduled(cron = "0 * * * * *") // Every minute
    @Transactional
    public void expireQuotesTestSchedule() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        logger.info("TEST SCHEDULER - Current time: {}", now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        logger.info("TEST SCHEDULER - Checking quotes with delivery date <= {}", tomorrow);

        List<DeliveryQuote> quotesToExpire = deliveryQuoteRepository
                .findQuotesToExpireByDeliveryDate(tomorrow);

        if (!quotesToExpire.isEmpty()) {
            logger.info("TEST SCHEDULER - Found {} quote(s) that would be expired", quotesToExpire.size());
            for (DeliveryQuote quote : quotesToExpire) {
                logger.info("TEST SCHEDULER - Quote ID: {} | Delivery Date: {} | Status: {}",
                        quote.getId(), quote.getDeliveryDate(), quote.getStatus());
            }
        } else {
            logger.info("TEST SCHEDULER - No quotes to expire");
        }
    }
}
