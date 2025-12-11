package com.example.aqualink.controller;

import com.example.aqualink.dto.ContactFormDTO;
import com.example.aqualink.service.ContactEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactEmailService contactEmailService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitContactForm(@RequestBody ContactFormDTO contactForm) {
        try {
            // Validate required fields
            if (contactForm.getName() == null || contactForm.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Name is required"));
            }
            if (contactForm.getEmail() == null || contactForm.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            }
            if (contactForm.getSubject() == null || contactForm.getSubject().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Subject is required"));
            }
            if (contactForm.getMessage() == null || contactForm.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Message is required"));
            }

            // Send email
            contactEmailService.sendContactFormEmail(contactForm);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Your message has been sent successfully. We'll get back to you within 24 hours.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Failed to send message: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
}
