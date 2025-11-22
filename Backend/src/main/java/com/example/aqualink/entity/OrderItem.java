package com.example.aqualink.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;

    @ManyToOne
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    // Store product ID and type instead of direct Product reference
    @Column(name = "product_id")
    private Long productId;
    
    @Column(name = "product_type")
    private String productType; // "FISH" or "INDUSTRIAL"
    
    @Column(name = "product_name")
    private String productName;

    @Column(name = "quantity")
    private int quantity;

    @Column(name = "price")
    private BigDecimal price;
    
    // Transient fields to hold the actual product objects when needed
    @Transient
    private Fish fishProduct;
    
    @Transient
    private IndustrialStuff industrialProduct;
    
    // Helper method to get NIC number from product (for filtering by seller)
    @Transient
    public String getProductNicNumber() {
        if (fishProduct != null) {
            return fishProduct.getNicNumber();
        } else if (industrialProduct != null) {
            return industrialProduct.getNicNumber();
        }
        return null;
    }
    
    // Helper method to get the product User (seller)
    @Transient
    public User getProductUser() {
        if (fishProduct != null) {
            return fishProduct.getUser();
        } else if (industrialProduct != null) {
            return industrialProduct.getUser();
        }
        return null;
    }
    
    // For backward compatibility with existing code that calls getProduct()
    // This is a compatibility shim that provides a minimal Product-like interface
    @Transient
    public ProductProxy getProduct() {
        // Return a proxy object that provides basic product info
        return new ProductProxy(this);
    }
    
    // Inner class to provide Product-like interface
    public static class ProductProxy {
        private final OrderItem orderItem;
        
        public ProductProxy(OrderItem orderItem) {
            this.orderItem = orderItem;
        }
        
        public String getName() {
            return orderItem.getProductName();
        }
        
        public String getProductType() {
            return orderItem.getProductType();
        }
        
        public String getNicNumber() {
            return orderItem.getProductNicNumber();
        }
        
        public User getUser() {
            return orderItem.getProductUser();
        }
    }
}
