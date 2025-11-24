package com.example.aqualink.service;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.*;
import com.example.aqualink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryPersonCoverageRepository coverageRepository;
    private final DeliveryPersonAvailabilityRepository availabilityRepository;
    private final DeliveryQuoteRepository deliveryQuoteRepository;
    private final DeliveryQuoteRequestRepository deliveryQuoteRequestRepository;

    /**
     * Get all orders assigned to a specific delivery person
     * Note: Current Order entity doesn't have delivery person field
     */
    public List<OrderDeliveryDTO> getOrdersForDeliveryPerson(String deliveryPersonNic) {
        // Since current entity doesn't have delivery person field, return empty list for now
        return List.of();
    }

    /**
     * Get orders for delivery person filtered by status
     * Uses delivery quotes to find orders assigned to this delivery person
     */
    public List<OrderDeliveryDTO> getOrdersByDeliveryPersonAndStatus(String deliveryPersonNic, String status) {
        // Convert string status to enum (for validation)
        Order.OrderStatus orderStatus = convertStringToOrderStatus(status);
        
        // Find delivery person user
        Optional<User> deliveryPersonOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (deliveryPersonOpt.isEmpty()) {
            return List.of();
        }
        
        User deliveryPerson = deliveryPersonOpt.get();
        
        // Find all accepted quotes for this delivery person
        List<DeliveryQuote> acceptedQuotes = deliveryQuoteRepository.findByDeliveryPersonAndStatus(
            deliveryPerson, 
            DeliveryQuote.QuoteStatus.ACCEPTED
        );
        
        // Extract order IDs from the quote requests
        List<Long> orderIds = acceptedQuotes.stream()
            .map(quote -> quote.getQuoteRequest().getOrderId())
            .distinct()
            .collect(Collectors.toList());
        
        if (orderIds.isEmpty()) {
            return List.of();
        }
        
        // Fetch orders and filter by status
        return orderIds.stream()
            .map(orderRepository::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .filter(order -> order.getOrderStatus() == orderStatus)
            .map(this::convertToOrderDeliveryDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get pending orders for delivery person (shipped, in_transit)
     * Note: Current Order entity doesn't have delivery person field
     */
    public List<OrderDeliveryDTO> getPendingDeliveriesForPerson(String deliveryPersonNic) {
        // Since current entity doesn't have delivery person field, return empty list for now
        return List.of();
    }

    /**
     * Update order status by delivery person
     */
    public OrderDeliveryDTO updateOrderStatus(OrderStatusUpdateDTO updateDTO) {
        Optional<Order> orderOpt = orderRepository.findById(updateDTO.getOrderId());
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + updateDTO.getOrderId());
        }

        Order order = orderOpt.get();
        
        // For now, skip delivery person verification since we're using the new quote-based system
        // TODO: Implement proper verification using acceptedDeliveryQuoteId when delivery quote system is ready
        // Verify the delivery person is assigned to this order through the accepted quote
        // if (order.getAcceptedDeliveryQuoteId() != null) {
        //     // Fetch the delivery quote and verify the delivery person
        //     // This will be implemented when the delivery quote system is ready
        // }

        // Update order status - convert string to enum
        try {
            Order.OrderStatus status = Order.OrderStatus.valueOf(updateDTO.getNewStatus().toUpperCase());
            order.setOrderStatus(status);
            
            // If status is CANCELED, save cancellation reason and timestamp
            if (status == Order.OrderStatus.CANCELED) {
                order.setCancellationReason(updateDTO.getCancellationReason());
                order.setCancelledDateTime(LocalDateTime.now());
            }
        } catch (IllegalArgumentException e) {
            // If invalid status, default to ORDER_PENDING
            order.setOrderStatus(Order.OrderStatus.ORDER_PENDING);
        }
        
        // If status is being set to shipped, update accordingly
        if (order.getOrderStatus() == Order.OrderStatus.SHIPPED) {
            // Note: deliveryStartDate field doesn't exist in new Order entity
            // This information could be tracked through delivery quotes if needed
        }

        Order savedOrder = orderRepository.save(order);
        return convertToOrderDeliveryDTO(savedOrder);
    }

    /**
     * Complete delivery - mark order as delivered
     */
    public OrderDeliveryDTO completeDelivery(Long orderId, String deliveryPersonNic) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + orderId);
        }

        Order order = orderOpt.get();
        
        // For now, skip delivery person verification since we're using the new quote-based system
        // TODO: Implement proper verification using acceptedDeliveryQuoteId when delivery quote system is ready
        /*
        if (!order.getDeliveryGuyNicNumber().equals(deliveryPersonNic)) {
            throw new RuntimeException("Unauthorized: Order not assigned to this delivery person");
        }
        */

        // Mark as delivered
        order.setOrderStatus(Order.OrderStatus.DELIVERED);

        Order savedOrder = orderRepository.save(order);
        return convertToOrderDeliveryDTO(savedOrder);
    }

    /**
     * Assign delivery person to an order
     */
    public OrderDeliveryDTO assignDeliveryPerson(DeliveryAssignmentDTO assignmentDTO) {
        Optional<Order> orderOpt = orderRepository.findById(assignmentDTO.getOrderId());
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + assignmentDTO.getOrderId());
        }

        // Verify delivery person exists
        Optional<User> deliveryPersonOpt = userRepository.findByNicNumber(assignmentDTO.getDeliveryPersonNic());
        if (deliveryPersonOpt.isEmpty()) {
            throw new RuntimeException("Delivery person not found with NIC: " + assignmentDTO.getDeliveryPersonNic());
        }

        Order order = orderOpt.get();
        
        // TODO: Update to use new delivery quote system
        // For now, we'll create a basic assignment but the proper way would be through delivery quotes
        // order.setAcceptedDeliveryQuoteId(quoteId); // When delivery quote system is implemented
        
        order.setOrderStatus(Order.OrderStatus.SHIPPED); // Closest equivalent to "assigned"

        Order savedOrder = orderRepository.save(order);
        return convertToOrderDeliveryDTO(savedOrder);
    }

    /**
     * Get delivery person statistics
     */
    public DeliveryPersonDTO getDeliveryPersonStats(String deliveryPersonNic) {
        Optional<User> userOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Delivery person not found with NIC: " + deliveryPersonNic);
        }

        User user = userOpt.get();
        
        // Count deliveries by status
        // Note: Current Order entity doesn't have delivery person field
        // These statistics would need to be calculated differently or through delivery quotes
        Long totalDeliveries = 0L; // orderRepository.countByDeliveryPersonAndStatus(deliveryPersonNic, Order.OrderStatus.DELIVERED);
        Long pendingDeliveries = 0L; // orderRepository.countByDeliveryPersonAndStatus(deliveryPersonNic, Order.OrderStatus.SHIPPED) +
                                // orderRepository.countByDeliveryPersonAndStatus(deliveryPersonNic, Order.OrderStatus.IN_TRANSIT);
        Long completedDeliveries = totalDeliveries;

        return new DeliveryPersonDTO(
                user.getNicNumber(),
                user.getName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.isActive(),
                totalDeliveries.intValue(),
                pendingDeliveries.intValue(),
                completedDeliveries.intValue()
        );
    }

    /**
     * Get available orders for assignment (pending orders without delivery person)
     */
    public List<OrderDeliveryDTO> getAvailableOrdersForAssignment() {
        // Since current entity doesn't have delivery person field, get all delivery pending orders
        List<Order> orders = orderRepository.findByOrderStatus(Order.OrderStatus.DELIVERY_PENDING);
        return orders.stream()
                .map(this::convertToOrderDeliveryDTO)
                .collect(Collectors.toList());
    }

    private OrderDeliveryDTO convertToOrderDeliveryDTO(Order order) {
        // Get customer information from the buyerUser relationship
        User customer = order.getBuyerUser();
        String customerName = customer != null ? customer.getName() : "Unknown Customer";
        String customerPhone = customer != null ? customer.getPhoneNumber() : "N/A";

        // Convert order items
        List<OrderDeliveryDTO.OrderItemDTO> orderItemDTOs = order.getOrderItems().stream()
                .map(this::convertToOrderItemDTO)
                .collect(Collectors.toList());

        // Combine address components into full address
        String fullAddress = String.join(", ", 
            order.getAddressPlace() != null ? order.getAddressPlace() : "",
            order.getAddressStreet() != null ? order.getAddressStreet() : "",
            order.getAddressTown() != null ? order.getAddressTown() : "",
            order.getAddressDistrict() != null ? order.getAddressDistrict() : ""
        ).replaceAll("^,\\s*|,\\s*$", ""); // Remove leading/trailing commas

        return new OrderDeliveryDTO(
                order.getId(), // Use new id field
                customer != null ? customer.getNicNumber() : "N/A", // Get NIC from buyerUser
                customerName,
                customerPhone,
                order.getOrderDateTime() != null ? order.getOrderDateTime().toLocalDate() : null, // Convert DateTime to Date
                fullAddress, // Use combined address
                order.getOrderStatus().toString(), // Convert enum to string
                order.getTotalAmount(),
                BigDecimal.ZERO, // deliveryFee - not in new structure, use 0
                "N/A", // deliveryRequiredStatus - not in new structure
                null, // deliveryStartDate - not in new structure
                orderItemDTOs,
                order.getCancellationReason(),
                order.getCancelledDateTime()
        );
    }

    private OrderDeliveryDTO.OrderItemDTO convertToOrderItemDTO(OrderItem orderItem) {
        // Get seller information from product
        String sellerName = "Unknown Seller";
        String sellerPhone = "N/A";
        String productImage = null;
        
        if (orderItem.getProduct() != null && orderItem.getProduct().getNicNumber() != null) {
            Optional<User> sellerOpt = userRepository.findByNicNumber(orderItem.getProduct().getNicNumber());
            if (sellerOpt.isPresent()) {
                sellerName = sellerOpt.get().getName();
                sellerPhone = sellerOpt.get().getPhoneNumber();
            }
        }

        return new OrderDeliveryDTO.OrderItemDTO(
                orderItem.getOrderItemId(),
                orderItem.getProduct() != null ? orderItem.getProduct().getName() : "Unknown Product",
                orderItem.getProduct() != null ? orderItem.getProduct().getProductType() : "Unknown",
                orderItem.getQuantity(),
                orderItem.getPrice(),
                productImage,
                sellerName,
                sellerPhone
        );
    }

    /**
     * Get current active deliveries for delivery person
     */
    public List<SimpleCurrentDeliveryDTO> getCurrentDeliveries(String deliveryPersonNic) {
        // Note: Current Order entity doesn't have delivery person field
        // Return empty list for now
        return List.of();
    }

    /**
     * Get delivery history for delivery person
     */
    public List<SimpleDeliveryHistoryDTO> getDeliveryHistory(String deliveryPersonNic) {
        // TODO: Update to work with new order structure - for now return empty list
        // The new structure doesn't store delivery person NIC directly
        // This would need to be implemented through delivery quotes
        return List.of(); // Return empty list for now
        
        /*
        List<Order> orders = orderRepository.findByDeliveryGuyNicNumber(deliveryPersonNic);
        
        return orders.stream()
                .filter(order -> Order.OrderStatus.DELIVERED.equals(order.getOrderStatus()) || 
                               Order.OrderStatus.CANCELED.equals(order.getOrderStatus()))
                .map(this::convertToSimpleDeliveryHistoryDTO)
                .collect(Collectors.toList());
        */
    }

    /**
     * Get earnings data for delivery person
     */
    public SimpleEarningsDTO getEarnings(String deliveryPersonNic) {
        // TODO: Implement proper earnings calculation when delivery quote system is ready
        // For now, return zero earnings since the new Order entity doesn't have deliveryFee
        // and we don't have the delivery person assignment in the current structure
        
        // Get all orders (for now, we can't filter by delivery person due to new structure)
        List<Order> allOrders = orderRepository.findAll();
        
        // Filter delivered orders
        List<Order> deliveredOrders = allOrders.stream()
                .filter(order -> order.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());
        
        // Since we don't have delivery fees in new structure, return zero for now
        BigDecimal totalEarnings = BigDecimal.ZERO;
                
        // Calculate current month earnings (also zero for now)
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        BigDecimal monthlyEarnings = deliveredOrders.stream()
                .filter(order -> order.getOrderDateTime() != null && 
                               (order.getOrderDateTime().toLocalDate().isAfter(startOfMonth) || 
                                order.getOrderDateTime().toLocalDate().isEqual(startOfMonth)))
                .map(order -> BigDecimal.ZERO) // No delivery fee in new structure
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        // Calculate today's earnings (also zero for now)
        LocalDate today = LocalDate.now();
        BigDecimal dailyEarnings = deliveredOrders.stream()
                .filter(order -> order.getOrderDateTime() != null && 
                               order.getOrderDateTime().toLocalDate().isEqual(today))
                .map(order -> BigDecimal.ZERO) // No delivery fee in new structure
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        int totalDeliveries = deliveredOrders.size();
        int monthlyDeliveries = (int) deliveredOrders.stream()
                .filter(order -> order.getOrderDateTime() != null && 
                               (order.getOrderDateTime().toLocalDate().isAfter(startOfMonth) || 
                                order.getOrderDateTime().toLocalDate().isEqual(startOfMonth)))
                .count();
                
        return new SimpleEarningsDTO(
                totalEarnings,
                monthlyEarnings,
                dailyEarnings,
                totalDeliveries,
                monthlyDeliveries
        );
    }

    /**
     * Get coverage areas for delivery person
     */
    public List<SimpleCoverageAreaDTO> getCoverageAreas(String deliveryPersonNic) {
        // Since we've moved to user-based coverage area management,
        // we need to find the user first and then get their coverage data
        Optional<User> userOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (userOpt.isEmpty()) {
            return new ArrayList<>();
        }
        
        User user = userOpt.get();
        List<DeliveryPersonCoverage> coverages = coverageRepository.findByDeliveryPersonUser(user);
        
        // Convert the new structure (towns list) to the old DTO format
        List<SimpleCoverageAreaDTO> result = new ArrayList<>();
        for (DeliveryPersonCoverage coverage : coverages) {
            if (coverage.getTowns() != null) {
                for (String town : coverage.getTowns()) {
                    // Parse town format "District:Town" if applicable
                    String district = "";
                    String townName = town;
                    if (town.contains(":")) {
                        String[] parts = town.split(":", 2);
                        district = parts[0];
                        townName = parts[1];
                    }
                    
                    result.add(new SimpleCoverageAreaDTO(
                            coverage.getId(),
                            district,
                            townName,
                            true // Since we removed the active field, assume true
                    ));
                }
            }
        }
        
        return result;
    }

    /**
     * Update coverage areas for delivery person
     */
    public List<SimpleCoverageAreaDTO> updateCoverageAreas(String deliveryPersonNic, List<SimpleCoverageAreaDTO> coverageAreas) {
        // Find the user first
        Optional<User> userOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (userOpt.isEmpty()) {
            return new ArrayList<>();
        }
        
        User user = userOpt.get();
        
        // Delete all existing coverage areas for this delivery person
        List<DeliveryPersonCoverage> existingCoverages = coverageRepository.findByDeliveryPersonUser(user);
        coverageRepository.deleteAll(existingCoverages);
        
        // Group coverage areas by district and collect towns
        List<String> allTowns = coverageAreas.stream()
                .map(dto -> dto.getDistrict() + ":" + dto.getTown())
                .collect(Collectors.toList());
        
        // Create a single coverage record with all towns
        if (!allTowns.isEmpty()) {
            DeliveryPersonCoverage coverage = new DeliveryPersonCoverage();
            coverage.setDeliveryPersonUser(user);
            coverage.setTowns(allTowns);
            
            DeliveryPersonCoverage savedCoverage = coverageRepository.save(coverage);
            
            // Convert back to the DTO format expected by the caller
            return allTowns.stream()
                    .map(town -> {
                        String[] parts = town.split(":", 2);
                        String district = parts.length > 1 ? parts[0] : "";
                        String townName = parts.length > 1 ? parts[1] : parts[0];
                        return new SimpleCoverageAreaDTO(
                                savedCoverage.getId(),
                                district,
                                townName,
                                true
                        );
                    })
                    .collect(Collectors.toList());
        }
        
        return new ArrayList<>();
    }

    /**
     * Get availability status for delivery person
     */
    public SimpleAvailabilityDTO getAvailability(String deliveryPersonNic) {
        // Find user by NIC first
        Optional<User> userOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (userOpt.isEmpty()) {
            return new SimpleAvailabilityDTO(false, null, null, LocalDateTime.now());
        }
        
        Optional<DeliveryPersonAvailability> availability = availabilityRepository.findByDeliveryPersonUser(userOpt.get());
        
        if (availability.isPresent()) {
            DeliveryPersonAvailability avail = availability.get();
            return new SimpleAvailabilityDTO(
                    avail.getIsAvailable(),
                    null, // No longer storing start/end times in new structure
                    null, // No longer storing start/end times in new structure
                    avail.getLastUpdated()
            );
        } else {
            // Return default availability
            return new SimpleAvailabilityDTO(false, null, null, LocalDateTime.now());
        }
    }

    /**
     * Update availability for delivery person
     */
    public SimpleAvailabilityDTO updateAvailability(String deliveryPersonNic, SimpleAvailabilityDTO availabilityDTO) {
        // Find user by NIC first
        Optional<User> userOpt = userRepository.findByNicNumber(deliveryPersonNic);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Delivery person not found with NIC: " + deliveryPersonNic);
        }
        
        User deliveryPersonUser = userOpt.get();
        Optional<DeliveryPersonAvailability> existingAvailability = availabilityRepository.findByDeliveryPersonUser(deliveryPersonUser);
        
        DeliveryPersonAvailability availability;
        if (existingAvailability.isPresent()) {
            availability = existingAvailability.get();
        } else {
            availability = new DeliveryPersonAvailability();
            availability.setDeliveryPersonUser(deliveryPersonUser);
            availability.setServiceTowns(new ArrayList<>());
        }
        
        availability.setIsAvailable(availabilityDTO.getAvailable());
        // Note: No longer storing start/end times in new structure
        availability.setLastUpdated(LocalDateTime.now());
        
        DeliveryPersonAvailability savedAvailability = availabilityRepository.save(availability);
        
        return new SimpleAvailabilityDTO(
                savedAvailability.getIsAvailable(),
                null, // No longer storing start/end times
                null, // No longer storing start/end times
                savedAvailability.getLastUpdated()
        );
    }

    /**
     * Confirm delivery completion
     */
    public SimpleDeliveryConfirmationDTO confirmDelivery(Long orderId, String deliveryPersonNic) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + orderId);
        }

        Order order = orderOpt.get();
        
        // For now, skip delivery person verification since we're using the new quote-based system
        // TODO: Implement proper verification using acceptedDeliveryQuoteId when delivery quote system is ready
        /*
        if (!order.getDeliveryGuyNicNumber().equals(deliveryPersonNic)) {
            throw new RuntimeException("Unauthorized: Order not assigned to this delivery person");
        }
        */

        // Mark as delivered
        order.setOrderStatus(Order.OrderStatus.DELIVERED);

        Order savedOrder = orderRepository.save(order);
        
        return new SimpleDeliveryConfirmationDTO(
                savedOrder.getId(), // Use new id field
                savedOrder.getOrderStatus().toString(), // Convert enum to string
                "Delivery confirmed successfully",
                LocalDateTime.now()
        );
    }

    // Helper methods for new DTOs
    
    private SimpleCurrentDeliveryDTO convertToSimpleCurrentDeliveryDTO(Order order) {
        User customer = order.getBuyerUser();
        String customerName = customer != null ? customer.getName() : "Unknown Customer";
        String customerPhone = customer != null ? customer.getPhoneNumber() : "N/A";
        
        // Combine address components
        String fullAddress = String.join(", ", 
            order.getAddressPlace() != null ? order.getAddressPlace() : "",
            order.getAddressStreet() != null ? order.getAddressStreet() : "",
            order.getAddressTown() != null ? order.getAddressTown() : "",
            order.getAddressDistrict() != null ? order.getAddressDistrict() : ""
        ).replaceAll("^,\\s*|,\\s*$", "");
        
        return new SimpleCurrentDeliveryDTO(
                order.getId(), // Use new id field
                customerName,
                customerPhone,
                fullAddress, // Use combined address
                order.getOrderStatus().toString(), // Convert enum to string
                order.getTotalAmount(),
                BigDecimal.ZERO, // deliveryFee - not in new structure
                order.getOrderDateTime() != null ? order.getOrderDateTime().toLocalDate() : null, // Convert DateTime to Date
                null // deliveryStartDate - not in new structure
        );
    }

    /**
     * Convert string status to OrderStatus enum
     */
    private Order.OrderStatus convertStringToOrderStatus(String status) {
        if (status == null) {
            return Order.OrderStatus.ORDER_PENDING;
        }
        
        return switch (status.toLowerCase()) {
            case "delivery_pending", "pending" -> Order.OrderStatus.DELIVERY_PENDING;
            case "order_pending", "confirmed", "processing" -> Order.OrderStatus.ORDER_PENDING;
            case "shipped", "in_transit", "ready_for_shipping" -> Order.OrderStatus.SHIPPED;
            case "delivered", "completed" -> Order.OrderStatus.DELIVERED;
            case "cancelled", "canceled" -> Order.OrderStatus.CANCELED;
            default -> Order.OrderStatus.ORDER_PENDING;
        };
    }

    private SimpleDeliveryHistoryDTO convertToSimpleDeliveryHistoryDTO(Order order) {
        User customer = order.getBuyerUser();
        String customerName = customer != null ? customer.getName() : "Unknown Customer";
        
        // Combine address components
        String fullAddress = String.join(", ", 
            order.getAddressPlace() != null ? order.getAddressPlace() : "",
            order.getAddressStreet() != null ? order.getAddressStreet() : "",
            order.getAddressTown() != null ? order.getAddressTown() : "",
            order.getAddressDistrict() != null ? order.getAddressDistrict() : ""
        ).replaceAll("^,\\s*|,\\s*$", "");
        
        return new SimpleDeliveryHistoryDTO(
                order.getId(), // Use new id field
                customerName,
                fullAddress, // Use combined address
                order.getOrderStatus().toString(), // Convert enum to string
                order.getTotalAmount(),
                BigDecimal.ZERO, // deliveryFee - not in new structure, use 0
                order.getOrderDateTime() != null ? order.getOrderDateTime().toLocalDate() : null, // Convert DateTime to Date
                null // deliveryStartDate - not in new structure
        );
    }
}