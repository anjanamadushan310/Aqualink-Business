package com.example.aqualink.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.aqualink.dto.FishAdsResponseDTO;
import com.example.aqualink.dto.FishPurchaseDTO;
import com.example.aqualink.entity.ActiveStatus;
import com.example.aqualink.entity.Fish;
import com.example.aqualink.repository.FishRepository;
import com.example.aqualink.repository.OrderItemRepository;
import com.example.aqualink.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FishAdsViewService {

    private final FishRepository fishRepository;
    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;

    public List<FishAdsResponseDTO> getAllAvailableFish() {
        List<Fish> fishList = fishRepository.findAvailableFishWithProfile();
        return fishList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<FishAdsResponseDTO> getFishById(Long id) {
        return fishRepository.findByIdWithProfile(id)
                .map(this::convertToDTO);
    }

    public List<FishAdsResponseDTO> searchFish(String query) {
        List<Fish> fishList = fishRepository.findByNameContainingIgnoreCase(query);
        return fishList.stream()
                .filter(fish -> fish.getActiveStatus() == ActiveStatus.VERIFIED && fish.getStock() > 0)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FishAdsResponseDTO> getApprovedFishByUserId(Long userId) {
        List<Fish> fishList = fishRepository.findByUserIdWithProfile(userId);
        return fishList.stream()
                .filter(fish -> fish.getActiveStatus() == ActiveStatus.VERIFIED)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean updateFishStock(Long fishId, Long userId, Integer newStock) {
        Optional<Fish> fishOpt = fishRepository.findById(fishId);
        
        if (fishOpt.isPresent()) {
            Fish fish = fishOpt.get();
            
            // Verify the fish belongs to the user
            if (fish.getUser() != null && fish.getUser().getId().equals(userId)) {
                fish.setStock(newStock);
                fishRepository.save(fish);
                return true;
            }
        }
        return false;
    }

    public boolean processPurchase(FishPurchaseDTO purchaseDTO) {
        Optional<Fish> fishOpt = fishRepository.findById(purchaseDTO.getFishId());

        if (fishOpt.isPresent()) {
            Fish fish = fishOpt.get();

            if (fish.getStock() >= purchaseDTO.getQuantity() &&
                    purchaseDTO.getQuantity() >= fish.getMinimumQuantity() &&
                    fish.getActiveStatus() == ActiveStatus.VERIFIED) {

                fish.setStock(fish.getStock() - purchaseDTO.getQuantity());
                fishRepository.save(fish);
                return true;
            }
        }
        return false;
    }

    private FishAdsResponseDTO convertToDTO(Fish fish) {
        FishAdsResponseDTO dto = new FishAdsResponseDTO();
        dto.setId(fish.getId());
        dto.setName(fish.getName());
        dto.setDescription(fish.getDescription());
        dto.setStock(fish.getStock());
        dto.setPrice(fish.getPrice());
        dto.setMinimumQuantity(fish.getMinimumQuantity());
        dto.setCreateDateAndTime(fish.getCreateDateAndTime());
        dto.setActiveStatus(fish.getActiveStatus().toString());

        // Get district and userId from user profile
        if (fish.getUser() != null && fish.getUser().getUserProfile() != null) {
            dto.setDistrict(fish.getUser().getUserProfile().getAddressDistrict());
            dto.setUserId(fish.getUser().getId());
        }

        // Get images
        if (fish.getImagePaths() != null && !fish.getImagePaths().isEmpty()) {
            dto.setImageUrls(fish.getImagePaths());
        } else {
            dto.setImageUrls(List.of("/images/default-fish.jpg"));
        }

        // Calculate rating
        Double averageRating = reviewRepository.findAverageRatingByProductId(fish.getId());
        dto.setRating(averageRating != null ? averageRating : 0.0);

        // Get sold count from fish entity
        Integer soldCount = fish.getSoldCount();
        dto.setTotalSold(soldCount != null ? soldCount.longValue() : 0L);

        // Calculate review count
        Long reviewCount = reviewRepository.countReviewsByProductId(fish.getId());
        dto.setReviewCount(reviewCount != null ? reviewCount : 0L);

        return dto;
    }
}