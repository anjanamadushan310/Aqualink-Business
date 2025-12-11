package com.example.aqualink.controller;

import com.example.aqualink.dto.CartDto;
import com.example.aqualink.entity.Cart;
import com.example.aqualink.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<Cart> getCart(Authentication authentication) {
        try {
            String email = authentication.getName();
            Cart cart = cartService.getCartByUserEmail(email);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/add")
    public ResponseEntity<String> addToCart(@RequestBody CartDto cartDto, Authentication authentication) {
        try {
            String email = authentication.getName();
            cartService.addToCart(email, cartDto.getProductId(), cartDto.getProductType(), cartDto.getQuantity());
            return ResponseEntity.ok("Item added to cart successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add item to cart: " + e.getMessage());
        }
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateCartItem(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Long cartItemId = Long.valueOf(request.get("cartItemId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            
            cartService.updateCartItem(email, cartItemId, quantity);
            return ResponseEntity.ok("Cart item updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update cart item: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<String> removeFromCart(@PathVariable Long cartItemId, Authentication authentication) {
        try {
            String email = authentication.getName();
            cartService.removeFromCart(email, cartItemId);
            return ResponseEntity.ok("Item removed from cart successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove item from cart: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/seller/{sellerId}")
    public ResponseEntity<String> removeSellerItems(@PathVariable Long sellerId, Authentication authentication) {
        try {
            String email = authentication.getName();
            cartService.removeItemsBySeller(email, sellerId);
            return ResponseEntity.ok("Seller items removed from cart successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to remove seller items from cart: " + e.getMessage());
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(Authentication authentication) {
        try {
            String email = authentication.getName();
            cartService.clearCart(email);
            return ResponseEntity.ok("Cart cleared successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to clear cart: " + e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartItemCount(Authentication authentication) {
        try {
            String email = authentication.getName();
            int count = cartService.getCartItemCount(email);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.ok(0);
        }
    }
}