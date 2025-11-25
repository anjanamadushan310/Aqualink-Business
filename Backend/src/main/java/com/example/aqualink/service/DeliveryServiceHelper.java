package com.example.aqualink.service;

import com.example.aqualink.entity.Order;
import com.example.aqualink.entity.OrderItem;
import com.example.aqualink.repository.FishRepository;
import com.example.aqualink.repository.IndustrialStuffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DeliveryServiceHelper {
    
    private final FishRepository fishRepository;
    private final IndustrialStuffRepository industrialStuffRepository;
    
    /**
     * Update sold counts for products when order is delivered
     */
    @Transactional
    public void updateSoldCounts(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            if ("FISH".equals(item.getProductType())) {
                fishRepository.findById(item.getProductId()).ifPresent(fish -> {
                    int currentSold = fish.getSoldCount() != null ? fish.getSoldCount() : 0;
                    fish.setSoldCount(currentSold + item.getQuantity());
                    fishRepository.save(fish);
                    System.out.println("✓ Updated sold count for Fish '" + fish.getName() + "' #" + fish.getId() + 
                        ": +" + item.getQuantity() + " = " + fish.getSoldCount());
                });
            } else if ("INDUSTRIAL".equals(item.getProductType())) {
                industrialStuffRepository.findById(item.getProductId()).ifPresent(industrial -> {
                    int currentSold = industrial.getSoldCount() != null ? industrial.getSoldCount() : 0;
                    industrial.setSoldCount(currentSold + item.getQuantity());
                    industrialStuffRepository.save(industrial);
                    System.out.println("✓ Updated sold count for Industrial '" + industrial.getName() + "' #" + industrial.getId() + 
                        ": +" + item.getQuantity() + " = " + industrial.getSoldCount());
                });
            }
        }
    }
}
