package com.example.aqualink.service;

import com.example.aqualink.entity.ServiceBooking;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.ServiceBookingRepository;
import com.example.aqualink.repository.ServiceRepository;
import com.example.aqualink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class ServiceBookingService {

    @Autowired
    private ServiceBookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private UserRepository userRepository;

    public ServiceBooking createBooking(String userEmail, Long serviceId, ServiceBooking bookingRequest) {
        User customer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.example.aqualink.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        bookingRequest.setService(service);
        bookingRequest.setCustomerId(customer.getId());
        bookingRequest.setServiceProviderId(service.getServiceProviderId());
        bookingRequest.setQuotedPrice(service.getPrice()); // Initial price is base price
        bookingRequest.setStatus(ServiceBooking.BookingStatus.PENDING);
        bookingRequest.setBookedAt(LocalDateTime.now());

        return bookingRepository.save(bookingRequest);
    }

    public Page<ServiceBooking> getCustomerBookings(String userEmail, Pageable pageable) {
        User customer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByCustomerIdOrderByBookedAtDesc(customer.getId(), pageable);
    }

    public Page<ServiceBooking> getProviderBookings(String userEmail, Pageable pageable) {
        User provider = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByServiceProviderIdOrderByBookedAtDesc(provider.getId(), pageable);
    }

    public ServiceBooking updateBookingStatus(String userEmail, Long bookingId, ServiceBooking.BookingStatus status, String notes) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Verify user is the provider or customer (depending on status change rules)
        // For simplicity, assuming only provider can confirm/complete/cancel for now, 
        // or customer can cancel.
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isProvider = booking.getServiceProviderId().equals(user.getId());
        boolean isCustomer = booking.getCustomerId().equals(user.getId());

        if (!isProvider && !isCustomer) {
            throw new RuntimeException("Unauthorized to update this booking");
        }

        if (status == ServiceBooking.BookingStatus.CANCELLED) {
            // Both can cancel
        } else if (isProvider) {
            // Provider can confirm, complete, etc.
        } else {
            throw new RuntimeException("Customer can only cancel bookings");
        }

        booking.setStatus(status);
        if (notes != null) {
            booking.setProviderNotes(notes);
        }
        
        if (status == ServiceBooking.BookingStatus.CONFIRMED) {
            booking.setConfirmedAt(LocalDateTime.now());
        } else if (status == ServiceBooking.BookingStatus.COMPLETED) {
            booking.setCompletedAt(LocalDateTime.now());
        }

        return bookingRepository.save(booking);
    }
    
    public ServiceBooking getBookingById(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new RuntimeException("Booking not found"));
    }
}
