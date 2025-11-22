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
@Table(name = "fish_ads")
public class Fish {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String nicNumber;
    private Integer stock;
    private double price;
    private Integer minimumQuantity;

    @Column(name = "create_date_and_time")
    private LocalDateTime createDateAndTime;

    @Enumerated(EnumType.STRING)
    private ActiveStatus activeStatus = ActiveStatus.PENDING;

    // Add this field to store image paths
    @ElementCollection
    @CollectionTable(name = "fish_images", joinColumns = @JoinColumn(name = "fish_id"))
    @Column(name = "image_path")
    private List<String> imagePaths;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    //userprofile

    @PrePersist
    protected void onCreate() {
        createDateAndTime = LocalDateTime.now();
    }
}