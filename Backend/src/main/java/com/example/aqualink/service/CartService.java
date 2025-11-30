package com.example.aqualink.service;

import com.example.aqualink.entity.*;
import com.example.aqualink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FishRepository fishRepository;

    @Autowired
    private IndustrialStuffRepository industrialStuffRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    public Cart getCartByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<Cart> cartOpt = cartRepository.findByUser(user);
        if (cartOpt.isPresent()) {
            return cartOpt.get();
        } else {
            // Create new cart if doesn't exist
            Cart newCart = new Cart();
            newCart.setUser(user);
            newCart.setTotalAmount(0.0);
            return cartRepository.save(newCart);
        }
    }

    public void addToCart(String email, Long productId, String productType, Integer quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = getCartByUserEmail(email);
        
        // Check if item already exists in cart
        Optional<CartItem> existingItem = cart.getCartItems().stream()
                .filter(item -> item.getProductId().equals(productId) && 
                               item.getProductType().equalsIgnoreCase(productType))
                .findFirst();

        if (existingItem.isPresent()) {
            // Update quantity if item exists
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            // Create new cart item
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(productId);
            newItem.setProductType(productType);
            newItem.setQuantity(quantity);

            // Get product details and set price
            if ("fish".equalsIgnoreCase(productType)) {
                Fish fish = fishRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Fish product not found"));
                newItem.setPrice(fish.getPrice());
                newItem.setProductName(fish.getName());
                
                if (fish.getImagePaths() != null && !fish.getImagePaths().isEmpty()) {
                    newItem.setImage(fish.getImagePaths().get(0));
                }

                // Set seller information
                User seller = fish.getUser();
                newItem.setSellerId(seller.getId());
                newItem.setSellerName(seller.getName());
                
                // Get business name from user profile
                if (seller.getUserProfile() != null && seller.getUserProfile().getBusinessName() != null) {
                    newItem.setBusinessName(seller.getUserProfile().getBusinessName());
                } else {
                    newItem.setBusinessName(seller.getName() + "'s Business");
                }
                
            } else if ("industrial".equalsIgnoreCase(productType)) {
                IndustrialStuff industrialStuff = industrialStuffRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Industrial product not found"));
                newItem.setPrice(industrialStuff.getPrice());
                newItem.setProductName(industrialStuff.getName());
                
                if (industrialStuff.getImagePaths() != null && !industrialStuff.getImagePaths().isEmpty()) {
                    newItem.setImage(industrialStuff.getImagePaths().get(0));
                }

                // Set seller information
                User seller = industrialStuff.getUser();
                newItem.setSellerId(seller.getId());
                newItem.setSellerName(seller.getName());
                
                // Get business name from user profile
                if (seller.getUserProfile() != null && seller.getUserProfile().getBusinessName() != null) {
                    newItem.setBusinessName(seller.getUserProfile().getBusinessName());
                } else {
                    newItem.setBusinessName(seller.getName() + "'s Business");
                }
            } else if ("service".equalsIgnoreCase(productType)) {
                com.example.aqualink.entity.Service service = serviceRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Service not found"));
                newItem.setPrice(service.getPrice().doubleValue());
                newItem.setProductName(service.getName());
                
                if (service.getImagePaths() != null && !service.getImagePaths().isEmpty()) {
                    newItem.setImage(service.getImagePaths().get(0));
                }

                // Set seller information
                User seller = userRepository.findById(service.getServiceProviderId())
                        .orElseThrow(() -> new RuntimeException("Service provider not found"));
                newItem.setSellerId(seller.getId());
                newItem.setSellerName(seller.getName());
                
                // Get business name from user profile
                if (seller.getUserProfile() != null && seller.getUserProfile().getBusinessName() != null) {
                    newItem.setBusinessName(seller.getUserProfile().getBusinessName());
                } else {
                    newItem.setBusinessName(seller.getName() + "'s Business");
                }
            }

            cartItemRepository.save(newItem);
        }

        // Update cart total
        updateCartTotal(cart);
    }

    public void updateCartItem(String email, Long cartItemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        // Verify ownership
        if (!cartItem.getCart().getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized access to cart item");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        updateCartTotal(cartItem.getCart());
    }

    public void removeFromCart(String email, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        // Verify ownership
        if (!cartItem.getCart().getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized access to cart item");
        }

        Cart cart = cartItem.getCart();
        cartItemRepository.delete(cartItem);
        updateCartTotal(cart);
    }

    public void clearCart(String email) {
        Cart cart = getCartByUserEmail(email);
        cartItemRepository.deleteAll(cart.getCartItems());
        cart.getCartItems().clear();
        cart.setTotalAmount(0.0);
        cartRepository.save(cart);
    }

    public int getCartItemCount(String email) {
        Cart cart = getCartByUserEmail(email);
        return cart.getCartItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private void updateCartTotal(Cart cart) {
        double total = cart.getCartItems().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        cart.setTotalAmount(total);
        cartRepository.save(cart);
    }
}