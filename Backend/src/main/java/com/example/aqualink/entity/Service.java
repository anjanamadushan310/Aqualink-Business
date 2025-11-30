package com.example.aqualink.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // Base price (from price)

    @Column(precision = 10, scale = 2)
    private BigDecimal maxPrice; // For price range

    // Add this field to store image paths
    @ElementCollection
    @CollectionTable(name = "service_images", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "image_path")
    private List<String> imagePaths;

    @Column(nullable = false)
    private Boolean available = true;

    @Column(nullable = false)
    private Double reviewRate = 0.0;

    @Column(nullable = false)
    private Integer reviewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(nullable = false)
    private Long serviceProviderId; // Seller/Service provider ID

    private String duration; // Service duration

    //private String location; // Service location/area

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @jakarta.persistence.Transient
    private String district; // Service provider's district from profile

    @jakarta.persistence.Transient
    private String providerName; // Service provider's name from user profile

    @jakarta.persistence.Transient
    private Double averageRating; // Calculated average rating from reviews

    @jakarta.persistence.Transient
    private Long totalReviews; // Total number of reviews

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime approvedAt;

    private String rejectionReason;

    private Long approvedBy; // Admin ID who approved

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ServiceBooking> bookings;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ServiceReview> reviews;

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
