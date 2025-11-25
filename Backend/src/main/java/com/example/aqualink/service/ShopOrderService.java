package com.example.aqualink.service;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.Order;
import com.example.aqualink.entity.OrderItem;
import com.example.aqualink.entity.User;
import com.example.aqualink.entity.Fish;
import com.example.aqualink.entity.IndustrialStuff;
import com.example.aqualink.repository.OrderRepository;
import com.example.aqualink.repository.UserRepository;
import com.example.aqualink.repository.FishRepository;
import com.example.aqualink.repository.IndustrialStuffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShopOrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;

    /**
     * Get all orders containing products from a specific shop owner
     */
    public List<ShopOrderDTO> getOrdersForShopOwner(String shopOwnerNic) {
        List<Order> orders = orderRepository.findOrdersBySellerNic(shopOwnerNic);
        return orders.stream()
                .map(order -> convertToShopOrderDTO(order, shopOwnerNic))
                .collect(Collectors.toList());
    }

    /**
     * Get orders for shop owner filtered by status
     */
    public List<ShopOrderDTO> getOrdersByShopOwnerAndStatus(String shopOwnerNic, List<Order.OrderStatus> statuses) {
        List<Order> orders = orderRepository.findOrdersBySellerNicAndOrderStatuses(shopOwnerNic, statuses);
        return orders.stream()
                .map(order -> convertToShopOrderDTO(order, shopOwnerNic))
                .collect(Collectors.toList());
    }

    /**
     * Get pending orders for shop owner (orders that need processing)
     */
    public List<ShopOrderDTO> getPendingOrdersForShopOwner(String shopOwnerNic) {
        List<Order.OrderStatus> pendingStatuses = List.of(Order.OrderStatus.DELIVERY_PENDING, Order.OrderStatus.ORDER_PENDING);
        return getOrdersByShopOwnerAndStatus(shopOwnerNic, pendingStatuses);
    }

    /**
     * Get completed orders for shop owner
     */
    public List<ShopOrderDTO> getCompletedOrdersForShopOwner(String shopOwnerNic) {
        List<Order.OrderStatus> completedStatuses = List.of(Order.OrderStatus.DELIVERED);
        return getOrdersByShopOwnerAndStatus(shopOwnerNic, completedStatuses);
    }

    /**
     * Get orders in transit for shop owner
     */
    public List<ShopOrderDTO> getInTransitOrdersForShopOwner(String shopOwnerNic) {
        List<Order.OrderStatus> transitStatuses = List.of(Order.OrderStatus.SHIPPED);
        return getOrdersByShopOwnerAndStatus(shopOwnerNic, transitStatuses);
    }

    /**
     * Update order status (shop owner can confirm/process orders)
     */
    public ShopOrderDTO updateOrderStatus(OrderStatusUpdateDTO updateDTO, String shopOwnerNic) {
        Optional<Order> orderOpt = orderRepository.findById(updateDTO.getOrderId());
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + updateDTO.getOrderId());
        }

        Order order = orderOpt.get();
        
        // Verify the shop owner has products in this order
        boolean hasProducts = order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct() != null && 
                         shopOwnerNic.equals(item.getProduct().getNicNumber()));
        
        if (!hasProducts) {
            throw new RuntimeException("Unauthorized: This order does not contain your products");
        }

        // Update order status based on shop owner permissions
        String newStatus = updateDTO.getNewStatus();
        Order.OrderStatus newOrderStatus = convertStringToOrderStatus(newStatus);
        if (isValidStatusTransition(order.getOrderStatus(), newOrderStatus)) {
            Order.OrderStatus previousStatus = order.getOrderStatus();
            order.setOrderStatus(newOrderStatus);
            
            // If order is being marked as DELIVERED, update sold counts
            if (newOrderStatus == Order.OrderStatus.DELIVERED && previousStatus != Order.OrderStatus.DELIVERED) {
                updateSoldCounts(order);
            }
            
            // If confirming order, set processing date
            if (Order.OrderStatus.ORDER_PENDING.equals(newOrderStatus)) {
                // Order is being processed
            }
            
            Order savedOrder = orderRepository.save(order);
            return convertToShopOrderDTO(savedOrder, shopOwnerNic);
        } else {
            throw new RuntimeException("Invalid status transition from " + order.getOrderStatus() + " to " + newStatus);
        }
    }
    
    /**
     * Update sold counts for products when order is delivered
     */
    private void updateSoldCounts(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            if ("FISH".equals(item.getProductType())) {
                Optional<Fish> fishOpt = fishRepository.findById(item.getProductId());
                if (fishOpt.isPresent()) {
                    Fish fish = fishOpt.get();
                    int currentSold = fish.getSoldCount() != null ? fish.getSoldCount() : 0;
                    fish.setSoldCount(currentSold + item.getQuantity());
                    fishRepository.save(fish);
                }
            } else if ("INDUSTRIAL".equals(item.getProductType())) {
                Optional<IndustrialStuff> industrialOpt = industrialStuffRepository.findById(item.getProductId());
                if (industrialOpt.isPresent()) {
                    IndustrialStuff industrial = industrialOpt.get();
                    int currentSold = industrial.getSoldCount() != null ? industrial.getSoldCount() : 0;
                    industrial.setSoldCount(currentSold + item.getQuantity());
                    industrialStuffRepository.save(industrial);
                }
            }
        }
    }

    /**
     * Prepare order for shipping (shop owner marks items as ready)
     */
    public ShopOrderDTO prepareOrderForShipping(Long orderId, String shopOwnerNic) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Order not found with ID: " + orderId);
        }

        Order order = orderOpt.get();
        
        // Verify the shop owner has products in this order
        boolean hasProducts = order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct() != null && 
                         shopOwnerNic.equals(item.getProduct().getNicNumber()));
        
        if (!hasProducts) {
            throw new RuntimeException("Unauthorized: This order does not contain your products");
        }

        // Mark order as ready for shipping
        order.setOrderStatus(Order.OrderStatus.SHIPPED);
        
        Order savedOrder = orderRepository.save(order);
        return convertToShopOrderDTO(savedOrder, shopOwnerNic);
    }

    /**
     * Get order statistics for shop owner
     */
    public ShopOrderStatsDTO getShopOrderStats(String shopOwnerNic) {
        List<Order> allOrders = orderRepository.findOrdersBySellerNic(shopOwnerNic);
        
        long totalOrders = allOrders.size();
        long pendingOrders = allOrders.stream()
                .filter(o -> List.of(Order.OrderStatus.DELIVERY_PENDING, Order.OrderStatus.ORDER_PENDING).contains(o.getOrderStatus()))
                .count();
        long shippedOrders = allOrders.stream()
                .filter(o -> Order.OrderStatus.SHIPPED.equals(o.getOrderStatus()))
                .count();
        long completedOrders = allOrders.stream()
                .filter(o -> Order.OrderStatus.DELIVERED.equals(o.getOrderStatus()))
                .count();
        long cancelledOrders = allOrders.stream()
                .filter(o -> Order.OrderStatus.CANCELED.equals(o.getOrderStatus()))
                .count();

        // Calculate total revenue from completed orders
        double totalRevenue = allOrders.stream()
                .filter(o -> Order.OrderStatus.DELIVERED.equals(o.getOrderStatus()))
                .flatMap(o -> o.getOrderItems().stream())
                .filter(item -> item.getProduct() != null && 
                               shopOwnerNic.equals(item.getProduct().getNicNumber()))
                .mapToDouble(item -> item.getPrice().doubleValue() * item.getQuantity())
                .sum();

        return new ShopOrderStatsDTO(
                totalOrders,
                pendingOrders,
                shippedOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue
        );
    }

    /**
     * Get orders by date range for shop owner
     */
    public List<ShopOrderDTO> getOrdersByDateRange(String shopOwnerNic, LocalDate startDate, LocalDate endDate) {
        List<Order> allOrders = orderRepository.findOrdersBySellerNic(shopOwnerNic);
        
        return allOrders.stream()
                .filter(order -> {
                    LocalDate orderDate = order.getOrderDateTime().toLocalDate();
                    return !orderDate.isBefore(startDate) && !orderDate.isAfter(endDate);
                })
                .map(order -> convertToShopOrderDTO(order, shopOwnerNic))
                .collect(Collectors.toList());
    }

    private boolean isValidStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {
        // Define valid status transitions for shop owners
        return switch (currentStatus) {
            case DELIVERY_PENDING -> List.of(Order.OrderStatus.ORDER_PENDING, Order.OrderStatus.CANCELED).contains(newStatus);
            case ORDER_PENDING -> List.of(Order.OrderStatus.SHIPPED, Order.OrderStatus.CANCELED).contains(newStatus);
            case SHIPPED -> List.of(Order.OrderStatus.DELIVERED).contains(newStatus);
            default -> false;
        };
    }

    private Order.OrderStatus convertStringToOrderStatus(String status) {
        if (status == null) {
            return null;
        }
        
        return switch (status.toLowerCase()) {
            case "delivery_pending", "pending" -> Order.OrderStatus.DELIVERY_PENDING;
            case "order_pending", "confirmed", "processing" -> Order.OrderStatus.ORDER_PENDING;
            case "shipped", "in_transit", "ready_for_shipping" -> Order.OrderStatus.SHIPPED;
            case "delivered", "completed" -> Order.OrderStatus.DELIVERED;
            case "cancelled", "canceled" -> Order.OrderStatus.CANCELED;
            default -> throw new IllegalArgumentException("Invalid order status: " + status);
        };
    }

    private ShopOrderDTO convertToShopOrderDTO(Order order, String shopOwnerNic) {
        // Get customer information from buyer user
        User customer = order.getBuyerUser();
        String customerName = customer.getName();
        String customerPhone = customer.getPhoneNumber();
        String customerEmail = customer.getEmail();

        // Get delivery person information (not available in current entity)
        String deliveryPersonName = "Not Assigned";
        String deliveryPersonPhone = "N/A";

        // Convert order items, marking which ones belong to this shop owner
        List<ShopOrderDTO.ShopOrderItemDTO> orderItemDTOs = order.getOrderItems().stream()
                .map(item -> convertToShopOrderItemDTO(item, shopOwnerNic))
                .collect(Collectors.toList());

        return new ShopOrderDTO(
                order.getId(), // Use id instead of getOrderId()
                order.getBuyerUser().getNicNumber(), // Get NIC from buyer user
                customerName,
                customerPhone,
                customerEmail,
                order.getOrderDateTime().toLocalDate(), // Convert DateTime to Date
                getShippingAddressFromComponents(order), // Combine address components
                order.getOrderStatus().name(), // Convert enum to string
                order.getTotalAmount(),
                BigDecimal.ZERO, // Default delivery fee since it's not in entity
                null, // No delivery guy NIC in current entity
                deliveryPersonName,
                deliveryPersonPhone,
                "pending", // Default delivery status
                null, // No delivery start date in current entity
                orderItemDTOs
        );
    }

    private String getShippingAddressFromComponents(Order order) {
        StringBuilder address = new StringBuilder();
        if (order.getAddressPlace() != null) address.append(order.getAddressPlace()).append(", ");
        if (order.getAddressStreet() != null) address.append(order.getAddressStreet()).append(", ");
        if (order.getAddressTown() != null) address.append(order.getAddressTown()).append(", ");
        if (order.getAddressDistrict() != null) address.append(order.getAddressDistrict());
        
        String result = address.toString();
        return result.endsWith(", ") ? result.substring(0, result.length() - 2) : result;
    }

    private ShopOrderDTO.ShopOrderItemDTO convertToShopOrderItemDTO(OrderItem orderItem, String shopOwnerNic) {
        boolean isMyProduct = orderItem.getProduct() != null && 
                             shopOwnerNic.equals(orderItem.getProduct().getNicNumber());

        return new ShopOrderDTO.ShopOrderItemDTO(
                orderItem.getOrderItemId(),
                orderItem.getProduct() != null ? orderItem.getProduct().getName() : "Unknown Product",
                orderItem.getProduct() != null ? orderItem.getProduct().getProductType() : "Unknown",
                orderItem.getQuantity(),
                orderItem.getPrice(),
                null, // Product image will be handled separately
                isMyProduct
        );
    }
}