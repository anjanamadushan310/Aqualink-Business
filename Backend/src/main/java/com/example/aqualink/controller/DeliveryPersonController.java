package com.example.aqualink.controller;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.UserRepository;
import com.example.aqualink.service.DeliveryService;
import com.example.aqualink.service.CoverageAreaManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryPersonController {

    private final DeliveryService deliveryService;
    private final CoverageAreaManagementService coverageAreaService;
    private final UserRepository userRepository;

    private String getCurrentUserNic(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(User::getNicNumber).orElseThrow(() -> 
            new RuntimeException("User not found for email: " + email));
    }

    /**
     * Get all orders assigned to the authenticated delivery person
     */
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<OrderDeliveryDTO>> getMyOrders(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<OrderDeliveryDTO> orders = deliveryService.getOrdersForDeliveryPerson(deliveryPersonNic);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get pending deliveries for the authenticated delivery person
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<OrderDeliveryDTO>> getPendingDeliveries(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<OrderDeliveryDTO> orders = deliveryService.getPendingDeliveriesForPerson(deliveryPersonNic);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get current/active deliveries for the authenticated delivery person
     */
    @GetMapping("/current-deliveries")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<SimpleCurrentDeliveryDTO>> getCurrentDeliveries(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<SimpleCurrentDeliveryDTO> deliveries = deliveryService.getCurrentDeliveries(deliveryPersonNic);
        return ResponseEntity.ok(deliveries);
    }

    /**
     * Get delivery history for the authenticated delivery person
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<SimpleDeliveryHistoryDTO>> getDeliveryHistory(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<SimpleDeliveryHistoryDTO> history = deliveryService.getDeliveryHistory(deliveryPersonNic);
        return ResponseEntity.ok(history);
    }

    /**
     * Get earnings data for the authenticated delivery person
     */
    @GetMapping("/earnings")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<SimpleEarningsDTO> getEarnings(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        SimpleEarningsDTO earnings = deliveryService.getEarnings(deliveryPersonNic);
        return ResponseEntity.ok(earnings);
    }

    /**
     * Get coverage area settings for the authenticated delivery person
     */
    @GetMapping("/coverage-area")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<SimpleCoverageAreaDTO>> getCoverageArea(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<SimpleCoverageAreaDTO> coverageAreas = deliveryService.getCoverageAreas(deliveryPersonNic);
        return ResponseEntity.ok(coverageAreas);
    }

    /**
     * Update coverage area settings for the authenticated delivery person
     */
    @PutMapping("/coverage-area")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<SimpleCoverageAreaDTO>> updateCoverageArea(
            @RequestBody List<SimpleCoverageAreaDTO> coverageAreaDTOs,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<SimpleCoverageAreaDTO> updatedCoverages = deliveryService.updateCoverageAreas(deliveryPersonNic, coverageAreaDTOs);
        return ResponseEntity.ok(updatedCoverages);
    }

    /**
     * Get availability status for the authenticated delivery person
     */
    @GetMapping("/availability")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<SimpleAvailabilityDTO> getAvailability(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        SimpleAvailabilityDTO availability = deliveryService.getAvailability(deliveryPersonNic);
        return ResponseEntity.ok(availability);
    }

    /**
     * Update availability status for the authenticated delivery person
     */
    @PutMapping("/availability")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<SimpleAvailabilityDTO> updateAvailability(
            @RequestBody SimpleAvailabilityDTO availabilityDTO,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        SimpleAvailabilityDTO updatedAvailability = deliveryService.updateAvailability(deliveryPersonNic, availabilityDTO);
        return ResponseEntity.ok(updatedAvailability);
    }

    /**
     * Confirm delivery completion
     */
    @PostMapping("/confirm/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<SimpleDeliveryConfirmationDTO> confirmDelivery(
            @PathVariable Long orderId,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        SimpleDeliveryConfirmationDTO confirmedDelivery = deliveryService.confirmDelivery(orderId, deliveryPersonNic);
        return ResponseEntity.ok(confirmedDelivery);
    }

    /**
     * Get orders by status for the authenticated delivery person
     */
    @GetMapping("/orders/status/{status}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<List<OrderDeliveryDTO>> getOrdersByStatus(
            @PathVariable String status,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        List<OrderDeliveryDTO> orders = deliveryService.getOrdersByDeliveryPersonAndStatus(deliveryPersonNic, status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Update order status (e.g., mark as picked up, in transit, etc.)
     */
    @PutMapping("/update-status")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> updateOrderStatus(
            @RequestBody OrderStatusUpdateDTO updateDTO,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        updateDTO.setDeliveryPersonNic(deliveryPersonNic); // Ensure security
        
        OrderDeliveryDTO updatedOrder = deliveryService.updateOrderStatus(updateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Mark delivery as completed
     */
    @PutMapping("/complete/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> completeDelivery(
            @PathVariable Long orderId,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        OrderDeliveryDTO completedOrder = deliveryService.completeDelivery(orderId, deliveryPersonNic);
        return ResponseEntity.ok(completedOrder);
    }

    /**
     * Get delivery person statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<DeliveryPersonDTO> getMyStats(Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        DeliveryPersonDTO stats = deliveryService.getDeliveryPersonStats(deliveryPersonNic);
        return ResponseEntity.ok(stats);
    }

    /**
     * Start delivery for an order
     */
    @PutMapping("/start/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> startDelivery(
            @PathVariable Long orderId,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        
        OrderStatusUpdateDTO updateDTO = new OrderStatusUpdateDTO();
        updateDTO.setOrderId(orderId);
        updateDTO.setNewStatus("SHIPPED");
        updateDTO.setDeliveryPersonNic(deliveryPersonNic);
        updateDTO.setNotes("Delivery started");
        
        OrderDeliveryDTO updatedOrder = deliveryService.updateOrderStatus(updateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Mark order as delivered (complete the delivery)
     */
    @PutMapping("/delivered/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> markAsDelivered(
            @PathVariable Long orderId,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        
        OrderStatusUpdateDTO updateDTO = new OrderStatusUpdateDTO();
        updateDTO.setOrderId(orderId);
        updateDTO.setNewStatus("DELIVERED");
        updateDTO.setDeliveryPersonNic(deliveryPersonNic);
        updateDTO.setNotes("Order delivered successfully");
        
        OrderDeliveryDTO updatedOrder = deliveryService.updateOrderStatus(updateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Cancel delivery (mark order as canceled)
     */
    @PutMapping("/cancel/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> cancelDelivery(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> requestBody,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        String reason = requestBody != null ? requestBody.get("reason") : "Canceled by delivery person";
        
        OrderStatusUpdateDTO updateDTO = new OrderStatusUpdateDTO();
        updateDTO.setOrderId(orderId);
        updateDTO.setNewStatus("CANCELED");
        updateDTO.setDeliveryPersonNic(deliveryPersonNic);
        updateDTO.setNotes(reason);
        updateDTO.setCancellationReason(reason);
        
        OrderDeliveryDTO updatedOrder = deliveryService.updateOrderStatus(updateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * Pick up order (mark as picked up from seller)
     */
    @PutMapping("/pickup/{orderId}")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<OrderDeliveryDTO> pickupOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        String deliveryPersonNic = getCurrentUserNic(authentication);
        
        OrderStatusUpdateDTO updateDTO = new OrderStatusUpdateDTO();
        updateDTO.setOrderId(orderId);
        updateDTO.setNewStatus("picked_up");
        updateDTO.setDeliveryPersonNic(deliveryPersonNic);
        updateDTO.setNotes("Order picked up from seller");
        
        OrderDeliveryDTO updatedOrder = deliveryService.updateOrderStatus(updateDTO);
        return ResponseEntity.ok(updatedOrder);
    }

    // Coverage Area Management Endpoints
    
    /**
     * Get coverage area and availability data for the authenticated delivery person
     */
    @GetMapping("/coverage-area-management")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<CoverageAreaManagementDTO> getCoverageAreaData(Authentication authentication) {
        try {
            String deliveryPersonEmail = authentication.getName();
            System.out.println("Getting coverage area data for: " + deliveryPersonEmail);
            
            CoverageAreaManagementDTO data = coverageAreaService.getCoverageAreaData(deliveryPersonEmail);
            System.out.println("Coverage area data retrieved: " + data);
            
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            System.err.println("Error in getCoverageAreaData: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Update coverage area and availability data for the authenticated delivery person
     */
    @PutMapping("/coverage-area-management")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<CoverageAreaManagementDTO> updateCoverageAreaData(
            @RequestBody UpdateCoverageAreaDTO updateDTO,
            Authentication authentication) {
        String deliveryPersonEmail = authentication.getName();
        CoverageAreaManagementDTO updatedData = coverageAreaService.updateCoverageAreaData(deliveryPersonEmail, updateDTO);
        return ResponseEntity.ok(updatedData);
    }

    /**
     * Update only availability status for the authenticated delivery person
     */
    @PutMapping("/availability-status")
    @PreAuthorize("hasRole('DELIVERY_PERSON')")
    public ResponseEntity<CoverageAreaManagementDTO> updateAvailabilityStatus(
            @RequestParam Boolean isAvailable,
            Authentication authentication) {
        String deliveryPersonEmail = authentication.getName();
        CoverageAreaManagementDTO updatedData = coverageAreaService.updateAvailabilityStatus(deliveryPersonEmail, isAvailable);
        return ResponseEntity.ok(updatedData);
    }

    // Admin endpoints for delivery management
    
    /**
     * Assign delivery person to order (Admin only)
     */
    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDeliveryDTO> assignDeliveryPerson(@RequestBody DeliveryAssignmentDTO assignmentDTO) {
        OrderDeliveryDTO assignedOrder = deliveryService.assignDeliveryPerson(assignmentDTO);
        return ResponseEntity.ok(assignedOrder);
    }

    /**
     * Get all available orders for assignment (Admin only)
     */
    @GetMapping("/available-orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDeliveryDTO>> getAvailableOrders() {
        List<OrderDeliveryDTO> orders = deliveryService.getAvailableOrdersForAssignment();
        return ResponseEntity.ok(orders);
    }

    /**
     * Get orders for specific delivery person (Admin only)
     */
    @GetMapping("/person/{deliveryPersonNic}/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDeliveryDTO>> getOrdersForDeliveryPerson(@PathVariable String deliveryPersonNic) {
        List<OrderDeliveryDTO> orders = deliveryService.getOrdersForDeliveryPerson(deliveryPersonNic);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get delivery person stats (Admin only)
     */
    @GetMapping("/person/{deliveryPersonNic}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeliveryPersonDTO> getDeliveryPersonStats(@PathVariable String deliveryPersonNic) {
        DeliveryPersonDTO stats = deliveryService.getDeliveryPersonStats(deliveryPersonNic);
        return ResponseEntity.ok(stats);
    }
}