package com.example.aqualink.entity;

import java.time.LocalDateTime;
import java.util.List;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "industrial_stuff")
public class IndustrialStuff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String category;
    private String nicNumber;
    private Integer stock;
    private double price;
    private Boolean inStock = true;
    private Integer soldCount = 0;

    @Column(name = "create_date_and_time")
    private LocalDateTime createDateAndTime;

    @Enumerated(EnumType.STRING)
    private ActiveStatus activeStatus = ActiveStatus.PENDING;

    @ElementCollection
    @CollectionTable(name = "industrial_images", joinColumns = @JoinColumn(name = "industrial_id"))
    @Column(name = "image_path")
    private List<String> imagePaths;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    // Transient fields for reviews/ratings (calculated on demand)
    @jakarta.persistence.Transient
    private Double averageRating;

    @jakarta.persistence.Transient
    private Long reviewCount;

    @PrePersist
    protected void onCreate() {
        createDateAndTime = LocalDateTime.now();
    }
}
