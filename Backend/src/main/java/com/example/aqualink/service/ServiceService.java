package com.example.aqualink.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.aqualink.dto.BookingUpdateRequestDTO;
import com.example.aqualink.dto.ServiceBookingRequestDTO;
import com.example.aqualink.dto.ServiceRequestDTO;
import com.example.aqualink.dto.ServiceReviewRequestDTO;
import com.example.aqualink.dto.ServiceProviderStatsDTO;
import com.example.aqualink.entity.ServiceBooking;
import com.example.aqualink.entity.ServiceReview;
import com.example.aqualink.repository.ServiceBookingRepository;
import com.example.aqualink.repository.ServiceRepository;
import com.example.aqualink.repository.ServiceReviewRepository;
import com.example.aqualink.repository.UserProfileRepository;
import com.example.aqualink.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final ServiceBookingRepository bookingRepository;
    private final ServiceReviewRepository reviewRepository;
    private final FileUploadService fileUploadService;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    // Public Methods (for customers)
    public Page<com.example.aqualink.entity.Service> getAllApprovedServices(Pageable pageable) {
        Page<com.example.aqualink.entity.Service> services = serviceRepository.findByApprovalStatusAndAvailable(
                com.example.aqualink.entity.Service.ApprovalStatus.APPROVED, true, pageable);
        populateDistricts(services.getContent());
        populateRatings(services.getContent());
        return services;
    }

    public Page<com.example.aqualink.entity.Service> searchApprovedServices(String search, Pageable pageable) {
        Page<com.example.aqualink.entity.Service> services = serviceRepository.searchApprovedServices(search, pageable);
        populateDistricts(services.getContent());
        populateRatings(services.getContent());
        return services;
    }

    public com.example.aqualink.entity.Service getApprovedServiceById(Long id) {
        com.example.aqualink.entity.Service service = serviceRepository.findById(id)
                .filter(s -> s.getApprovalStatus() ==
                        com.example.aqualink.entity.Service.ApprovalStatus.APPROVED && s.getAvailable())
                .orElseThrow(() -> new RuntimeException("Service not found or not available"));

        // Populate district and rating for single service
        List<com.example.aqualink.entity.Service> services = List.of(service);
        populateDistricts(services);
        populateRatings(services);

        return service;
    }

    public Page<com.example.aqualink.entity.Service> getServicesByCategory(String category, Pageable pageable) {
        Page<com.example.aqualink.entity.Service> services = serviceRepository.findByApprovalStatusAndCategoryAndAvailable(
                com.example.aqualink.entity.Service.ApprovalStatus.APPROVED, category, true, pageable);
        populateDistricts(services.getContent());
        populateRatings(services.getContent());
        return services;
    }

    // Service Provider Methods
    public com.example.aqualink.entity.Service createService(ServiceRequestDTO request, MultipartFile[] images, Long serviceProviderId) {
        com.example.aqualink.entity.Service service = new com.example.aqualink.entity.Service();
        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setCategory(request.getCategory());
        service.setPrice(request.getPrice());
        service.setMaxPrice(request.getMaxPrice());
        service.setDuration(request.getDuration());
        service.setRequirements(request.getRequirements());
        service.setServiceProviderId(serviceProviderId);
        service.setApprovalStatus(com.example.aqualink.entity.Service.ApprovalStatus.PENDING);

        if (images != null && images.length > 0) {
            try {
                // Save images and set all image paths
                List<String> imagePaths = fileUploadService.saveImages(images, serviceProviderId);
                service.setImagePaths(imagePaths);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save service images: " + e.getMessage());
            }
        }

        return serviceRepository.save(service);
    }

    public com.example.aqualink.entity.Service updateService(Long id, ServiceRequestDTO request, Long serviceProviderId) {
        com.example.aqualink.entity.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (!service.getServiceProviderId().equals(serviceProviderId)) {
            throw new RuntimeException("Unauthorized to update this service");
        }

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setCategory(request.getCategory());
        service.setPrice(request.getPrice());
        service.setMaxPrice(request.getMaxPrice());
        service.setDuration(request.getDuration());
        service.setRequirements(request.getRequirements());

        // Reset approval if service was modified
        if (service.getApprovalStatus() == com.example.aqualink.entity.Service.ApprovalStatus.APPROVED) {
            service.setApprovalStatus(com.example.aqualink.entity.Service.ApprovalStatus.PENDING);
            service.setApprovedAt(null);
            service.setApprovedBy(null);
        }

        return serviceRepository.save(service);
    }

    public Page<com.example.aqualink.entity.Service> getServiceProviderServices(Long serviceProviderId, Pageable pageable) {
        return serviceRepository.findByServiceProviderIdOrderByCreatedAtDesc(serviceProviderId, pageable);
    }

    // Booking Methods
    public ServiceBooking bookService(ServiceBookingRequestDTO request, Long customerId) {
        com.example.aqualink.entity.Service service = getApprovedServiceById(request.getServiceId());

        ServiceBooking booking = new ServiceBooking();
        booking.setService(service);
        booking.setCustomerId(customerId);
        booking.setServiceProviderId(service.getServiceProviderId());
        booking.setCustomerRequirements(request.getCustomerRequirements());
        booking.setPreferredDate(LocalDateTime.parse(request.getPreferredDate(), DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        booking.setPreferredTime(request.getPreferredTime());
        booking.setCustomerLocation(request.getCustomerLocation());
        booking.setCustomerPhone(request.getCustomerPhone());

        return bookingRepository.save(booking);
    }

    public ServiceBooking updateBookingStatus(Long bookingId, BookingUpdateRequestDTO request, Long serviceProviderId) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getServiceProviderId().equals(serviceProviderId)) {
            throw new RuntimeException("Unauthorized to update this booking");
        }

        booking.setStatus(ServiceBooking.BookingStatus.valueOf(request.getStatus()));
        booking.setQuotedPrice(request.getQuotedPrice());
        booking.setProviderNotes(request.getProviderNotes());

        if (request.getStatus().equals("CONFIRMED")) {
            booking.setConfirmedAt(LocalDateTime.now());
        } else if (request.getStatus().equals("COMPLETED")) {
            booking.setCompletedAt(LocalDateTime.now());
        }

        return bookingRepository.save(booking);
    }

    public Page<ServiceBooking> getCustomerBookings(Long customerId, Pageable pageable) {
        Page<ServiceBooking> bookings = bookingRepository.findByCustomerIdOrderByBookedAtDesc(customerId, pageable);
        
        // Populate seller/provider names and review status for shop owner's view
        for (ServiceBooking booking : bookings.getContent()) {
            userRepository.findById(booking.getServiceProviderId()).ifPresent(provider -> {
                booking.setSellerName(provider.getName());
            });
            userRepository.findById(booking.getCustomerId()).ifPresent(customer -> {
                booking.setCustomerName(customer.getName());
            });
            // Check if this booking has been reviewed
            booking.setHasReview(reviewRepository.existsByBookingId(booking.getId()));
        }
        
        return bookings;
    }

    public Page<ServiceBooking> getServiceProviderBookings(Long serviceProviderId, Pageable pageable) {
        Page<ServiceBooking> bookings = bookingRepository.findByServiceProviderIdOrderByBookedAtDesc(serviceProviderId, pageable);
        
        // Populate customer names and review status
        for (ServiceBooking booking : bookings.getContent()) {
            userRepository.findById(booking.getCustomerId()).ifPresent(customer -> {
                booking.setCustomerName(customer.getName());
            });
            userRepository.findById(booking.getServiceProviderId()).ifPresent(provider -> {
                booking.setSellerName(provider.getName());
            });
            // Check if this booking has been reviewed
            booking.setHasReview(reviewRepository.existsByBookingId(booking.getId()));
        }
        
        return bookings;
    }

    // Review Methods
    public ServiceReview addReview(ServiceReviewRequestDTO request, Long customerId) {
        ServiceBooking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to review this booking");
        }

        if (booking.getStatus() != ServiceBooking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Can only review completed services");
        }

        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new RuntimeException("Service already reviewed");
        }

        ServiceReview review = new ServiceReview();
        review.setService(booking.getService());
        review.setBooking(booking);
        review.setCustomerId(customerId);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        ServiceReview savedReview = reviewRepository.save(review);

        // Update service rating
        updateServiceRating(booking.getService().getId());

        return savedReview;
    }

    private void updateServiceRating(Long serviceId) {
        Double avgRating = reviewRepository.getAverageRating(serviceId);
        Long reviewCount = reviewRepository.countByServiceId(serviceId);

        com.example.aqualink.entity.Service service = serviceRepository.findById(serviceId).orElse(null);
        if (service != null) {
            service.setReviewRate(avgRating != null ? avgRating : 0.0);
            service.setReviewCount(reviewCount.intValue());
            serviceRepository.save(service);
        }
    }

    public Page<ServiceReview> getServiceReviews(Long serviceId, Pageable pageable) {
        Page<ServiceReview> reviews = reviewRepository.findByServiceIdOrderByReviewedAtDesc(serviceId, pageable);
        
        // Populate customer names
        for (ServiceReview review : reviews.getContent()) {
            userRepository.findById(review.getCustomerId()).ifPresent(customer -> {
                review.setCustomerName(customer.getName());
            });
        }
        
        return reviews;
    }

    public Map<String, Object> getServiceReviewsSummary(Long serviceId) {
        Map<String, Object> summary = new java.util.HashMap<>();
        
        // Get average rating
        Double averageRating = reviewRepository.getAverageRating(serviceId);
        summary.put("averageRating", averageRating != null ? averageRating : 0.0);
        
        // Get total reviews
        Long totalReviews = reviewRepository.countByServiceId(serviceId);
        summary.put("totalReviews", totalReviews != null ? totalReviews : 0L);
        
        return summary;
    }

    // Admin Methods
    public Page<com.example.aqualink.entity.Service> getPendingApprovals(Pageable pageable) {
        return serviceRepository.findByApprovalStatusOrderByCreatedAtAsc(
                com.example.aqualink.entity.Service.ApprovalStatus.PENDING, pageable);
    }

    public com.example.aqualink.entity.Service approveService(Long id, Long adminId) {
        com.example.aqualink.entity.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        service.setApprovalStatus(com.example.aqualink.entity.Service.ApprovalStatus.APPROVED);
        service.setApprovedAt(LocalDateTime.now());
        service.setApprovedBy(adminId);
        service.setRejectionReason(null);

        return serviceRepository.save(service);
    }

    public com.example.aqualink.entity.Service rejectService(Long id, String reason, Long adminId) {
        com.example.aqualink.entity.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        service.setApprovalStatus(com.example.aqualink.entity.Service.ApprovalStatus.REJECTED);
        service.setRejectionReason(reason);
        service.setApprovedBy(adminId);

        return serviceRepository.save(service);
    }

    private void populateDistricts(List<com.example.aqualink.entity.Service> services) {
        if (services.isEmpty()) return;

        List<Long> providerIds = services.stream()
                .map(com.example.aqualink.entity.Service::getServiceProviderId)
                .distinct()
                .toList();

        List<com.example.aqualink.entity.UserProfile> profiles = userProfileRepository.findByUserIds(providerIds);

        Map<Long, com.example.aqualink.entity.UserProfile> profileMap = profiles.stream()
                .collect(java.util.stream.Collectors.toMap(
                        profile -> profile.getUser().getId(),
                        profile -> profile
                ));

        for (com.example.aqualink.entity.Service service : services) {
            com.example.aqualink.entity.UserProfile profile = profileMap.get(service.getServiceProviderId());
            if (profile != null) {
                service.setDistrict(profile.getAddressDistrict());
                if (profile.getUser() != null) {
                    service.setProviderName(profile.getUser().getName());
                }
            }
        }
    }

    private void populateRatings(List<com.example.aqualink.entity.Service> services) {
        for (com.example.aqualink.entity.Service service : services) {
            // Calculate average rating
            Double averageRating = reviewRepository.getAverageRating(service.getId());
            service.setAverageRating(averageRating != null ? averageRating : 0.0);
            
            // Get total review count
            Long reviewCount = reviewRepository.countByServiceId(service.getId());
            service.setTotalReviews(reviewCount != null ? reviewCount : 0L);
        }
    }

    // Statistics for Service Provider Dashboard
    public ServiceProviderStatsDTO getProviderStatistics(Long serviceProviderId) {
        ServiceProviderStatsDTO stats = new ServiceProviderStatsDTO();
        
        // Get all bookings for this provider
        List<ServiceBooking> allBookings = bookingRepository.findByServiceProviderIdOrderByBookedAtDesc(
            serviceProviderId, Pageable.unpaged()).getContent();
        
        // Count bookings by status
        stats.setTotalBookings((long) allBookings.size());
        stats.setPendingBookings(allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.PENDING)
            .count());
        stats.setConfirmedBookings(allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.CONFIRMED)
            .count());
        stats.setCompletedBookings(allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.COMPLETED)
            .count());
        stats.setCancelledBookings(allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.CANCELLED)
            .count());
        
        // Calculate revenue from completed bookings
        BigDecimal totalRevenue = allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.COMPLETED)
            .map(ServiceBooking::getQuotedPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalRevenue(totalRevenue);
        
        // Calculate monthly revenue (current month)
        YearMonth currentMonth = YearMonth.now();
        BigDecimal monthlyRevenue = allBookings.stream()
            .filter(b -> b.getStatus() == ServiceBooking.BookingStatus.COMPLETED)
            .filter(b -> {
                if (b.getCompletedAt() == null) return false;
                YearMonth bookingMonth = YearMonth.from(b.getCompletedAt());
                return bookingMonth.equals(currentMonth);
            })
            .map(ServiceBooking::getQuotedPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setMonthlyRevenue(monthlyRevenue);
        
        // Calculate average booking value
        long completedCount = stats.getCompletedBookings();
        if (completedCount > 0) {
            BigDecimal avgValue = totalRevenue.divide(
                BigDecimal.valueOf(completedCount), 2, BigDecimal.ROUND_HALF_UP);
            stats.setAverageBookingValue(avgValue);
        } else {
            stats.setAverageBookingValue(BigDecimal.ZERO);
        }
        
        // Count active services
        long activeServices = serviceRepository.countByServiceProviderIdAndAvailable(serviceProviderId, true);
        stats.setActiveServices(activeServices);
        
        // Get average rating from reviews
        List<ServiceReview> allReviews = reviewRepository.findByServiceServiceProviderId(serviceProviderId);
        stats.setTotalReviews((long) allReviews.size());
        
        if (!allReviews.isEmpty()) {
            double avgRating = allReviews.stream()
                .mapToInt(ServiceReview::getRating)
                .average()
                .orElse(0.0);
            stats.setAverageRating(avgRating);
        } else {
            stats.setAverageRating(0.0);
        }
        
        return stats;
    }
}
