package com.example.aqualink.service;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.*;
import com.example.aqualink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EarningsManagementService {

    private final OrderRepository orderRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final DeliveryQuoteRepository deliveryQuoteRepository;
    private final UserRepository userRepository;
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;

    public Page<EarningsTransactionDTO> getAllTransactions(EarningsFilterDTO filter, Pageable pageable) {
        log.info("Fetching earnings transactions with filter: {}", filter);

        List<EarningsTransactionDTO> allTransactions = new ArrayList<>();

        boolean fetchOrders = filter.getTransactionType() == null || 
                             filter.getTransactionType().equals("ALL") || 
                             filter.getTransactionType().equals("PRODUCT_ORDER");
        boolean fetchBookings = filter.getTransactionType() == null || 
                               filter.getTransactionType().equals("ALL") || 
                               filter.getTransactionType().equals("SERVICE_BOOKING");
        boolean fetchDelivery = filter.getTransactionType() == null || 
                               filter.getTransactionType().equals("ALL") || 
                               filter.getTransactionType().equals("DELIVERY_FEE");

        if (fetchOrders) {
            List<Order> orders = orderRepository.findAll();
            allTransactions.addAll(orders.stream()
                    .filter(o -> applyOrderFilters(o, filter))
                    .map(this::convertOrderToTransaction)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }

        if (fetchBookings) {
            List<ServiceBooking> bookings = serviceBookingRepository.findAll();
            allTransactions.addAll(bookings.stream()
                    .filter(b -> applyBookingFilters(b, filter))
                    .map(this::convertBookingToTransaction)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }

        if (fetchDelivery) {
            List<DeliveryQuote> quotes = deliveryQuoteRepository.findAll();
            allTransactions.addAll(quotes.stream()
                    .filter(q -> q.getStatus() == DeliveryQuote.QuoteStatus.ACCEPTED)
                    .filter(q -> applyDeliveryFilters(q, filter))
                    .map(this::convertDeliveryToTransaction)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }

        allTransactions.sort((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()));

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allTransactions.size());
        List<EarningsTransactionDTO> pageContent = allTransactions.subList(start, Math.min(end, allTransactions.size()));

        return new PageImpl<>(pageContent, pageable, allTransactions.size());
    }

    public EarningsStatisticsDTO getEarningsStatistics() {
        log.info("Calculating earnings statistics");

        EarningsStatisticsDTO stats = new EarningsStatisticsDTO();

        List<Order> allOrders = orderRepository.findAll();
        List<ServiceBooking> allBookings = serviceBookingRepository.findAll();
        List<DeliveryQuote> acceptedQuotes = deliveryQuoteRepository.findAll().stream()
                .filter(q -> q.getStatus() == DeliveryQuote.QuoteStatus.ACCEPTED)
                .collect(Collectors.toList());

        BigDecimal productRevenue = allOrders.stream()
                .filter(o -> o.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal serviceRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.COMPLETED)
                .map(ServiceBooking::getQuotedPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveryRevenue = acceptedQuotes.stream()
                .map(DeliveryQuote::getDeliveryFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.setTotalProductRevenue(productRevenue);
        stats.setTotalServiceRevenue(serviceRevenue);
        stats.setTotalDeliveryRevenue(deliveryRevenue);
        stats.setTotalRevenue(productRevenue.add(serviceRevenue).add(deliveryRevenue));

        stats.setProductOrdersCount((long) allOrders.size());
        stats.setServiceBookingsCount((long) allBookings.size());
        stats.setDeliveryTransactionsCount((long) acceptedQuotes.size());
        stats.setTotalTransactions(stats.getProductOrdersCount() + stats.getServiceBookingsCount() + stats.getDeliveryTransactionsCount());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0);

        BigDecimal monthRevenue = calculateRevenueForPeriod(allOrders, allBookings, acceptedQuotes, startOfMonth, now);
        BigDecimal weekRevenue = calculateRevenueForPeriod(allOrders, allBookings, acceptedQuotes, startOfWeek, now);
        BigDecimal todayRevenue = calculateRevenueForPeriod(allOrders, allBookings, acceptedQuotes, startOfDay, now);

        stats.setRevenueThisMonth(monthRevenue);
        stats.setRevenueThisWeek(weekRevenue);
        stats.setRevenueToday(todayRevenue);

        stats.setRevenueByPaymentMethod(calculateRevenueByPaymentMethod(allOrders));
        stats.setTransactionsByStatus(calculateTransactionsByStatus(allOrders, allBookings));
        stats.setTopSellers(calculateTopSellers(allOrders, allBookings, acceptedQuotes));
        stats.setMonthlyRevenueTrend(calculateMonthlyTrend(allOrders, allBookings, acceptedQuotes));

        return stats;
    }

    private boolean applyOrderFilters(Order order, EarningsFilterDTO filter) {
        if (filter.getStartDate() != null && order.getOrderDateTime() != null && order.getOrderDateTime().isBefore(filter.getStartDate())) return false;
        if (filter.getEndDate() != null && order.getOrderDateTime() != null && order.getOrderDateTime().isAfter(filter.getEndDate())) return false;
        if (filter.getStatus() != null && !order.getOrderStatus().toString().equals(filter.getStatus())) return false;
        if (filter.getPaymentMethod() != null && !filter.getPaymentMethod().equalsIgnoreCase(order.getPaymentMethod())) return false;
        if (filter.getMinAmount() != null && (order.getTotalAmount() == null || order.getTotalAmount().compareTo(filter.getMinAmount()) < 0)) return false;
        if (filter.getMaxAmount() != null && (order.getTotalAmount() == null || order.getTotalAmount().compareTo(filter.getMaxAmount()) > 0)) return false;
        return true;
    }

    private boolean applyBookingFilters(ServiceBooking booking, EarningsFilterDTO filter) {
        if (filter.getStartDate() != null && booking.getBookedAt().isBefore(filter.getStartDate())) return false;
        if (filter.getEndDate() != null && booking.getBookedAt().isAfter(filter.getEndDate())) return false;
        if (filter.getStatus() != null && !booking.getStatus().toString().equals(filter.getStatus())) return false;
        if (filter.getMinAmount() != null && (booking.getQuotedPrice() == null || booking.getQuotedPrice().compareTo(filter.getMinAmount()) < 0)) return false;
        if (filter.getMaxAmount() != null && (booking.getQuotedPrice() == null || booking.getQuotedPrice().compareTo(filter.getMaxAmount()) > 0)) return false;
        if (filter.getSellerId() != null && !booking.getServiceProviderId().equals(filter.getSellerId())) return false;
        return true;
    }

    private boolean applyDeliveryFilters(DeliveryQuote quote, EarningsFilterDTO filter) {
        if (filter.getStartDate() != null && quote.getCreatedAt().isBefore(filter.getStartDate())) return false;
        if (filter.getEndDate() != null && quote.getCreatedAt().isAfter(filter.getEndDate())) return false;
        if (filter.getMinAmount() != null && (quote.getDeliveryFee() == null || quote.getDeliveryFee().compareTo(filter.getMinAmount()) < 0)) return false;
        if (filter.getMaxAmount() != null && (quote.getDeliveryFee() == null || quote.getDeliveryFee().compareTo(filter.getMaxAmount()) > 0)) return false;
        return true;
    }

    private EarningsTransactionDTO convertOrderToTransaction(Order order) {
        EarningsTransactionDTO dto = new EarningsTransactionDTO();
        dto.setId(order.getId());
        dto.setTransactionType("PRODUCT_ORDER");
        dto.setAmount(order.getTotalAmount());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTransactionDate(order.getOrderDateTime());
        dto.setStatus(order.getOrderStatus().toString());
        dto.setRelatedEntityId(order.getId());
        dto.setItemCount(order.getOrderItems() != null ? order.getOrderItems().size() : 0);
        dto.setDescription("Product Order #" + order.getId());

        if (order.getBuyerUser() != null) {
            dto.setBuyerId(order.getBuyerUser().getId());
            dto.setBuyerName(order.getBuyerUser().getName());
            dto.setBuyerEmail(order.getBuyerUser().getEmail());
        }

        return dto;
    }

    private EarningsTransactionDTO convertBookingToTransaction(ServiceBooking booking) {
        EarningsTransactionDTO dto = new EarningsTransactionDTO();
        dto.setId(booking.getId());
        dto.setTransactionType("SERVICE_BOOKING");
        dto.setAmount(booking.getQuotedPrice());
        dto.setPaymentMethod("N/A");
        dto.setTransactionDate(booking.getBookedAt());
        dto.setStatus(booking.getStatus().toString());
        dto.setRelatedEntityId(booking.getId());
        dto.setDescription(booking.getService() != null ? booking.getService().getName() : "Service Booking");

        Optional<User> customer = userRepository.findById(booking.getCustomerId());
        customer.ifPresent(user -> {
            dto.setBuyerId(user.getId());
            dto.setBuyerName(user.getName());
            dto.setBuyerEmail(user.getEmail());
        });

        Optional<User> provider = userRepository.findById(booking.getServiceProviderId());
        provider.ifPresent(user -> {
            dto.setSellerId(user.getId());
            dto.setSellerName(user.getName());
            dto.setSellerEmail(user.getEmail());
            dto.setSellerType("SERVICE_PROVIDER");
        });

        return dto;
    }

    private EarningsTransactionDTO convertDeliveryToTransaction(DeliveryQuote quote) {
        EarningsTransactionDTO dto = new EarningsTransactionDTO();
        dto.setId(quote.getId());
        dto.setTransactionType("DELIVERY_FEE");
        dto.setAmount(quote.getDeliveryFee());
        dto.setPaymentMethod("N/A");
        dto.setTransactionDate(quote.getCreatedAt());
        dto.setStatus(quote.getStatus().toString());
        dto.setRelatedEntityId(quote.getId());
        dto.setDescription("Delivery Service #" + quote.getId());

        if (quote.getDeliveryPerson() != null) {
            dto.setSellerId(quote.getDeliveryPerson().getId());
            dto.setSellerName(quote.getDeliveryPerson().getName());
            dto.setSellerEmail(quote.getDeliveryPerson().getEmail());
            dto.setSellerType("DELIVERY_PERSON");
        }

        return dto;
    }

    private BigDecimal calculateRevenueForPeriod(List<Order> orders, List<ServiceBooking> bookings, 
                                                   List<DeliveryQuote> quotes, LocalDateTime start, LocalDateTime end) {
        BigDecimal orderRevenue = orders.stream()
                .filter(o -> o.getOrderDateTime() != null && o.getOrderDateTime().isAfter(start) && o.getOrderDateTime().isBefore(end))
                .filter(o -> o.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bookingRevenue = bookings.stream()
                .filter(b -> b.getBookedAt().isAfter(start) && b.getBookedAt().isBefore(end))
                .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.COMPLETED)
                .map(ServiceBooking::getQuotedPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deliveryRevenue = quotes.stream()
                .filter(q -> q.getCreatedAt().isAfter(start) && q.getCreatedAt().isBefore(end))
                .map(DeliveryQuote::getDeliveryFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return orderRevenue.add(bookingRevenue).add(deliveryRevenue);
    }

    private Map<String, BigDecimal> calculateRevenueByPaymentMethod(List<Order> orders) {
        return orders.stream()
                .filter(o -> o.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .filter(o -> o.getPaymentMethod() != null)
                .collect(Collectors.groupingBy(
                        Order::getPaymentMethod,
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
    }

    private Map<String, Long> calculateTransactionsByStatus(List<Order> orders, List<ServiceBooking> bookings) {
        Map<String, Long> statusMap = new HashMap<>();
        orders.stream().collect(Collectors.groupingBy(o -> o.getOrderStatus().toString(), Collectors.counting()))
                .forEach(statusMap::put);
        bookings.stream().collect(Collectors.groupingBy(b -> b.getStatus().toString(), Collectors.counting()))
                .forEach((k, v) -> statusMap.merge(k, v, Long::sum));
        return statusMap;
    }

    private List<TopSellerDTO> calculateTopSellers(List<Order> orders, List<ServiceBooking> bookings, List<DeliveryQuote> quotes) {
        Map<Long, TopSellerDTO> sellerMap = new HashMap<>();

        for (ServiceBooking booking : bookings) {
            if (booking.getStatus() == ServiceBooking.BookingStatus.COMPLETED) {
                Optional<User> provider = userRepository.findById(booking.getServiceProviderId());
                provider.ifPresent(user -> {
                    TopSellerDTO seller = sellerMap.getOrDefault(user.getId(), new TopSellerDTO());
                    seller.setSellerId(user.getId());
                    seller.setSellerName(user.getName());
                    seller.setSellerEmail(user.getEmail());
                    seller.setSellerType("SERVICE_PROVIDER");
                    seller.setTotalRevenue((seller.getTotalRevenue() != null ? seller.getTotalRevenue() : BigDecimal.ZERO)
                            .add(booking.getQuotedPrice() != null ? booking.getQuotedPrice() : BigDecimal.ZERO));
                    seller.setTransactionCount((seller.getTransactionCount() != null ? seller.getTransactionCount() : 0L) + 1);
                    sellerMap.put(user.getId(), seller);
                });
            }
        }

        for (DeliveryQuote quote : quotes) {
            if (quote.getDeliveryPerson() != null) {
                User user = quote.getDeliveryPerson();
                TopSellerDTO seller = sellerMap.getOrDefault(user.getId(), new TopSellerDTO());
                seller.setSellerId(user.getId());
                seller.setSellerName(user.getName());
                seller.setSellerEmail(user.getEmail());
                seller.setSellerType("DELIVERY_PERSON");
                seller.setTotalRevenue((seller.getTotalRevenue() != null ? seller.getTotalRevenue() : BigDecimal.ZERO)
                        .add(quote.getDeliveryFee() != null ? quote.getDeliveryFee() : BigDecimal.ZERO));
                seller.setTransactionCount((seller.getTransactionCount() != null ? seller.getTransactionCount() : 0L) + 1);
                sellerMap.put(user.getId(), seller);
            }
        }

        return sellerMap.values().stream()
                .sorted((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private Map<String, BigDecimal> calculateMonthlyTrend(List<Order> orders, List<ServiceBooking> bookings, List<DeliveryQuote> quotes) {
        Map<String, BigDecimal> trend = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.atEndOfMonth().atTime(23, 59, 59);

            BigDecimal monthRevenue = calculateRevenueForPeriod(orders, bookings, quotes, start, end);
            trend.put(month.format(formatter), monthRevenue);
        }

        return trend;
    }
}
