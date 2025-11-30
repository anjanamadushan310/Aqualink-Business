package com.example.aqualink.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.aqualink.dto.BookingUpdateRequestDTO;
import com.example.aqualink.dto.ServiceRequestDTO;
import com.example.aqualink.dto.ServiceProviderStatsDTO;
import com.example.aqualink.entity.Service;
import com.example.aqualink.entity.ServiceBooking;
import com.example.aqualink.security.util.JwtUtil;
import com.example.aqualink.service.ServiceService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/service-provider/services")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SERVICE_PROVIDER')")
public class ServiceProviderController {

    private final ServiceService serviceService;
    private final JwtUtil jwtUtils;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Service> createService(
            @RequestPart("serviceData") String serviceDataJson,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            HttpServletRequest httpRequest) {

        try {
            ServiceRequestDTO request = objectMapper.readValue(serviceDataJson, ServiceRequestDTO.class);
            Long serviceProviderId = getCurrentUserId(httpRequest);
            Service service = serviceService.createService(request, images, serviceProviderId);
            return ResponseEntity.ok(service);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse service data: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<Service>> getMyServices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {

        Long serviceProviderId = getCurrentUserId(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<Service> services = serviceService.getServiceProviderServices(serviceProviderId, pageable);
        return ResponseEntity.ok(services);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Service> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestDTO request,
            HttpServletRequest httpRequest) {

        Long serviceProviderId = getCurrentUserId(httpRequest);
        Service service = serviceService.updateService(id, request, serviceProviderId);
        return ResponseEntity.ok(service);
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<ServiceBooking>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {

        Long serviceProviderId = getCurrentUserId(httpRequest);
        Pageable pageable = PageRequest.of(page, size);
        Page<ServiceBooking> bookings = serviceService.getServiceProviderBookings(serviceProviderId, pageable);
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<ServiceBooking> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingUpdateRequestDTO request,
            HttpServletRequest httpRequest) {

        Long serviceProviderId = getCurrentUserId(httpRequest);
        ServiceBooking booking = serviceService.updateBookingStatus(id, request, serviceProviderId);
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/stats")
    public ResponseEntity<ServiceProviderStatsDTO> getProviderStats(HttpServletRequest httpRequest) {
        Long serviceProviderId = getCurrentUserId(httpRequest);
        ServiceProviderStatsDTO stats = serviceService.getProviderStatistics(serviceProviderId);
        return ResponseEntity.ok(stats);
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String token = jwtUtils.getJwtFromRequest(request);
        return jwtUtils.getUserIdFromToken(token);
    }
}
