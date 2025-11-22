package com.example.aqualink.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_user_id", nullable = false)
    private User buyerUser;

    @Column(name = "order_date_time")
    private LocalDateTime orderDateTime;

    // Shipping Address Components
    @Column(name = "address_place")
    private String addressPlace;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_district")
    private String addressDistrict;

    @Column(name = "address_town")
    private String addressTown;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "accepted_delivery_quote_id")
    private Long acceptedDeliveryQuoteId;

    @ElementCollection
    @CollectionTable(
        name = "order_delivery_quote_requests", 
        joinColumns = @JoinColumn(name = "order_id")
    )
    @Column(name = "delivery_quote_request_id")
    private List<Long> deliveryQuoteRequestIds;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    // Order Status Enum
    public enum OrderStatus {
        DELIVERY_PENDING,
        ORDER_PENDING,
        SHIPPED,
        DELIVERED,
        CANCELED
    }
}
