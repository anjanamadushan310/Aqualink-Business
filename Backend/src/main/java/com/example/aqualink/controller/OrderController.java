package com.example.aqualink.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.aqualink.entity.Order;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.OrderRepository;
import com.example.aqualink.repository.UserRepository;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all orders for the logged-in buyer (customer who placed orders)
     */
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Fetching orders for user: " + email);
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get all orders where this user is the buyer
            List<Order> orders = orderRepository.findAll().stream()
                    .filter(order -> order.getBuyerUser().getId().equals(user.getId()))
                    .toList();
            
            System.out.println("Found " + orders.size() + " orders for user " + email);
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching orders: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get orders by status for the logged-in buyer
     */
    @GetMapping("/my-orders/status/{status}")
    public ResponseEntity<List<Order>> getMyOrdersByStatus(
            @PathVariable String status,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
            
            List<Order> orders = orderRepository.findAll().stream()
                    .filter(order -> order.getBuyerUser().getId().equals(user.getId()))
                    .filter(order -> order.getOrderStatus() == orderStatus)
                    .toList();
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching orders by status: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update order status (only buyer can update)
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Verify this order belongs to the user (buyer)
            if (!order.getBuyerUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).build();
            }

            String newStatus = request.get("status");
            order.setOrderStatus(Order.OrderStatus.valueOf(newStatus));
            
            Order updatedOrder = orderRepository.save(order);
            System.out.println("Order " + orderId + " status updated to " + newStatus);
            
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            System.err.println("Error updating order status: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get order details by ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(
            @PathVariable Long orderId,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Check if user is the buyer
            boolean isAuthorized = order.getBuyerUser().getId().equals(user.getId());

            if (!isAuthorized) {
                return ResponseEntity.status(403).build();
            }

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            System.err.println("Error fetching order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all orders (for delivery person to see available orders)
     */
    @GetMapping("/delivery-pending")
    public ResponseEntity<List<Order>> getDeliveryPendingOrders() {
        try {
            List<Order> orders = orderRepository.findByOrderStatus(Order.OrderStatus.DELIVERY_PENDING);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching delivery pending orders: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all orders for farm owner (seller) - orders containing their products
     */
    @GetMapping("/seller-orders")
    @PreAuthorize("hasRole('FARM_OWNER') or hasRole('SHOP_OWNER') or hasRole('INDUSTRIAL_STUFF_SELLER') or hasRole('SERVICE_PROVIDER')")
    @Transactional
    public ResponseEntity<List<Order>> getSellerOrders(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("=== Fetching seller orders ===");
            System.out.println("User email: " + email);
            System.out.println("Authorities: " + authentication.getAuthorities());
            
            User seller = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("Seller NIC: " + seller.getNicNumber());
            System.out.println("Seller roles from DB: " + seller.getRoles());

            // Use repository method to find orders by seller NIC
            List<Order> sellerOrders = orderRepository.findOrdersBySellerNic(seller.getNicNumber());
            
            System.out.println("Found " + sellerOrders.size() + " orders for seller " + email);
            
            return ResponseEntity.ok(sellerOrders);
        } catch (Exception e) {
            System.err.println("Error fetching seller orders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get seller orders by status
     */
    @GetMapping("/seller-orders/status/{status}")
    public ResponseEntity<List<Order>> getSellerOrdersByStatus(
            @PathVariable String status,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User seller = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
            
            // Use repository method with status filter
            List<Order> sellerOrders = orderRepository.findOrdersBySellerNicAndOrderStatuses(
                seller.getNicNumber(), 
                List.of(orderStatus)
            );
            
            return ResponseEntity.ok(sellerOrders);
        } catch (Exception e) {
            System.err.println("Error fetching seller orders by status: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update order status for seller (farm owner can update their orders)
     */
    @PutMapping("/seller/{orderId}/status")
    public ResponseEntity<Order> updateSellerOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User seller = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Verify this order contains products from this seller by checking if it's in their orders
            List<Order> sellerOrders = orderRepository.findOrdersBySellerNic(seller.getNicNumber());
            boolean isSellerOrder = sellerOrders.stream()
                    .anyMatch(o -> o.getId().equals(orderId));

            if (!isSellerOrder) {
                return ResponseEntity.status(403).build();
            }

            String newStatus = request.get("status");
            order.setOrderStatus(Order.OrderStatus.valueOf(newStatus));
            
            Order updatedOrder = orderRepository.save(order);
            System.out.println("Seller order " + orderId + " status updated to " + newStatus);
            
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            System.err.println("Error updating seller order status: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
