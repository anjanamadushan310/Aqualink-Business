package com.example.aqualink.repository;

import com.example.aqualink.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find orders by customer NIC - commented out due to missing field
    // List<Order> findByNicNumber(String nicNumber);
    
    // Find orders by delivery person NIC - commented out due to missing field
    // List<Order> findByDeliveryGuyNicNumber(String deliveryGuyNicNumber);
    
    // Find orders by status
    List<Order> findByOrderStatus(Order.OrderStatus orderStatus);
    
    // Find orders by delivery person and status - commented out due to missing field
    // List<Order> findByDeliveryGuyNicNumberAndOrderStatus(String deliveryGuyNicNumber, Order.OrderStatus orderStatus);
    
    // Find orders by delivery required status - commented out due to missing field
    // List<Order> findByDeliveryRequiredStatus(String deliveryRequiredStatus);
    
    // Find orders by date range - commented out due to missing orderDate field
    // List<Order> findByOrderDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Find orders for a specific shop owner (orders containing products from that seller)
    // Updated to work with new OrderItem structure (productId + productType instead of product reference)
    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN o.orderItems oi " +
           "WHERE oi.productType = 'FISH' AND EXISTS (" +
           "  SELECT 1 FROM Fish f WHERE f.id = oi.productId AND f.nicNumber = :sellerNic" +
           ") OR oi.productType = 'INDUSTRIAL' AND EXISTS (" +
           "  SELECT 1 FROM IndustrialStuff i WHERE i.id = oi.productId AND i.nicNumber = :sellerNic" +
           ")")
    List<Order> findOrdersBySellerNic(@Param("sellerNic") String sellerNic);
    
    // Find pending orders that need delivery assignment - commented out due to missing field
    // @Query("SELECT o FROM Order o WHERE o.orderStatus = 'DELIVERY_PENDING' AND o.deliveryGuyNicNumber IS NULL")
    // List<Order> findPendingOrdersWithoutDeliveryAssignment();
    
    // Find orders by delivery person with status filter - commented out due to missing field
    // @Query("SELECT o FROM Order o WHERE o.deliveryGuyNicNumber = :deliveryNic AND o.orderStatus IN :statuses")
    // List<Order> findByDeliveryPersonAndStatuses(@Param("deliveryNic") String deliveryNic, @Param("statuses") List<Order.OrderStatus> statuses);
    
    // Count orders by delivery person and status - commented out due to missing field
    // @Query("SELECT COUNT(o) FROM Order o WHERE o.deliveryGuyNicNumber = :deliveryNic AND o.orderStatus = :status")
    // Long countByDeliveryPersonAndStatus(@Param("deliveryNic") String deliveryNic, @Param("status") Order.OrderStatus status);
    
    // Find orders containing products from specific seller with status filter
    // Updated to work with new OrderItem structure (productId + productType instead of product reference)
    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN o.orderItems oi " +
           "WHERE (oi.productType = 'FISH' AND EXISTS (" +
           "  SELECT 1 FROM Fish f WHERE f.id = oi.productId AND f.nicNumber = :sellerNic" +
           ") OR oi.productType = 'INDUSTRIAL' AND EXISTS (" +
           "  SELECT 1 FROM IndustrialStuff i WHERE i.id = oi.productId AND i.nicNumber = :sellerNic" +
           ")) AND o.orderStatus IN :statuses")
    List<Order> findOrdersBySellerNicAndOrderStatuses(@Param("sellerNic") String sellerNic, @Param("statuses") List<Order.OrderStatus> statuses);
    
    // Count orders by user email
    @Query("SELECT COUNT(o) FROM Order o JOIN o.buyerUser u WHERE u.email = :email")
    long countByUserEmail(@Param("email") String email);
}