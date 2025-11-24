package com.example.aqualink.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.aqualink.dto.CreateQuoteForFrontendDTO;
import com.example.aqualink.dto.DeliveryQuoteDTO;
import com.example.aqualink.dto.DeliveryQuoteRequestDTO;
import com.example.aqualink.dto.DeliveryQuoteRequestWithOrderDTO;
import com.example.aqualink.dto.DeliveryQuoteWithOrderDTO;
import com.example.aqualink.dto.DeliveryRequestForFrontendDTO;
import com.example.aqualink.entity.DeliveryPersonAvailability;
import com.example.aqualink.entity.DeliveryPersonCoverage;
import com.example.aqualink.entity.DeliveryQuote;
import com.example.aqualink.entity.DeliveryQuoteRequest;
import com.example.aqualink.entity.Fish;
import com.example.aqualink.entity.IndustrialStuff;
import com.example.aqualink.entity.Order;
import com.example.aqualink.entity.OrderItem;
import com.example.aqualink.entity.User;
import com.example.aqualink.entity.UserProfile;
import com.example.aqualink.repository.DeliveryPersonAvailabilityRepository;
import com.example.aqualink.repository.DeliveryPersonCoverageRepository;
import com.example.aqualink.repository.DeliveryQuoteRepository;
import com.example.aqualink.repository.DeliveryQuoteRequestRepository;
import com.example.aqualink.repository.FishRepository;
import com.example.aqualink.repository.IndustrialStuffRepository;
import com.example.aqualink.repository.OrderItemRepository;
import com.example.aqualink.repository.OrderRepository;
import com.example.aqualink.repository.UserProfileRepository;
import com.example.aqualink.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * DeliveryQuoteService - Core service for managing delivery quote operations
 *
 * This service orchestrates the entire delivery quote workflow:
 * 1. Creating delivery quote requests when shop owners submit delivery requests
 * 2. Managing delivery person quote submissions
 * 3. Handling quote acceptance and order finalization
 * 4. Providing data to frontend components for quote display and management
 *
 * Key entities involved:
 * - Order: The original purchase order
 * - DeliveryQuoteRequest: Links order to delivery quote process
 * - DeliveryQuote: Individual quotes from delivery persons
 * - User: Shop owners, delivery persons, and customers
 */
@Service
@RequiredArgsConstructor  // Lombok annotation for constructor injection
@Transactional  // All methods in this service are transactional
public class DeliveryQuoteService {

    // ===== DEPENDENCY INJECTION =====
    // Repositories for database operations
    private final DeliveryQuoteRepository deliveryQuoteRepository;  // CRUD for DeliveryQuote entities
    private final DeliveryQuoteRequestRepository deliveryQuoteRequestRepository;  // CRUD for DeliveryQuoteRequest entities
    private final UserRepository userRepository;  // User management and lookups
    private final OrderRepository orderRepository;  // Order management and lookups
    private final DeliveryPersonCoverageRepository coverageRepository;  // Delivery person coverage areas
    private final DeliveryPersonAvailabilityRepository deliveryPersonAvailabilityRepository;  // Delivery person availability
    private final UserProfileRepository userProfileRepository;  // User profile information
    private final OrderItemRepository orderItemRepository;  // Order item management
    private final FishRepository fishRepository;  // Fish product repository
    private final IndustrialStuffRepository industrialStuffRepository;  // Industrial product repository

    /**
     * Helper method to load product details into OrderItem transient fields
     */
    private void loadProductIntoOrderItem(OrderItem orderItem) {
        if (orderItem.getProductId() == null || orderItem.getProductType() == null) {
            return;
        }
        
        if ("FISH".equalsIgnoreCase(orderItem.getProductType())) {
            fishRepository.findById(orderItem.getProductId()).ifPresent(orderItem::setFishProduct);
        } else if ("INDUSTRIAL".equalsIgnoreCase(orderItem.getProductType())) {
            industrialStuffRepository.findById(orderItem.getProductId()).ifPresent(orderItem::setIndustrialProduct);
        }
    }
    
    /**
     * Helper method to get seller User from OrderItem
     */
    private User getSellerFromOrderItem(OrderItem orderItem) {
        loadProductIntoOrderItem(orderItem);
        
        if (orderItem.getFishProduct() != null) {
            return orderItem.getFishProduct().getUser();
        } else if (orderItem.getIndustrialProduct() != null) {
            return orderItem.getIndustrialProduct().getUser();
        }
        return null;
    }

    /**
     * Update existing order with delivery address (called when submit button is clicked)
     */
    public DeliveryQuoteRequestDTO updateOrderAddressAndFinalizeRequest(Long orderId, DeliveryQuoteRequestWithOrderDTO requestDTO, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Find existing order
        Order existingOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify the order belongs to this customer
        if (!existingOrder.getBuyerUser().getId().equals(customer.getId())) {
            throw new RuntimeException("Order does not belong to this customer");
        }

        // Update delivery address from the request
        if (requestDTO.getDeliveryAddress() != null) {
            System.out.println("Updating order address - Place: " + requestDTO.getDeliveryAddress().getPlace());
            System.out.println("Updating order address - Street: " + requestDTO.getDeliveryAddress().getStreet());
            System.out.println("Updating order address - District: " + requestDTO.getDeliveryAddress().getDistrict());
            System.out.println("Updating order address - Town: " + requestDTO.getDeliveryAddress().getTown());
            
            existingOrder.setAddressPlace(requestDTO.getDeliveryAddress().getPlace());
            existingOrder.setAddressStreet(requestDTO.getDeliveryAddress().getStreet());
            existingOrder.setAddressDistrict(requestDTO.getDeliveryAddress().getDistrict());
            existingOrder.setAddressTown(requestDTO.getDeliveryAddress().getTown());
            
            System.out.println("Order address updated successfully for order ID: " + existingOrder.getId());
        } else {
            System.out.println("No delivery address provided in request");
        }

        // Update total amount if changed
        existingOrder.setTotalAmount(BigDecimal.valueOf(requestDTO.getSubtotal()));

        // Save the updated order
        Order updatedOrder = orderRepository.save(existingOrder);
        System.out.println("Order saved successfully with ID: " + updatedOrder.getId());
        
        // Verify the address was saved correctly
        System.out.println("Saved order address verification:");
        System.out.println("  - Place: " + updatedOrder.getAddressPlace());
        System.out.println("  - Street: " + updatedOrder.getAddressStreet());
        System.out.println("  - District: " + updatedOrder.getAddressDistrict());
        System.out.println("  - Town: " + updatedOrder.getAddressTown());

        // Find the associated quote request
        List<DeliveryQuoteRequest> requests = deliveryQuoteRequestRepository.findByOrderId(updatedOrder.getId());
        if (requests.isEmpty()) {
            throw new RuntimeException("Quote request not found");
        }
        DeliveryQuoteRequest request = requests.get(0); // Get the first (should be only one)

        return convertToDeliveryQuoteRequestDTO(request, customer);
    }

    /**
     * Create a delivery quote request and order (called when submit button is clicked)
     */
    public DeliveryQuoteRequestDTO createQuoteRequestAndOrder(DeliveryQuoteRequestWithOrderDTO requestDTO, String customerEmail) {
        System.out.println("=== createQuoteRequestAndOrder START ===");
        System.out.println("Customer email: " + customerEmail);
        System.out.println("Number of items in request: " + (requestDTO.getItems() != null ? requestDTO.getItems().size() : 0));
        
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Create new order
        Order order = new Order();
        order.setBuyerUser(customer);
        order.setOrderStatus(Order.OrderStatus.DELIVERY_PENDING);
        order.setTotalAmount(BigDecimal.valueOf(requestDTO.getSubtotal()));
        order.setOrderDateTime(LocalDateTime.now());
        
        // Set payment method
        if (requestDTO.getPaymentMethod() != null) {
            order.setPaymentMethod(requestDTO.getPaymentMethod());
            System.out.println("Payment method set: " + requestDTO.getPaymentMethod());
        } else {
            order.setPaymentMethod("CASH_ON_DELIVERY"); // Default to cash on delivery
            System.out.println("Payment method defaulted to: CASH_ON_DELIVERY");
        }
        
        // Set delivery address
        if (requestDTO.getDeliveryAddress() != null) {
            order.setAddressPlace(requestDTO.getDeliveryAddress().getPlace());
            order.setAddressStreet(requestDTO.getDeliveryAddress().getStreet());
            order.setAddressDistrict(requestDTO.getDeliveryAddress().getDistrict());
            order.setAddressTown(requestDTO.getDeliveryAddress().getTown());
            System.out.println("Delivery address set: " + requestDTO.getDeliveryAddress().getPlace() 
                + ", " + requestDTO.getDeliveryAddress().getDistrict());
        }
        
        // Save order to database first to get the ID
        Order savedOrder = orderRepository.save(order);
        System.out.println("✓ Order saved to database with ID: " + savedOrder.getId());
        
        // Create and save order items from cart items
        if (requestDTO.getItems() != null && !requestDTO.getItems().isEmpty()) {
            System.out.println("Creating " + requestDTO.getItems().size() + " order items...");
            
            for (DeliveryQuoteRequestWithOrderDTO.CartItemDTO cartItem : requestDTO.getItems()) {
                System.out.println("Processing cart item: " + cartItem.getProductName() 
                    + ", type: " + cartItem.getProductType() 
                    + ", cartItemId: " + cartItem.getCartItemId());
                
                // Find the product based on productType and store its ID
                Long productId = null;
                String productType = null;
                
                if (cartItem.getProductType() != null) {
                    String type = cartItem.getProductType().toLowerCase();
                    
                    if (type.equals("fish")) {
                        // Search for fish by name - this is not ideal but works as fallback
                        List<Fish> fishes = fishRepository.findByNameContainingIgnoreCase(cartItem.getProductName());
                        if (!fishes.isEmpty()) {
                            productId = fishes.get(0).getId();
                            productType = "FISH";
                            System.out.println("Found fish product with ID: " + productId);
                        } else {
                            System.err.println("WARNING: Fish product not found for: " + cartItem.getProductName());
                        }
                    } else if (type.equals("industrial") || type.equals("industrialstuff")) {
                        // Search for industrial stuff by name
                        List<IndustrialStuff> industrialStuffs = industrialStuffRepository.findByNameContainingIgnoreCase(cartItem.getProductName());
                        if (!industrialStuffs.isEmpty()) {
                            productId = industrialStuffs.get(0).getId();
                            productType = "INDUSTRIAL";
                            System.out.println("Found industrial product with ID: " + productId);
                        } else {
                            System.err.println("WARNING: Industrial product not found for: " + cartItem.getProductName());
                        }
                    }
                }
                
                if (productId != null) {
                    // Create order item with product ID and type (not direct reference)
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(savedOrder);
                    orderItem.setProductId(productId);
                    orderItem.setProductType(productType);
                    orderItem.setProductName(cartItem.getProductName());
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setPrice(BigDecimal.valueOf(cartItem.getPrice()));
                    
                    // Save order item
                    OrderItem savedOrderItem = orderItemRepository.save(orderItem);
                    System.out.println("✓ OrderItem saved with ID: " + savedOrderItem.getOrderItemId() 
                        + " for product: " + cartItem.getProductName());
                } else {
                    System.err.println("ERROR: Could not create order item - product not found for: " + cartItem.getProductName());
                }
            }
            
            System.out.println("✓ All order items processed");
        } else {
            System.out.println("WARNING: No items in request - order created without order items!");
        }
        
        // Create delivery quote request
        DeliveryQuoteRequest quoteRequest = new DeliveryQuoteRequest();
        quoteRequest.setOrderId(savedOrder.getId());
        quoteRequest.setCreateTime(LocalDateTime.now());
        
        // Set expiry time from preferences
        if (requestDTO.getPreferences() != null && requestDTO.getPreferences().getQuotesExpireOn() != null) {
            quoteRequest.setLastRespondingDateTime(requestDTO.getPreferences().getQuotesExpireOn());
        } else {
            // Default to 24 hours
            quoteRequest.setLastRespondingDateTime(LocalDateTime.now().plusHours(24));
        }
        
        DeliveryQuoteRequest savedRequest = deliveryQuoteRequestRepository.save(quoteRequest);
        System.out.println("✓ DeliveryQuoteRequest saved to database with ID: " + savedRequest.getId());
        System.out.println("✓ DeliveryQuoteRequest.orderId: " + savedRequest.getOrderId());
        
        DeliveryQuoteRequestDTO dto = convertToDeliveryQuoteRequestDTO(savedRequest, customer);
        System.out.println("✓ DTO created - orderId: " + dto.getOrderId() + ", sessionId: " + dto.getSessionId());
        System.out.println("=== createQuoteRequestAndOrder END ===");
        
        return dto;
    }

    /**
     * Get available quote requests for delivery persons
     */
    public List<DeliveryRequestForFrontendDTO> getAvailableQuoteRequestsForFrontend() {
        List<DeliveryQuoteRequest> requests = deliveryQuoteRequestRepository.findAll();
        
        return requests.stream()
                .map(this::convertToDeliveryRequestForFrontendDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get available delivery requests for a specific delivery person (using Orders table)
     * Filters based on coverage area and availability
     */
    public List<DeliveryRequestForFrontendDTO> getAvailableQuoteRequestsForDeliveryPerson(String deliveryPersonEmail) {
        System.out.println("=== FETCHING DELIVERY REQUESTS WITH COVERAGE AREA FILTERING ===");
        System.out.println("Delivery person email: " + deliveryPersonEmail);

        // Get delivery person user
        User deliveryPerson = userRepository.findByEmail(deliveryPersonEmail)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));
        
        System.out.println("Delivery person ID: " + deliveryPerson.getId());
        System.out.println("Delivery person NIC: " + deliveryPerson.getNicNumber());

        // Check if delivery person is available
        Optional<DeliveryPersonAvailability> availabilityOpt = 
            deliveryPersonAvailabilityRepository.findByDeliveryPersonUser(deliveryPerson);
        
        if (availabilityOpt.isPresent() && !availabilityOpt.get().getIsAvailable()) {
            System.out.println("Delivery person is marked as unavailable - returning empty list");
            return new ArrayList<>();
        }

        // Get delivery person's coverage areas (towns they can deliver to)
        List<DeliveryPersonCoverage> coverageList = 
            coverageRepository.findByDeliveryPersonUser(deliveryPerson);
        
        // Extract all towns from coverage list (parse "District:Town" format)
        Set<String> coverageTowns = new HashSet<>();
        for (DeliveryPersonCoverage coverage : coverageList) {
            List<String> towns = coverage.getTowns();
            if (towns != null && !towns.isEmpty()) {
                for (String townEntry : towns) {
                    if (townEntry != null && !townEntry.trim().isEmpty()) {
                        // Parse "District:Town" format to extract just the town name
                        String townName;
                        if (townEntry.contains(":")) {
                            // Format is "District:Town", extract town part
                            String[] parts = townEntry.split(":", 2);
                            townName = parts.length > 1 ? parts[1].trim() : townEntry.trim();
                        } else {
                            // No colon, use as-is
                            townName = townEntry.trim();
                        }
                        // Normalize to lowercase for case-insensitive comparison
                        coverageTowns.add(townName.toLowerCase());
                    }
                }
            }
        }
        
        System.out.println("Coverage towns for delivery person: " + coverageTowns);
        System.out.println("Total coverage towns: " + coverageTowns.size());
        
        // Print first 10 coverage towns for debugging
        if (!coverageTowns.isEmpty()) {
            System.out.println("Sample coverage towns: " + coverageTowns.stream().limit(10).collect(Collectors.toList()));
        }

        // Get all orders with DELIVERY_PENDING status (waiting for delivery quotes)
        List<Order> pendingOrders = orderRepository.findByOrderStatus(Order.OrderStatus.DELIVERY_PENDING);
        
        System.out.println("Found " + pendingOrders.size() + " orders with DELIVERY_PENDING status");

        // Get orders that have an ACCEPTED quote - these should be removed from delivery requests
        List<DeliveryQuoteRequest> allQuoteRequests = deliveryQuoteRequestRepository.findAll();
        Set<Long> orderIdsWithAcceptedQuotes = new HashSet<>();
        
        for (DeliveryQuoteRequest quoteRequest : allQuoteRequests) {
            List<DeliveryQuote> acceptedQuotes = deliveryQuoteRepository.findByQuoteRequestAndStatus(
                quoteRequest, DeliveryQuote.QuoteStatus.ACCEPTED);
            if (!acceptedQuotes.isEmpty()) {
                // This order has an accepted quote - exclude it from delivery requests
                orderIdsWithAcceptedQuotes.add(quoteRequest.getOrderId());
            }
        }
        
        System.out.println("Found " + orderIdsWithAcceptedQuotes.size() + " orders with accepted quotes (will be excluded)");

        // Filter orders by coverage area and convert to DTOs
        List<DeliveryRequestForFrontendDTO> filteredRequests = pendingOrders.stream()
                .filter(order -> {
                    // EXCLUDE orders that have an ACCEPTED quote (delivery is assigned)
                    if (orderIdsWithAcceptedQuotes.contains(order.getId())) {
                        System.out.println("Order " + order.getId() + " - EXCLUDED: Already has accepted quote");
                        return false;
                    }
                    
                    // If no coverage areas defined, show all requests (backward compatibility)
                    if (coverageTowns.isEmpty()) {
                        System.out.println("No coverage areas defined - showing order " + order.getId());
                        return true;
                    }
                    
                    // Check customer delivery address town
                    String customerTown = order.getAddressTown();
                    boolean customerTownMatches = false;
                    if (customerTown != null && !customerTown.trim().isEmpty()) {
                        String normalizedCustomerTown = customerTown.trim().toLowerCase();
                        customerTownMatches = coverageTowns.contains(normalizedCustomerTown);
                        System.out.println("Order " + order.getId() + " - Customer Town: '" + customerTown + 
                                         "' (normalized: '" + normalizedCustomerTown + "') - Matches: " + customerTownMatches);
                    } else {
                        System.out.println("Order " + order.getId() + " - Customer has no town in order");
                    }
                    
                    // Check seller address town (all items in one order are from the same seller)
                    boolean sellerTownMatches = false;
                    String sellerTownRaw = null;
                    if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                        // Get the first item to find the seller (all items have the same seller)
                        OrderItem firstItem = order.getOrderItems().get(0);
                        User seller = getSellerFromOrderItem(firstItem);
                        if (seller != null) {
                            System.out.println("Order " + order.getId() + " - Seller: " + seller.getEmail());
                            if (seller.getUserProfile() != null) {
                                sellerTownRaw = seller.getUserProfile().getAddressTown();
                                if (sellerTownRaw != null && !sellerTownRaw.trim().isEmpty()) {
                                    String normalizedSellerTown = sellerTownRaw.trim().toLowerCase();
                                    sellerTownMatches = coverageTowns.contains(normalizedSellerTown);
                                    System.out.println("Order " + order.getId() + " - Seller Town: '" + sellerTownRaw + 
                                                     "' (normalized: '" + normalizedSellerTown + "') - Matches: " + sellerTownMatches);
                                } else {
                                    System.out.println("Order " + order.getId() + " - Seller has no town in profile");
                                }
                            } else {
                                System.out.println("Order " + order.getId() + " - Seller has no profile");
                            }
                        } else {
                            System.out.println("Order " + order.getId() + " - No product or seller found in first item");
                        }
                    } else {
                        System.out.println("Order " + order.getId() + " - No order items");
                    }
                    
                    // CRITICAL: Delivery person must be able to cover BOTH pickup (seller) AND delivery (customer) locations
                    // Show order only if BOTH seller town AND customer town match the coverage areas
                    boolean matches = customerTownMatches && sellerTownMatches;
                    
                    if (!matches) {
                        if (!customerTownMatches && !sellerTownMatches) {
                            System.out.println("Order " + order.getId() + " - EXCLUDED: Neither customer nor seller town in coverage area");
                        } else if (!customerTownMatches) {
                            System.out.println("Order " + order.getId() + " - EXCLUDED: Customer town '" + customerTown + "' not in coverage area (seller town matches)");
                        } else if (!sellerTownMatches) {
                            System.out.println("Order " + order.getId() + " - EXCLUDED: Seller town '" + sellerTownRaw + "' not in coverage area (customer town matches)");
                        }
                    } else {
                        System.out.println("Order " + order.getId() + " - INCLUDED: Both customer and seller towns match coverage area");
                    }
                    
                    return matches;
                })
                .map(this::convertOrderToDeliveryRequestDTO)
                .collect(Collectors.toList());

        System.out.println("After filtering by coverage area: " + filteredRequests.size() + " requests");
        System.out.println("=============================================================");

        return filteredRequests;
    }
    
    /**
     * Convert Order to DeliveryRequestForFrontendDTO
     */
    private DeliveryRequestForFrontendDTO convertOrderToDeliveryRequestDTO(Order order) {
        DeliveryRequestForFrontendDTO dto = new DeliveryRequestForFrontendDTO();
        
        // Find associated quote request
        List<DeliveryQuoteRequest> requests = deliveryQuoteRequestRepository.findByOrderId(order.getId());
        DeliveryQuoteRequest quoteRequest = requests.isEmpty() ? null : requests.get(0);
        
        dto.setRequestId(order.getId());
        dto.setOrderId(order.getId());
        dto.setCreateTime(order.getOrderDateTime());
        dto.setSessionId(quoteRequest != null ? "ORDER-" + order.getId() + "-REQ-" + quoteRequest.getId() : "ORDER-" + order.getId());
        
        // Set deadline from quote request if exists
        if (quoteRequest != null) {
            dto.setDeadline(quoteRequest.getLastRespondingDateTime());
        }
        
        // Set delivery address from order
        String deliveryAddress = String.format("%s, %s, %s, %s",
                order.getAddressPlace() != null ? order.getAddressPlace() : "",
                order.getAddressStreet() != null ? order.getAddressStreet() : "",
                order.getAddressDistrict() != null ? order.getAddressDistrict() : "",
                order.getAddressTown() != null ? order.getAddressTown() : "")
                .replaceAll(", ,", ",").replaceAll("^,|,$", "");
        
        dto.setDeliveryAddress(deliveryAddress);
        dto.setDistrict(order.getAddressDistrict());
        dto.setTown(order.getAddressTown());
        
        // Set seller info (from first order item since all items are from same seller)
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            OrderItem firstItem = order.getOrderItems().get(0);
            User seller = getSellerFromOrderItem(firstItem);
            if (seller != null) {
                dto.setSellerName(seller.getName() != null ? seller.getName() : "Unknown Seller");
                dto.setSellerPhone(seller.getPhoneNumber() != null ? seller.getPhoneNumber() : "N/A");
                
                // Get seller address from profile
                if (seller.getUserProfile() != null) {
                    UserProfile sellerProfile = seller.getUserProfile();
                    String sellerAddress = String.format("%s, %s, %s, %s",
                            sellerProfile.getAddressPlace() != null ? sellerProfile.getAddressPlace() : "",
                            sellerProfile.getAddressStreet() != null ? sellerProfile.getAddressStreet() : "",
                            sellerProfile.getAddressDistrict() != null ? sellerProfile.getAddressDistrict() : "",
                            sellerProfile.getAddressTown() != null ? sellerProfile.getAddressTown() : "")
                            .replaceAll(", ,", ",").replaceAll("^,|,$", "");
                    
                    dto.setSellerAddress(sellerAddress);
                    dto.setSellerDistrict(sellerProfile.getAddressDistrict());
                    dto.setSellerTown(sellerProfile.getAddressTown());
                    dto.setPickupAddress(sellerAddress); // Use seller address as pickup address
                } else {
                    dto.setPickupAddress("Seller Location (Address not available)");
                }
            } else {
                dto.setPickupAddress("Seller Location (Not found)");
            }
        } else {
            dto.setPickupAddress("Seller Location (No items)");
        }
        
        // Set customer info
        User customer = order.getBuyerUser();
        dto.setCustomerName(customer != null ? customer.getName() : "Unknown Customer");
        dto.setCustomerPhone(customer != null ? customer.getPhoneNumber() : "N/A");
        
        // Set order details
        double totalAmount = order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0;
        int totalItems = 0;
        
        try {
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                totalItems = order.getOrderItems().size();
            }
        } catch (Exception e) {
            System.out.println("Warning: Could not load order items: " + e.getMessage());
        }
        
        dto.setTotalAmount(totalAmount);
        dto.setTotalItems(totalItems);
        dto.setOrderDetails(String.format("Order #%d - %d items, Total: Rs.%.2f", 
            order.getId(), totalItems, totalAmount));
        
        return dto;
    }
    
    /**
     * Old method - keeping for reference but using orders directly now
     */
    private List<DeliveryRequestForFrontendDTO> getAvailableQuoteRequestsForDeliveryPersonOld(String deliveryPersonEmail) {
        User deliveryPerson = userRepository.findByEmail(deliveryPersonEmail)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        // Check if delivery person is currently available
        Optional<DeliveryPersonAvailability> availabilityOpt = 
                deliveryPersonAvailabilityRepository.findByDeliveryPersonUser(deliveryPerson);
        
        if (availabilityOpt.isPresent() && !availabilityOpt.get().getIsAvailable()) {
            System.out.println("Delivery person is not available, returning empty list");
            return new ArrayList<>();
        }

        // Get delivery person's coverage areas
        List<DeliveryPersonCoverage> coverageAreas = coverageRepository.findByDeliveryPersonUser(deliveryPerson);
        
        if (coverageAreas.isEmpty()) {
            System.out.println("Delivery person has no coverage areas configured, returning empty list");
            return new ArrayList<>();
        }
        
        // Extract all covered districts and towns from "District:Town" format
        Set<String> coveredDistrictTownPairs = new HashSet<>();
        Set<String> coveredDistricts = new HashSet<>();
        Set<String> coveredTowns = new HashSet<>();
        
        for (DeliveryPersonCoverage coverage : coverageAreas) {
            List<String> towns = coverage.getTowns();
            for (String districtTown : towns) {
                coveredDistrictTownPairs.add(districtTown);
                if (districtTown.contains(":")) {
                    String[] parts = districtTown.split(":");
                    if (parts.length == 2) {
                        coveredDistricts.add(parts[0]);
                        coveredTowns.add(parts[1]);
                    }
                }
            }
        }

        System.out.println("Delivery person coverage - District:Town pairs: " + coveredDistrictTownPairs);

        // Get all quote requests
        List<DeliveryQuoteRequest> allRequests = deliveryQuoteRequestRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        
        return allRequests.stream()
                .filter(request -> {
                    // Filter by expiration time - check if quotes are still accepting
                    // First check explicit expiry time if set
                    if (request.getLastRespondingDateTime() != null && 
                        request.getLastRespondingDateTime().isBefore(now)) {
                        System.out.println("Request " + request.getId() + " expired at " + request.getLastRespondingDateTime());
                        return false;
                    }
                    
                    // Also check if request has been created too long ago (default 72 hours if no explicit expiry)
                    if (request.getLastRespondingDateTime() == null) {
                        LocalDateTime defaultExpiry = request.getCreateTime().plusHours(72); // Default 72 hours
                        if (defaultExpiry.isBefore(now)) {
                            System.out.println("Request " + request.getId() + " expired by default timeout (72 hours)");
                            return false;
                        }
                    }
                    
                    // Get the associated order
                    Order order = orderRepository.findById(request.getOrderId()).orElse(null);
                    if (order == null) {
                        System.out.println("Order not found for request " + request.getId());
                        return false;
                    }
                    
                    // Filter by delivery address coverage (customer delivery location)
                    String orderDistrict = order.getAddressDistrict();
                    String orderTown = order.getAddressTown();
                    
                    if (orderDistrict == null || orderTown == null || 
                        orderDistrict.isEmpty() || orderTown.isEmpty()) {
                        System.out.println("Order " + order.getId() + " missing delivery address information");
                        return false;
                    }
                    
                    String deliveryDistrictTownPair = orderDistrict + ":" + orderTown;
                    if (!coveredDistrictTownPairs.contains(deliveryDistrictTownPair)) {
                        System.out.println("Order " + order.getId() + " delivery address (" + 
                                         deliveryDistrictTownPair + ") not in coverage area");
                        return false;
                    }
                    
                    // Filter by seller location coverage (pickup location)
                    User orderCustomer = order.getBuyerUser();
                    if (orderCustomer != null) {
                        // Try to get seller location from customer's profile
                        Optional<UserProfile> customerProfile = userProfileRepository.findByUserId(orderCustomer.getId());
                        if (customerProfile.isPresent()) {
                            UserProfile profile = customerProfile.get();
                            String sellerDistrict = profile.getAddressDistrict();
                            String sellerTown = profile.getAddressTown();
                            
                            // If seller location is available, check if it's in coverage area
                            if (sellerDistrict != null && sellerTown != null && 
                                !sellerDistrict.isEmpty() && !sellerTown.isEmpty()) {
                                
                                String sellerDistrictTownPair = sellerDistrict + ":" + sellerTown;
                                if (!coveredDistrictTownPairs.contains(sellerDistrictTownPair)) {
                                    System.out.println("Order " + order.getId() + " seller location (" + 
                                                     sellerDistrictTownPair + ") not in coverage area");
                                    return false;
                                }
                            }
                        }
                    }
                    
                    return true;
                })
                .filter(request -> {
                    // Filter out requests where this delivery person already submitted a quote
                    boolean hasQuoted = deliveryQuoteRepository.existsByQuoteRequestAndDeliveryPerson(request, deliveryPerson);
                    if (hasQuoted) {
                        System.out.println("Delivery person already quoted for request " + request.getId());
                    }
                    return !hasQuoted;
                })
                .map(this::convertToDeliveryRequestForFrontendDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a quote from delivery person (using Order ID directly)
     */
    public DeliveryQuoteDTO createQuoteFromFrontend(CreateQuoteForFrontendDTO createDTO, String deliveryPersonEmail) {
        System.out.println("Creating quote for request/order ID: " + createDTO.getRequestId());
        
        User deliveryPerson = userRepository.findByEmail(deliveryPersonEmail)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        // Get the order (requestId is actually the orderId from frontend)
        Order order = orderRepository.findById(createDTO.getRequestId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Find or create the delivery quote request for this order
        List<DeliveryQuoteRequest> requests = deliveryQuoteRequestRepository.findByOrderId(order.getId());
        DeliveryQuoteRequest request;
        
        if (requests.isEmpty()) {
            // Create new quote request if doesn't exist
            request = new DeliveryQuoteRequest();
            request.setOrderId(order.getId());
            request.setCreateTime(LocalDateTime.now());
            request.setLastRespondingDateTime(LocalDateTime.now().plusHours(24));
            request = deliveryQuoteRequestRepository.save(request);
            System.out.println("Created new delivery quote request with ID: " + request.getId());
        } else {
            request = requests.get(0);
            System.out.println("Using existing delivery quote request with ID: " + request.getId());
        }

        // Check if delivery person already submitted a quote for this request
        if (deliveryQuoteRepository.existsByQuoteRequestAndDeliveryPerson(request, deliveryPerson)) {
            throw new RuntimeException("You have already submitted a quote for this request");
        }

        // Create the delivery quote
        DeliveryQuote quote = new DeliveryQuote();
        quote.setQuoteRequest(request);
        quote.setDeliveryPerson(deliveryPerson);
        quote.setDeliveryFee(createDTO.getDeliveryFee());
        quote.setDeliveryDate(createDTO.getDeliveryDate());
        quote.setNotes(createDTO.getNotes() != null ? createDTO.getNotes() : "Delivery quote from " + deliveryPerson.getName());
        quote.setStatus(DeliveryQuote.QuoteStatus.PENDING);
        
        // Set validUntil to 11:59 PM on the day BEFORE the delivery date
        // This ensures quotes expire with time for customers to make alternative arrangements
        LocalDateTime expirationDateTime = createDTO.getDeliveryDate()
                .minusDays(1)  // Day before delivery
                .atTime(23, 59, 0);  // 11:59 PM
        
        // If the calculated expiration is in the past, set it to 24 hours from now as fallback
        if (expirationDateTime.isBefore(LocalDateTime.now())) {
            System.out.println("WARNING: Calculated expiration is in the past. Using 24 hours from now as fallback.");
            expirationDateTime = LocalDateTime.now().plusHours(24);
        }
        
        quote.setValidUntil(expirationDateTime);
        System.out.println("Quote will expire at: " + expirationDateTime + " (day before delivery date: " + createDTO.getDeliveryDate() + ")");

        DeliveryQuote savedQuote = deliveryQuoteRepository.save(quote);
        System.out.println("Quote created with ID: " + savedQuote.getId() + " for order: " + order.getId());
        
        return convertToDeliveryQuoteDTO(savedQuote);
    }

    /**
     * Get quotes for a specific order by orderId
     */
    public List<DeliveryQuoteDTO> getQuotesForOrder(Long orderId, String customerEmail) {
        System.out.println("========================================");
        System.out.println("✓ getQuotesForOrder called");
        System.out.println("✓ Order ID: " + orderId);
        System.out.println("✓ Customer Email: " + customerEmail);
        
        // Verify the order belongs to the customer
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        System.out.println("✓ Order found: " + order.getId());
        
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + customerEmail));
        System.out.println("✓ Customer found: " + customer.getEmail());
        
        System.out.println("✓ Order buyer ID: " + order.getBuyerUser().getId());
        System.out.println("✓ Current user ID: " + customer.getId());
        
        if (!order.getBuyerUser().getId().equals(customer.getId())) {
            throw new RuntimeException("Order does not belong to this customer. Order buyer: " + order.getBuyerUser().getEmail());
        }
        System.out.println("✓ Order ownership verified");
        
        // Get the delivery quote request for this order
        List<DeliveryQuoteRequest> requests = deliveryQuoteRequestRepository.findByOrderId(orderId);
        System.out.println("✓ Found " + requests.size() + " delivery quote request(s) for order ID: " + orderId);
        
        if (requests.isEmpty()) {
            System.out.println("⚠️ No delivery quote request found for order: " + orderId);
            System.out.println("⚠️ This means the order exists but no quote request is linked to it");
            return new ArrayList<>();
        }
        
        DeliveryQuoteRequest request = requests.get(0);
        System.out.println("✓ Using delivery quote request ID: " + request.getId());
        
        // Get all quotes for this request
        List<DeliveryQuote> quotes = deliveryQuoteRepository.findByQuoteRequest(request);
        System.out.println("✓ Found " + quotes.size() + " delivery quote(s) for request ID: " + request.getId());
        
        if (quotes.isEmpty()) {
            System.out.println("⚠️ No delivery quotes submitted yet for this request");
        } else {
            for (DeliveryQuote quote : quotes) {
                System.out.println("  - Quote ID: " + quote.getId() + 
                                 ", Fee: " + quote.getDeliveryFee() + 
                                 ", Status: " + quote.getStatus() +
                                 ", Delivery Person: " + quote.getDeliveryPerson().getEmail());
            }
        }
        
        // Auto-expire quotes that have passed their validUntil time
        LocalDateTime now = LocalDateTime.now();
        int expiredCount = 0;
        for (DeliveryQuote quote : quotes) {
            if (quote.getStatus() == DeliveryQuote.QuoteStatus.PENDING && 
                quote.getValidUntil().isBefore(now)) {
                System.out.println("Auto-expiring quote ID: " + quote.getId() + 
                                 " (validUntil: " + quote.getValidUntil() + " is before now: " + now + ")");
                quote.setStatus(DeliveryQuote.QuoteStatus.EXPIRED);
                deliveryQuoteRepository.save(quote);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            System.out.println("✓ Auto-expired " + expiredCount + " quote(s)");
        }
        
        // Filter out expired quotes - customers should only see PENDING, ACCEPTED, or REJECTED
        List<DeliveryQuote> validQuotes = quotes.stream()
                .filter(quote -> quote.getStatus() != DeliveryQuote.QuoteStatus.EXPIRED)
                .collect(Collectors.toList());
        
        System.out.println("✓ Returning " + validQuotes.size() + " valid (non-expired) quote(s) to customer");
        System.out.println("========================================");
        
        return validQuotes.stream()
                .map(this::convertToDeliveryQuoteDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get quotes for a specific request (legacy method)
     */
    public List<DeliveryQuoteDTO> getQuotesForRequest(String sessionId, String customerEmail) {
        // For now, get all quotes since sessionId mapping is not fully implemented
        List<DeliveryQuote> quotes = deliveryQuoteRepository.findAll();
        
        // Auto-expire quotes that have passed their validUntil time
        LocalDateTime now = LocalDateTime.now();
        for (DeliveryQuote quote : quotes) {
            if (quote.getStatus() == DeliveryQuote.QuoteStatus.PENDING && 
                quote.getValidUntil().isBefore(now)) {
                quote.setStatus(DeliveryQuote.QuoteStatus.EXPIRED);
                deliveryQuoteRepository.save(quote);
            }
        }
        
        // Filter out expired quotes for customer view
        return quotes.stream()
                .filter(quote -> quote.getStatus() != DeliveryQuote.QuoteStatus.EXPIRED)
                .map(this::convertToDeliveryQuoteDTO)
                .collect(Collectors.toList());
    }

    /**
     * Accept a delivery quote and update order
     */
    public DeliveryQuoteDTO acceptQuote(Long quoteId, String customerEmail) {
        DeliveryQuote quote = deliveryQuoteRepository.findById(quoteId)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        // Auto-expire if validUntil has passed
        if (quote.getStatus() == DeliveryQuote.QuoteStatus.PENDING && 
            quote.getValidUntil().isBefore(LocalDateTime.now())) {
            quote.setStatus(DeliveryQuote.QuoteStatus.EXPIRED);
            deliveryQuoteRepository.save(quote);
            throw new RuntimeException("This quote has expired and is no longer available");
        }

        if (quote.getStatus() != DeliveryQuote.QuoteStatus.PENDING) {
            throw new RuntimeException("Quote is no longer available. Current status: " + quote.getStatus());
        }

        quote.setStatus(DeliveryQuote.QuoteStatus.ACCEPTED);
        quote.setAcceptedAt(LocalDateTime.now());

        // Update order with accepted quote information
        Order order = orderRepository.findById(quote.getQuoteRequest().getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setAcceptedDeliveryQuoteId(quote.getId());
        order.setOrderStatus(Order.OrderStatus.ORDER_PENDING);
        orderRepository.save(order);

        // Reject all other quotes for the same request
        List<DeliveryQuote> otherQuotes = deliveryQuoteRepository.findByQuoteRequestAndStatus(
                quote.getQuoteRequest(), DeliveryQuote.QuoteStatus.PENDING);
        
        for (DeliveryQuote otherQuote : otherQuotes) {
            if (!otherQuote.getId().equals(quoteId)) {
                otherQuote.setStatus(DeliveryQuote.QuoteStatus.REJECTED);
                deliveryQuoteRepository.save(otherQuote);
            }
        }

        DeliveryQuote savedQuote = deliveryQuoteRepository.save(quote);
        return convertToDeliveryQuoteDTO(savedQuote);
    }

    /**
     * Get customer's quote requests with full order details
     *
     * CRITICAL METHOD: This method is essential for the frontend QuoteAcceptance component's fallback mechanism.
     * When localStorage is empty (due to page refresh), the frontend calls this method to reconstruct
     * the order data needed to display quotes.
     *
     * WORKFLOW:
     * 1. Frontend QuoteAcceptance loads and checks localStorage for 'aqualink_order_data'
     * 2. If localStorage is null/empty, it calls getMyQuoteRequests() API
     * 3. This method returns the most recent delivery quote request with full order details
     * 4. Frontend reconstructs order data and stores it in localStorage
     * 5. Normal quote loading continues
     *
     * WHY THIS METHOD EXISTS:
     * - localStorage is session-based and gets cleared on page refresh
     * - Users need to access quote-acceptance page at any time via sidebar
     * - This provides a backend fallback to restore order context
     *
     * @param customerEmail Email of the logged-in shop owner
     * @return List of DeliveryQuoteRequestWithOrderDTO with complete order information
     */
    public List<DeliveryQuoteRequestWithOrderDTO> getCustomerQuoteRequestsWithOrders(String customerEmail) {
        System.out.println("========================================");
        System.out.println("✓ getCustomerQuoteRequestsWithOrders called");
        System.out.println("✓ Customer Email: " + customerEmail);
        
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        System.out.println("✓ Customer found: " + customer.getEmail());

        // Find requests where the order belongs to this customer
        List<DeliveryQuoteRequest> allRequests = deliveryQuoteRequestRepository.findAll();
        System.out.println("✓ Total delivery quote requests in database: " + allRequests.size());
        
        List<DeliveryQuoteRequest> requests = allRequests.stream()
                .filter(request -> {
                    try {
                        Order order = orderRepository.findById(request.getOrderId()).orElse(null);
                        if (order == null) {
                            System.out.println("⚠️ Order not found for request ID: " + request.getId() + " (orderId: " + request.getOrderId() + ")");
                            return false;
                        }
                        boolean matches = order.getBuyerUser().getId().equals(customer.getId());
                        System.out.println((matches ? "✓" : "✗") + " Request ID: " + request.getId() + 
                                         ", Order ID: " + request.getOrderId() + 
                                         ", Buyer: " + order.getBuyerUser().getEmail() + 
                                         (matches ? " (MATCH)" : " (NOT MATCH)"));
                        return matches;
                    } catch (Exception e) {
                        System.out.println("⚠️ Error checking request ID: " + request.getId() + " - " + e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());
        
        System.out.println("✓ Found " + requests.size() + " matching requests for customer: " + customerEmail);
        
        List<DeliveryQuoteRequestWithOrderDTO> result = requests.stream()
                .map(request -> {
                    Order order = orderRepository.findById(request.getOrderId())
                            .orElseThrow(() -> new RuntimeException("Order not found"));
                    
                    System.out.println("  → Processing request ID: " + request.getId() + " for order ID: " + order.getId());
                    
                    DeliveryQuoteRequestWithOrderDTO dto = new DeliveryQuoteRequestWithOrderDTO();
                    
                    // CRITICAL: Set orderId
                    dto.setOrderId(order.getId());
                    
                    dto.setSessionId(UUID.randomUUID().toString()); // Generate session ID for tracking
                    dto.setStatus(order.getOrderStatus().toString());
                    dto.setCreatedAt(request.getCreateTime()); // Use request creation time, not order time
                    
                    // Set seller information (from first order item's product seller)
                    try {
                        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                            OrderItem firstItem = order.getOrderItems().get(0);
                            User seller = getSellerFromOrderItem(firstItem);
                            if (seller != null) {
                                dto.setSellerId(seller.getId().toString());
                                dto.setBusinessName(seller.getName()); // User has 'name' field, not firstName/lastName
                            }
                        }
                    } catch (Exception e) {
                        System.out.println("Warning: Could not load seller info: " + e.getMessage());
                    }
                    
                    // Set subtotal with null safety
                    double subtotal = order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0;
                    dto.setSubtotal(subtotal);
                    
                    // Convert order items with null safety and lazy loading handling
                    List<DeliveryQuoteRequestWithOrderDTO.CartItemDTO> items = new ArrayList<>();
                    try {
                        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                            items = order.getOrderItems().stream()
                                    .map(item -> {
                                        DeliveryQuoteRequestWithOrderDTO.CartItemDTO itemDto = 
                                            new DeliveryQuoteRequestWithOrderDTO.CartItemDTO();
                                        itemDto.setQuantity(item.getQuantity());
                                        itemDto.setPrice(item.getPrice() != null ? item.getPrice().doubleValue() : 0.0);
                                        itemDto.setProductName(item.getProductName() != null ? item.getProductName() : "Unknown Product");
                                        return itemDto;
                                    })
                                    .collect(Collectors.toList());
                        }
                    } catch (Exception e) {
                        System.out.println("Warning: Could not load order items for order " + order.getId() + ": " + e.getMessage());
                        items = new ArrayList<>();
                    }
                    dto.setItems(items);
                    
                    // Set delivery address from order address fields
                    DeliveryQuoteRequestWithOrderDTO.DeliveryAddressDTO addressDto = 
                        new DeliveryQuoteRequestWithOrderDTO.DeliveryAddressDTO();
                    addressDto.setPlace(order.getAddressPlace() != null ? order.getAddressPlace() : "");
                    addressDto.setStreet(order.getAddressStreet() != null ? order.getAddressStreet() : "");
                    addressDto.setDistrict(order.getAddressDistrict() != null ? order.getAddressDistrict() : "");
                    addressDto.setTown(order.getAddressTown() != null ? order.getAddressTown() : "");
                    dto.setDeliveryAddress(addressDto);
                    
                    // Set preferences
                    DeliveryQuoteRequestWithOrderDTO.OrderPreferencesDTO preferences = 
                        new DeliveryQuoteRequestWithOrderDTO.OrderPreferencesDTO();
                    preferences.setQuotesExpireAfter(24); // Default 24 hours
                    preferences.setQuotesExpireOn(request.getLastRespondingDateTime());
                    dto.setPreferences(preferences);
                    
                    System.out.println("  ✓ DTO created - orderId: " + dto.getOrderId() + 
                                     ", items: " + dto.getItems().size() + 
                                     ", subtotal: " + dto.getSubtotal());
                    
                    return dto;
                })
                .collect(Collectors.toList());
        
        System.out.println("✓ Returning " + result.size() + " quote request(s)");
        System.out.println("========================================");
        
        return result;
    }

    /**
     * Get specific quote request with order
     */
    public DeliveryQuoteRequestWithOrderDTO getQuoteRequestWithOrder(String sessionId, String customerEmail) {
        // Get requests filtered by customer and find the one with matching sessionId
        List<DeliveryQuoteRequestWithOrderDTO> allRequests = getCustomerQuoteRequestsWithOrders(customerEmail);
        return allRequests.stream()
                .filter(req -> sessionId.equals(req.getSessionId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Quote request not found"));
    }

    /**
     * Get delivery person's quotes with orders
     */
    public List<DeliveryQuoteWithOrderDTO> getDeliveryPersonQuotesWithOrders(String deliveryPersonEmail) {
        User deliveryPerson = userRepository.findByEmail(deliveryPersonEmail)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        List<DeliveryQuote> quotes = deliveryQuoteRepository.findByDeliveryPersonOrderByCreatedAtDesc(deliveryPerson);
        
        return quotes.stream()
                .map(quote -> {
                    Order order = orderRepository.findById(quote.getQuoteRequest().getOrderId())
                            .orElseThrow(() -> new RuntimeException("Order not found"));
                    
                    DeliveryQuoteWithOrderDTO dto = new DeliveryQuoteWithOrderDTO();
                    dto.setId(quote.getId());
                    dto.setDeliveryFee(quote.getDeliveryFee());
                    dto.setDeliveryDate(quote.getDeliveryDate().atStartOfDay());
                    dto.setStatus(quote.getStatus());
                    dto.setOrderId(order.getId());
                    dto.setOrderStatus(order.getOrderStatus());
                    dto.setTotalAmount(order.getTotalAmount());
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Conversion methods
    private DeliveryQuoteDTO convertToDeliveryQuoteDTO(DeliveryQuote quote) {
        DeliveryQuoteDTO dto = new DeliveryQuoteDTO();
        dto.setId(quote.getId());
        dto.setQuoteRequestId(quote.getQuoteRequest().getId());
        dto.setDeliveryPersonId(quote.getDeliveryPerson().getId());
        dto.setDeliveryPersonName(quote.getDeliveryPerson().getName());
        dto.setDeliveryPersonEmail(quote.getDeliveryPerson().getEmail());
        dto.setDeliveryPersonPhone(quote.getDeliveryPerson().getPhoneNumber());
        dto.setDeliveryFee(quote.getDeliveryFee());
        dto.setDeliveryDate(quote.getDeliveryDate());
        dto.setNotes(quote.getNotes());
        dto.setStatus(quote.getStatus());
        dto.setCreatedAt(quote.getCreatedAt());
        dto.setAcceptedAt(quote.getAcceptedAt());
        dto.setValidUntil(quote.getValidUntil());
        return dto;
    }

    private DeliveryQuoteRequestDTO convertToDeliveryQuoteRequestDTO(DeliveryQuoteRequest request, User customer) {
        DeliveryQuoteRequestDTO dto = new DeliveryQuoteRequestDTO();
        dto.setId(request.getId());
        dto.setOrderId(request.getOrderId());
        dto.setSessionId("ORDER-" + request.getOrderId() + "-REQ-" + request.getId()); // Generate consistent session ID
        dto.setLastRespondingDateTime(request.getLastRespondingDateTime());
        dto.setCreateTime(request.getCreateTime());
        dto.setCustomerName(customer.getName());
        dto.setCustomerEmail(customer.getEmail());
        dto.setCustomerPhone(customer.getPhoneNumber());
        
        // For pickup and delivery addresses, we'll need to get them from the order
        // For now, setting placeholder values
        dto.setPickupAddress("Address to be determined from order");
        dto.setDeliveryAddress("Address to be determined from order");
        
        return dto;
    }

    private DeliveryRequestForFrontendDTO convertToDeliveryRequestForFrontendDTO(DeliveryQuoteRequest request) {
        DeliveryRequestForFrontendDTO dto = new DeliveryRequestForFrontendDTO();
        dto.setRequestId(request.getId());
        dto.setOrderId(request.getOrderId());
        dto.setCreateTime(request.getCreateTime());
        dto.setDeadline(request.getLastRespondingDateTime());
        dto.setSessionId(UUID.randomUUID().toString()); // Generate a session ID for tracking
        
        // Get order details
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Set pickup address (seller/shop location - for now using placeholder)
        dto.setPickupAddress("Shop Location - To be determined");
        
        // Set delivery address from order
        String deliveryAddress = String.format("%s, %s, %s, %s",
                order.getAddressPlace() != null ? order.getAddressPlace() : "",
                order.getAddressStreet() != null ? order.getAddressStreet() : "",
                order.getAddressDistrict() != null ? order.getAddressDistrict() : "",
                order.getAddressTown() != null ? order.getAddressTown() : "")
                .replaceAll(", ,", ",").replaceAll("^,|,$", ""); // Clean up empty fields
        
        dto.setDeliveryAddress(deliveryAddress);
        dto.setDistrict(order.getAddressDistrict());
        dto.setTown(order.getAddressTown());
        
        User customer = order.getBuyerUser();
        dto.setCustomerName(customer != null ? customer.getName() : "Unknown Customer");
        dto.setCustomerPhone(customer != null ? customer.getPhoneNumber() : "N/A");
        
        // Set order totals with null checks and lazy loading handling
        double totalAmount = order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0;
        
        int totalItems = 0;
        try {
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                totalItems = order.getOrderItems().size();
            }
        } catch (Exception e) {
            // Handle lazy loading exception - orderItems might not be loaded
            System.out.println("Warning: Could not load order items for order " + order.getId() + ": " + e.getMessage());
            totalItems = 0;
        }
        
        dto.setTotalAmount(totalAmount);
        dto.setTotalItems(totalItems);
        
        dto.setOrderDetails(String.format("Order #%d - %d items, Total: Rs.%.2f", 
            order.getId(),
            totalItems,
            totalAmount));
        
        return dto;
    }

    /**
     * Update delivery quote (only for PENDING quotes)
     */
    public DeliveryQuoteDTO updateQuote(Long quoteId, BigDecimal deliveryFee, java.time.LocalDate deliveryDate, String deliveryPersonEmail) {
        // Find the quote
        DeliveryQuote quote = deliveryQuoteRepository.findById(quoteId)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        // Verify the delivery person owns this quote
        if (!quote.getDeliveryPerson().getEmail().equals(deliveryPersonEmail)) {
            throw new RuntimeException("You don't have permission to update this quote");
        }

        // Only allow updates for PENDING quotes
        if (quote.getStatus() != DeliveryQuote.QuoteStatus.PENDING) {
            throw new RuntimeException("Only pending quotes can be updated. Current status: " + quote.getStatus());
        }

        // Validate input
        if (deliveryFee == null || deliveryFee.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Delivery fee must be greater than zero");
        }

        if (deliveryDate == null || deliveryDate.isBefore(java.time.LocalDate.now())) {
            throw new RuntimeException("Delivery date must be in the future");
        }

        // Update the quote
        quote.setDeliveryFee(deliveryFee);
        quote.setDeliveryDate(deliveryDate);
        
        // Recalculate validUntil based on new delivery date
        // Set to 11:59 PM on the day BEFORE the delivery date
        LocalDateTime newExpirationDateTime = deliveryDate
                .minusDays(1)  // Day before delivery
                .atTime(23, 59, 0);  // 11:59 PM
        
        // If the calculated expiration is in the past, set it to 24 hours from now as fallback
        if (newExpirationDateTime.isBefore(LocalDateTime.now())) {
            System.out.println("WARNING: Updated expiration would be in the past. Using 24 hours from now as fallback.");
            newExpirationDateTime = LocalDateTime.now().plusHours(24);
        }
        
        quote.setValidUntil(newExpirationDateTime);
        System.out.println("Quote ID " + quoteId + " updated. New expiration: " + newExpirationDateTime + " (day before delivery: " + deliveryDate + ")");

        // Save the updated quote
        DeliveryQuote updatedQuote = deliveryQuoteRepository.save(quote);

        // Convert to DTO and return
        return convertToDeliveryQuoteDTO(updatedQuote);
    }

    /**
     * Get order details for delivery person's accepted quote
     */
    public DeliveryQuoteRequestWithOrderDTO getOrderDetailsForDeliveryPerson(Long orderId, String deliveryPersonEmail) {
        // Find the delivery person
        User deliveryPerson = userRepository.findByEmail(deliveryPersonEmail)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        // Find the order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Load product information for order items to get seller details
        if (order.getOrderItems() != null) {
            for (OrderItem orderItem : order.getOrderItems()) {
                if ("FISH".equals(orderItem.getProductType())) {
                    fishRepository.findById(orderItem.getProductId()).ifPresent(orderItem::setFishProduct);
                } else if ("INDUSTRIAL".equals(orderItem.getProductType())) {
                    industrialStuffRepository.findById(orderItem.getProductId()).ifPresent(orderItem::setIndustrialProduct);
                }
            }
        }

        // Verify that the delivery person has an accepted quote for this order
        List<DeliveryQuote> quotes = deliveryQuoteRepository.findByDeliveryPerson(deliveryPerson);
        boolean hasAcceptedQuote = quotes.stream()
                .anyMatch(q -> q.getQuoteRequest().getOrderId().equals(orderId) && 
                              q.getStatus() == DeliveryQuote.QuoteStatus.ACCEPTED);

        if (!hasAcceptedQuote) {
            throw new RuntimeException("You don't have an accepted quote for this order");
        }

        // Build the response DTO with order details
        DeliveryQuoteRequestWithOrderDTO dto = new DeliveryQuoteRequestWithOrderDTO();
        
        // Set basic order info
        dto.setOrderId(order.getId());
        dto.setSubtotal(order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
        dto.setOrderStatus(order.getOrderStatus());
        dto.setOrderDateTime(order.getOrderDateTime());
        
        // Set customer info
        User customer = order.getBuyerUser();
        if (customer != null) {
            dto.setCustomerName(customer.getName());
            dto.setCustomerPhone(customer.getPhoneNumber());
            dto.setCustomerEmail(customer.getEmail());
        }
        
        // Set seller info from the first order item (if available)
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            OrderItem firstItem = order.getOrderItems().get(0);
            User seller = firstItem.getProductUser();
            if (seller != null) {
                dto.setSellerName(seller.getName());
                dto.setSellerPhone(seller.getPhoneNumber());
                dto.setSellerEmail(seller.getEmail());
                
                // Build seller address from UserProfile
                if (seller.getUserProfile() != null) {
                    UserProfile profile = seller.getUserProfile();
                    StringBuilder addressBuilder = new StringBuilder();
                    if (profile.getAddressPlace() != null && !profile.getAddressPlace().isEmpty()) {
                        addressBuilder.append(profile.getAddressPlace());
                    }
                    if (profile.getAddressStreet() != null && !profile.getAddressStreet().isEmpty()) {
                        if (addressBuilder.length() > 0) addressBuilder.append(", ");
                        addressBuilder.append(profile.getAddressStreet());
                    }
                    if (profile.getAddressTown() != null && !profile.getAddressTown().isEmpty()) {
                        if (addressBuilder.length() > 0) addressBuilder.append(", ");
                        addressBuilder.append(profile.getAddressTown());
                    }
                    if (profile.getAddressDistrict() != null && !profile.getAddressDistrict().isEmpty()) {
                        if (addressBuilder.length() > 0) addressBuilder.append(", ");
                        addressBuilder.append(profile.getAddressDistrict());
                    }
                    dto.setSellerAddress(addressBuilder.toString());
                }
            }
        }
        
        // Set delivery address
        DeliveryQuoteRequestWithOrderDTO.DeliveryAddressDTO addressDTO = new DeliveryQuoteRequestWithOrderDTO.DeliveryAddressDTO();
        addressDTO.setPlace(order.getAddressPlace());
        addressDTO.setStreet(order.getAddressStreet());
        addressDTO.setDistrict(order.getAddressDistrict());
        addressDTO.setTown(order.getAddressTown());
        dto.setDeliveryAddress(addressDTO);
        
        // Set order items
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            List<DeliveryQuoteRequestWithOrderDTO.CartItemDTO> items = new ArrayList<>();
            for (OrderItem orderItem : order.getOrderItems()) {
                DeliveryQuoteRequestWithOrderDTO.CartItemDTO itemDTO = new DeliveryQuoteRequestWithOrderDTO.CartItemDTO();
                itemDTO.setProductName(orderItem.getProductName());
                itemDTO.setQuantity(orderItem.getQuantity());
                itemDTO.setPrice(orderItem.getPrice() != null ? orderItem.getPrice().doubleValue() : 0.0);
                itemDTO.setProductType(orderItem.getProductType());
                items.add(itemDTO);
            }
            dto.setItems(items);
        }
        
        return dto;
    }
}