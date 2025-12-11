package com.example.aqualink.service;

import com.example.aqualink.dto.ReviewDetailDTO;
import com.example.aqualink.dto.ReviewFilterDTO;
import com.example.aqualink.dto.ReviewManagementDTO;
import com.example.aqualink.dto.ReviewStatisticsDTO;
import com.example.aqualink.entity.ProductReview;
import com.example.aqualink.entity.ServiceReview;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.ProductReviewRepository;
import com.example.aqualink.repository.ServiceReviewRepository;
import com.example.aqualink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewManagementService {

    private final ProductReviewRepository productReviewRepository;
    private final ServiceReviewRepository serviceReviewRepository;
    private final UserRepository userRepository;

    /**
     * Get all reviews with filtering and pagination
     */
    public Page<ReviewManagementDTO> getAllReviews(ReviewFilterDTO filter, Pageable pageable) {
        log.info("Fetching reviews with filter: {}", filter);

        List<ReviewManagementDTO> allReviews = new ArrayList<>();

        // Determine which review types to fetch
        boolean fetchProduct = filter.getReviewType() == null || 
                              filter.getReviewType().equals("ALL") || 
                              filter.getReviewType().equals("PRODUCT");
        boolean fetchService = filter.getReviewType() == null || 
                              filter.getReviewType().equals("ALL") || 
                              filter.getReviewType().equals("SERVICE");

        // Fetch product reviews
        if (fetchProduct) {
            List<ProductReview> productReviews;
            if (filter.getSearchTerm() != null && !filter.getSearchTerm().isEmpty()) {
                productReviews = productReviewRepository.searchReviews(filter.getSearchTerm(), Pageable.unpaged()).getContent();
            } else if (filter.getProductType() != null) {
                productReviews = productReviewRepository.findByProductType(filter.getProductType(), Pageable.unpaged()).getContent();
            } else {
                productReviews = productReviewRepository.findAllWithPagination(Pageable.unpaged()).getContent();
            }

            // Apply filters
            Stream<ProductReview> stream = productReviews.stream();
            
            if (filter.getMinRating() != null) {
                stream = stream.filter(r -> r.getRating() >= filter.getMinRating());
            }
            if (filter.getMaxRating() != null) {
                stream = stream.filter(r -> r.getRating() <= filter.getMaxRating());
            }
            if (filter.getVerifiedPurchaseOnly() != null && filter.getVerifiedPurchaseOnly()) {
                stream = stream.filter(r -> Boolean.TRUE.equals(r.getVerifiedPurchase()));
            }
            if (filter.getStartDate() != null) {
                stream = stream.filter(r -> r.getReviewedAt().isAfter(filter.getStartDate()));
            }
            if (filter.getEndDate() != null) {
                stream = stream.filter(r -> r.getReviewedAt().isBefore(filter.getEndDate()));
            }

            allReviews.addAll(stream.map(this::convertProductReviewToDTO).collect(Collectors.toList()));
        }

        // Fetch service reviews
        if (fetchService) {
            List<ServiceReview> serviceReviews;
            if (filter.getSearchTerm() != null && !filter.getSearchTerm().isEmpty()) {
                serviceReviews = serviceReviewRepository.searchReviews(filter.getSearchTerm(), Pageable.unpaged()).getContent();
            } else if (filter.getServiceProviderId() != null) {
                serviceReviews = serviceReviewRepository.findByServiceProviderIdWithPagination(filter.getServiceProviderId(), Pageable.unpaged()).getContent();
            } else {
                serviceReviews = serviceReviewRepository.findAllWithPagination(Pageable.unpaged()).getContent();
            }

            // Apply filters
            Stream<ServiceReview> stream = serviceReviews.stream();
            
            if (filter.getMinRating() != null) {
                stream = stream.filter(r -> r.getRating() >= filter.getMinRating());
            }
            if (filter.getMaxRating() != null) {
                stream = stream.filter(r -> r.getRating() <= filter.getMaxRating());
            }
            if (filter.getStartDate() != null) {
                stream = stream.filter(r -> r.getReviewedAt().isAfter(filter.getStartDate()));
            }
            if (filter.getEndDate() != null) {
                stream = stream.filter(r -> r.getReviewedAt().isBefore(filter.getEndDate()));
            }

            allReviews.addAll(stream.map(this::convertServiceReviewToDTO).collect(Collectors.toList()));
        }

        // Sort by date (newest first)
        allReviews.sort((a, b) -> b.getReviewedAt().compareTo(a.getReviewedAt()));

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allReviews.size());
        List<ReviewManagementDTO> pageContent = allReviews.subList(start, Math.min(end, allReviews.size()));

        return new PageImpl<>(pageContent, pageable, allReviews.size());
    }

    /**
     * Get review details by ID and type
     */
    public ReviewDetailDTO getReviewDetail(Long id, String reviewType) {
        log.info("Fetching review detail for ID: {}, type: {}", id, reviewType);

        if ("PRODUCT".equals(reviewType)) {
            ProductReview review = productReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product review not found with ID: " + id));
            return convertProductReviewToDetailDTO(review);
        } else if ("SERVICE".equals(reviewType)) {
            ServiceReview review = serviceReviewRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Service review not found with ID: " + id));
            return convertServiceReviewToDetailDTO(review);
        } else {
            throw new IllegalArgumentException("Invalid review type: " + reviewType);
        }
    }

    /**
     * Delete a review
     */
    public void deleteReview(Long id, String reviewType) {
        log.info("Deleting review ID: {}, type: {}", id, reviewType);

        if ("PRODUCT".equals(reviewType)) {
            if (!productReviewRepository.existsById(id)) {
                throw new RuntimeException("Product review not found with ID: " + id);
            }
            productReviewRepository.deleteById(id);
        } else if ("SERVICE".equals(reviewType)) {
            if (!serviceReviewRepository.existsById(id)) {
                throw new RuntimeException("Service review not found with ID: " + id);
            }
            serviceReviewRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Invalid review type: " + reviewType);
        }

        log.info("Review deleted successfully");
    }

    /**
     * Bulk delete reviews
     */
    public void bulkDeleteReviews(List<Long> productReviewIds, List<Long> serviceReviewIds) {
        log.info("Bulk deleting {} product reviews and {} service reviews", 
                 productReviewIds != null ? productReviewIds.size() : 0,
                 serviceReviewIds != null ? serviceReviewIds.size() : 0);

        if (productReviewIds != null && !productReviewIds.isEmpty()) {
            productReviewRepository.deleteAllById(productReviewIds);
        }

        if (serviceReviewIds != null && !serviceReviewIds.isEmpty()) {
            serviceReviewRepository.deleteAllById(serviceReviewIds);
        }

        log.info("Bulk delete completed");
    }

    /**
     * Get review statistics
     */
    public ReviewStatisticsDTO getReviewStatistics() {
        log.info("Fetching review statistics");

        ReviewStatisticsDTO stats = new ReviewStatisticsDTO();

        // Count statistics
        Long productCount = productReviewRepository.getTotalCount();
        Long serviceCount = serviceReviewRepository.getTotalCount();
        stats.setProductReviewsCount(productCount);
        stats.setServiceReviewsCount(serviceCount);
        stats.setTotalReviews(productCount + serviceCount);

        // Average ratings
        Double productAvg = productReviewRepository.getOverallAverageRating();
        Double serviceAvg = serviceReviewRepository.getOverallAverageRating();
        stats.setProductAverageRating(productAvg != null ? Math.round(productAvg * 10.0) / 10.0 : 0.0);
        stats.setServiceAverageRating(serviceAvg != null ? Math.round(serviceAvg * 10.0) / 10.0 : 0.0);
        
        if (productAvg != null && serviceAvg != null) {
            stats.setAverageRating(Math.round(((productAvg + serviceAvg) / 2) * 10.0) / 10.0);
        } else if (productAvg != null) {
            stats.setAverageRating(Math.round(productAvg * 10.0) / 10.0);
        } else if (serviceAvg != null) {
            stats.setAverageRating(Math.round(serviceAvg * 10.0) / 10.0);
        } else {
            stats.setAverageRating(0.0);
        }

        // Verified purchase count
        stats.setVerifiedPurchaseReviewsCount(productReviewRepository.countVerifiedPurchaseReviews());

        // Rating distribution (combined)
        Map<Integer, Long> ratingDist = new HashMap<>();
        List<Object[]> productDist = productReviewRepository.getOverallRatingDistribution();
        List<Object[]> serviceDist = serviceReviewRepository.getOverallRatingDistribution();

        for (Object[] row : productDist) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingDist.put(rating, ratingDist.getOrDefault(rating, 0L) + count);
        }

        for (Object[] row : serviceDist) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingDist.put(rating, ratingDist.getOrDefault(rating, 0L) + count);
        }

        stats.setRatingDistribution(ratingDist);

        // Time-based statistics
        Long productThisMonth = productReviewRepository.countReviewsThisMonth();
        Long serviceThisMonth = serviceReviewRepository.countReviewsThisMonth();
        stats.setReviewsThisMonth(productThisMonth + serviceThisMonth);

        Long productThisWeek = productReviewRepository.countReviewsThisWeek();
        Long serviceThisWeek = serviceReviewRepository.countReviewsThisWeek();
        stats.setReviewsThisWeek(productThisWeek + serviceThisWeek);

        return stats;
    }

    // Conversion methods
    private ReviewManagementDTO convertProductReviewToDTO(ProductReview review) {
        ReviewManagementDTO dto = new ReviewManagementDTO();
        dto.setId(review.getId());
        dto.setReviewType("PRODUCT");
        dto.setReviewerName(review.getUser().getName());
        dto.setReviewerEmail(review.getUser().getEmail());
        dto.setReviewerPhone(review.getUser().getPhoneNumber());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setVerifiedPurchase(review.getVerifiedPurchase());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setProductId(review.getProductId());
        dto.setProductType(review.getProductType());
        dto.setOrderId(review.getOrder() != null ? review.getOrder().getId() : null);
        return dto;
    }

    private ReviewManagementDTO convertServiceReviewToDTO(ServiceReview review) {
        ReviewManagementDTO dto = new ReviewManagementDTO();
        dto.setId(review.getId());
        dto.setReviewType("SERVICE");
        
        // Get customer details
        Optional<User> customer = userRepository.findById(review.getCustomerId());
        customer.ifPresent(user -> {
            dto.setReviewerName(user.getName());
            dto.setReviewerEmail(user.getEmail());
            dto.setReviewerPhone(user.getPhoneNumber());
        });
        
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setServiceId(review.getService().getId());
        dto.setServiceName(review.getService().getName());
        dto.setBookingId(review.getBooking() != null ? review.getBooking().getId() : null);
        dto.setServiceProviderId(review.getService().getServiceProviderId());
        
        // Get service provider name
        Optional<User> provider = userRepository.findById(review.getService().getServiceProviderId());
        provider.ifPresent(user -> dto.setServiceProviderName(user.getName()));
        
        return dto;
    }

    private ReviewDetailDTO convertProductReviewToDetailDTO(ProductReview review) {
        ReviewDetailDTO dto = new ReviewDetailDTO();
        dto.setId(review.getId());
        dto.setReviewType("PRODUCT");
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setReviewedAt(review.getReviewedAt());
        
        // Reviewer information
        User user = review.getUser();
        dto.setReviewerId(user.getId());
        dto.setReviewerName(user.getName());
        dto.setReviewerEmail(user.getEmail());
        dto.setReviewerPhone(user.getPhoneNumber());
        if (user.getUserProfile() != null) {
            dto.setReviewerDistrict(user.getUserProfile().getAddressDistrict());
            dto.setReviewerTown(user.getUserProfile().getAddressTown());
        }
        
        // Product review specific
        dto.setProductId(review.getProductId());
        dto.setProductType(review.getProductType());
        dto.setVerifiedPurchase(review.getVerifiedPurchase());
        
        if (review.getOrder() != null) {
            dto.setOrderId(review.getOrder().getId());
            dto.setOrderStatus(review.getOrder().getOrderStatus().toString());
            dto.setOrderDate(review.getOrder().getOrderDateTime());
        }
        
        return dto;
    }

    private ReviewDetailDTO convertServiceReviewToDetailDTO(ServiceReview review) {
        ReviewDetailDTO dto = new ReviewDetailDTO();
        dto.setId(review.getId());
        dto.setReviewType("SERVICE");
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setReviewedAt(review.getReviewedAt());
        
        // Reviewer information
        Optional<User> customerOpt = userRepository.findById(review.getCustomerId());
        customerOpt.ifPresent(customer -> {
            dto.setReviewerId(customer.getId());
            dto.setReviewerName(customer.getName());
            dto.setReviewerEmail(customer.getEmail());
            dto.setReviewerPhone(customer.getPhoneNumber());
            if (customer.getUserProfile() != null) {
                dto.setReviewerDistrict(customer.getUserProfile().getAddressDistrict());
                dto.setReviewerTown(customer.getUserProfile().getAddressTown());
            }
        });
        
        // Service review specific
        dto.setServiceId(review.getService().getId());
        dto.setServiceName(review.getService().getName());
        dto.setServiceCategory(review.getService().getCategory());
        
        if (review.getBooking() != null) {
            dto.setBookingId(review.getBooking().getId());
            dto.setBookingStatus(review.getBooking().getStatus().toString());
            dto.setBookingDate(review.getBooking().getPreferredDate());
        }
        
        dto.setServiceProviderId(review.getService().getServiceProviderId());
        Optional<User> providerOpt = userRepository.findById(review.getService().getServiceProviderId());
        providerOpt.ifPresent(provider -> {
            dto.setServiceProviderName(provider.getName());
            dto.setServiceProviderEmail(provider.getEmail());
        });
        
        return dto;
    }
}
