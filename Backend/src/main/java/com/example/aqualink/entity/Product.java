package com.example.aqualink.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "product")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "product_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id" , nullable = false)
    private User user;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Review> reviews;

    // Removed @OneToMany for orderItems since OrderItem no longer references Product directly
    // OrderItem now stores productId and productType instead

    @Column(name = "product_type", insertable = false, updatable = false)
    private String productType;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "price")
    private double price;

    @Column(name = "nic_number" , nullable = true)
    private String nicNumber;

    @Column(name = "create_date_and_time")
    private LocalDateTime createDateAndTime;

    @Enumerated(EnumType.STRING)
    private ActiveStatus activeStatus = ActiveStatus.PENDING;

    @PrePersist
    protected void onCreate() {
        createDateAndTime = LocalDateTime.now();
    }
}
