package com.example.aqualink.controller;

import com.example.aqualink.entity.ServiceBooking;
import com.example.aqualink.service.ServiceBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class ServiceBookingController {

    @Autowired
    private ServiceBookingService bookingService;

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            String email = authentication.getName();
            Long serviceId = Long.valueOf(payload.get("serviceId").toString());
            
            ServiceBooking bookingRequest = new ServiceBooking();
            bookingRequest.setCustomerRequirements((String) payload.get("customerRequirements"));
            bookingRequest.setCustomerLocation((String) payload.get("customerLocation"));
            bookingRequest.setCustomerPhone((String) payload.get("customerPhone"));
            bookingRequest.setPreferredTime((String) payload.get("preferredTime"));
            
            String dateStr = (String) payload.get("preferredDate");
            if (dateStr != null && !dateStr.isEmpty()) {
                try {
                    // Handle ISO 8601 format from frontend (e.g., "2025-11-28T14:30:00.000Z")
                    // Parse as Instant and convert to LocalDateTime
                    java.time.Instant instant = java.time.Instant.parse(dateStr);
                    bookingRequest.setPreferredDate(java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault()));
                } catch (java.time.format.DateTimeParseException e1) {
                    // Fallback: try parsing as LocalDateTime without timezone
                    bookingRequest.setPreferredDate(java.time.LocalDateTime.parse(dateStr));
                }
            }

            ServiceBooking createdBooking = bookingService.createBooking(email, serviceId, bookingRequest);
            return ResponseEntity.ok(createdBooking);
        } catch (Exception e) {
            e.printStackTrace(); // Log the actual error for debugging
            return ResponseEntity.badRequest().body("Failed to create booking: " + e.getMessage());
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<Page<ServiceBooking>> getMyBookings(Authentication authentication, Pageable pageable) {
        String email = authentication.getName();
        return ResponseEntity.ok(bookingService.getCustomerBookings(email, pageable));
    }

    @GetMapping("/provider-bookings")
    public ResponseEntity<Page<ServiceBooking>> getProviderBookings(Authentication authentication, Pageable pageable) {
        String email = authentication.getName();
        return ResponseEntity.ok(bookingService.getProviderBookings(email, pageable));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            ServiceBooking.BookingStatus status = ServiceBooking.BookingStatus.valueOf(payload.get("status"));
            String notes = payload.get("notes");
            
            ServiceBooking updatedBooking = bookingService.updateBookingStatus(email, id, status, notes);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update status: " + e.getMessage());
        }
    }
}
