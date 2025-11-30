package com.example.aqualink.security.controller;

import com.example.aqualink.entity.Role;
import com.example.aqualink.security.service.OTPService;
import com.example.aqualink.security.service.AuthService;
import com.example.aqualink.security.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class RegisterController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OTPService otpService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, String>>> getUserRoles() {
        List<Map<String, String>> roles = Arrays.stream(Role.values())
                .map(role -> {
                    Map<String, String> roleMap = new HashMap<>();
                    roleMap.put("value", role.name());
                    roleMap.put("label", role.getDisplayName());
                    return roleMap;
                })
                .toList();

        return ResponseEntity.ok(roles);
    }

    @GetMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtpToEmail(@RequestParam("email") String email) {
        Map<String, String> response = new HashMap<>();

        try {
            if (email == null || email.trim().isEmpty() || !email.contains("@")) {
                response.put("message", "Invalid email address");
                return ResponseEntity.badRequest().body(response);
            }

            String otp = otpService.generateOTP(email);
            otpService.sendOTPEmail(email, otp);
            response.put("message", "OTP sent successfully to " + email);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("message", "Failed to send OTP");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @RequestParam("email") String email,
            @RequestParam("otp") String otp) {
        Map<String, String> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("message", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (otp == null || otp.trim().isEmpty()) {
            response.put("message", "OTP is required");
            return ResponseEntity.badRequest().body(response);
        }

        boolean isValid = otpService.verifyOTP(email, otp);

        if (isValid) {
            response.put("message", "OTP verified successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Invalid or expired OTP");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(
            @RequestParam("nicNumber") String nicNumber,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("password") String password,
            @RequestParam("confirmPassword") String confirmPassword,
            @RequestParam(value = "nicFrontDocument", required = false) MultipartFile nicFrontDocument,
            @RequestParam(value = "nicBackDocument", required = false) MultipartFile nicBackDocument,
            @RequestParam(value = "selfieDocument", required = false) MultipartFile selfieDocument,
            @RequestParam("userRoles") List<String> userRoles,
            @RequestParam("otpVerified") boolean otpVerified) {

        Map<String, String> response = new HashMap<>();

        if (!otpVerified) {
            response.put("message", "Registration failed");
            response.put("error", "Please verify your email with OTP first");
            return ResponseEntity.badRequest().body(response);
        }

        if (nicNumber == null || nicNumber.trim().isEmpty()) {
            response.put("message", "Registration failed");
            response.put("error", "NIC number is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (name == null || name.trim().isEmpty()) {
            response.put("message", "Registration failed");
            response.put("error", "Name is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (email == null || email.trim().isEmpty()) {
            response.put("message", "Registration failed");
            response.put("error", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (userRoles == null || userRoles.isEmpty()) {
            response.put("message", "Registration failed");
            response.put("error", "Please select at least one role");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate at least one document is uploaded
        if ((nicFrontDocument == null || nicFrontDocument.isEmpty()) &&
                (nicBackDocument == null || nicBackDocument.isEmpty()) &&
                (selfieDocument == null || selfieDocument.isEmpty())) {
            response.put("message", "Registration failed");
            response.put("error", "At least one document (NIC Front, NIC Back, or Selfie) is required");
            return ResponseEntity.badRequest().body(response);
        }

        String result = authService.registerUser(nicNumber, name, email, phoneNumber,
                password, confirmPassword, nicFrontDocument, nicBackDocument, selfieDocument, userRoles);

        if (result.equals("User registered successfully")) {
            response.put("message", result);
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Registration failed");
            response.put("error", result);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/add-role")
    public ResponseEntity<Map<String, String>> addRoleToUser(
            HttpServletRequest request,
            @RequestParam("role") String roleString,
            @RequestParam(value = "nicFrontDocument", required = false) MultipartFile nicFrontDocument,
            @RequestParam(value = "nicBackDocument", required = false) MultipartFile nicBackDocument,
            @RequestParam(value = "selfieDocument", required = false) MultipartFile selfieDocument) {

        Map<String, String> response = new HashMap<>();

        try {
            // Get user ID from JWT token
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                response.put("message", "Unauthorized");
                response.put("error", "Please log in to add a role");
                return ResponseEntity.status(401).body(response);
            }

            // Validate role
            if (roleString == null || roleString.trim().isEmpty()) {
                response.put("message", "Failed to add role");
                response.put("error", "Role is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate documents
            if ((nicFrontDocument == null || nicFrontDocument.isEmpty()) ||
                (nicBackDocument == null || nicBackDocument.isEmpty()) ||
                (selfieDocument == null || selfieDocument.isEmpty())) {
                response.put("message", "Failed to add role");
                response.put("error", "All documents (NIC Front, NIC Back, and Selfie) are required");
                return ResponseEntity.badRequest().body(response);
            }

            // Add role to user
            String result = authService.addRoleToUser(userId, roleString, 
                nicFrontDocument, nicBackDocument, selfieDocument);

            if (result.equals("Role request submitted successfully")) {
                response.put("message", result);
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Failed to add role");
                response.put("error", result);
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            response.put("message", "Failed to add role");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // Helper method to get userId from JWT token
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Object userIdObj = jwtUtil.extractClaim(token, claims -> claims.get("userId"));
                if (userIdObj instanceof Integer) {
                    return ((Integer) userIdObj).longValue();
                } else if (userIdObj instanceof Long) {
                    return (Long) userIdObj;
                } else if (userIdObj instanceof String) {
                    return Long.parseLong((String) userIdObj);
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
