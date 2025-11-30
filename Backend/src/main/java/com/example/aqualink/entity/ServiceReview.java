package com.example.aqualink.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private ServiceBooking booking;

    @Column(nullable = false)
    private Long customerId;

    @Transient
    private String customerName; // Populated from User entity

    @Column(nullable = false)
    private Integer rating; // 1-5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private LocalDateTime reviewedAt = LocalDateTime.now();
}
