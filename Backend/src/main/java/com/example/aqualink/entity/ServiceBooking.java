package com.example.aqualink.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ServiceBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnoreProperties({"bookings", "reviews", "hibernateLazyInitializer", "handler"})
    private Service service;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private Long serviceProviderId;

    @Column(precision = 10, scale = 2)
    private BigDecimal quotedPrice;

    @Column(columnDefinition = "TEXT")
    private String customerRequirements;

    @Column(nullable = false)
    private LocalDateTime preferredDate;

    private String preferredTime;

    private String customerLocation;

    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime bookedAt = LocalDateTime.now();

    private LocalDateTime confirmedAt;

    private LocalDateTime completedAt;

    private String providerNotes;

    @Transient
    private String customerName;

    @Transient
    private String sellerName;

    @Transient
    private boolean hasReview;

    public enum BookingStatus {
        PENDING,      // Waiting for provider response
        CONFIRMED,    // Provider confirmed
        IN_PROGRESS,  // Service is being provided
        COMPLETED,    // Service completed
        CANCELLED     // Cancelled by either party
    }
}
