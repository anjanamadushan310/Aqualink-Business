package com.example.aqualink.controller;

import com.example.aqualink.dto.IndustrialStuffResponseDTO;
import com.example.aqualink.dto.IndustrialStuffPurchaseDTO;
import com.example.aqualink.service.IndustrialStuffViewService;
import com.example.aqualink.security.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/industrial")
@RequiredArgsConstructor
public class IndustrialStuffViewController {

    private final IndustrialStuffViewService industrialService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<IndustrialStuffResponseDTO>> getAllIndustrial() {
        List<IndustrialStuffResponseDTO> industrialList = industrialService.getAllAvailableIndustrial();
        return ResponseEntity.ok(industrialList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IndustrialStuffResponseDTO> getIndustrialById(@PathVariable Long id) {
        Optional<IndustrialStuffResponseDTO> industrial = industrialService.getIndustrialById(id);
        return industrial.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<IndustrialStuffResponseDTO>> searchIndustrial(@RequestParam String q) {
        List<IndustrialStuffResponseDTO> industrialList = industrialService.searchIndustrial(q);
        return ResponseEntity.ok(industrialList);
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<String> purchaseIndustrial(@PathVariable Long id, @RequestBody IndustrialStuffPurchaseDTO purchaseDTO) {
        purchaseDTO.setIndustrialId(id);
        boolean success = industrialService.processPurchase(purchaseDTO);
        if (success) {
            return ResponseEntity.ok("Purchase successful!");
        } else {
            return ResponseEntity.badRequest().body("Purchase failed. Check stock availability.");
        }
    }

    @GetMapping("/my-approved")
    public ResponseEntity<List<IndustrialStuffResponseDTO>> getMyApprovedIndustrialStuff(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        List<IndustrialStuffResponseDTO> industrialList = industrialService.getApprovedIndustrialByUserId(userId);
        return ResponseEntity.ok(industrialList);
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateIndustrialStock(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, Integer> stockUpdate) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Integer newStock = stockUpdate.get("stock");
        if (newStock == null || newStock < 0) {
            return ResponseEntity.badRequest().body("Invalid stock value");
        }

        boolean success = industrialService.updateIndustrialStock(id, userId, newStock);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Stock updated successfully"));
        } else {
            return ResponseEntity.status(403).body("Not authorized to update this industrial stuff ad or ad not found");
        }
    }

    // Helper method to get userId from JWT token claims
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
