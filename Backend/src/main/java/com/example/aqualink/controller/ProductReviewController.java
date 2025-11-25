package com.example.aqualink.controller;

import com.example.aqualink.dto.ProductRatingsSummaryDTO;
import com.example.aqualink.dto.ProductReviewRequestDTO;
import com.example.aqualink.dto.ProductReviewResponseDTO;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.UserRepository;
import com.example.aqualink.service.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<?> createReview(
            @Valid @RequestBody ProductReviewRequestDTO request,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProductReviewResponseDTO review = productReviewService.createReview(request, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/product/{productId}/{productType}")
    public ResponseEntity<List<ProductReviewResponseDTO>> getProductReviews(
            @PathVariable Long productId,
            @PathVariable String productType) {
        List<ProductReviewResponseDTO> reviews = productReviewService.getProductReviews(productId, productType);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productId}/{productType}/summary")
    public ResponseEntity<ProductRatingsSummaryDTO> getProductRatingsSummary(
            @PathVariable Long productId,
            @PathVariable String productType) {
        ProductRatingsSummaryDTO summary = productReviewService.getProductRatingsSummary(productId, productType);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<List<ProductReviewResponseDTO>> getUserReviews(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ProductReviewResponseDTO> reviews = productReviewService.getUserReviews(user.getId());
        return ResponseEntity.ok(reviews);
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ProductReviewRequestDTO request,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ProductReviewResponseDTO review = productReviewService.updateReview(reviewId, request, user.getId());
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            productReviewService.deleteReview(reviewId, user.getId());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Review deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/check/{productId}/{productType}")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<Map<String, Boolean>> checkIfUserReviewedProduct(
            @PathVariable Long productId,
            @PathVariable String productType,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean hasReviewed = productReviewService.hasUserReviewedProduct(user.getId(), productId, productType);
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasReviewed", hasReviewed);
        return ResponseEntity.ok(response);
    }
}
