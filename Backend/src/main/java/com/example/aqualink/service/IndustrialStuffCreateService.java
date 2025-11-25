package com.example.aqualink.service;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.aqualink.dto.IndustrialStuffRequestDTO;
import com.example.aqualink.entity.IndustrialStuff;
import com.example.aqualink.entity.User;
import com.example.aqualink.repository.IndustrialStuffRepository;
import com.example.aqualink.repository.UserRepository;

@Service
public class IndustrialStuffCreateService {

    private final IndustrialStuffRepository industrialStuffRepository;
    private final IndustrialImgUploadService industrialImgUploadService;
    private final UserRepository userRepository;

    public IndustrialStuffCreateService(IndustrialStuffRepository industrialStuffRepository,
                                        IndustrialImgUploadService industrialImgUploadService,
                                        UserRepository userRepository) {
        this.industrialStuffRepository = industrialStuffRepository;
        this.industrialImgUploadService = industrialImgUploadService;
        this.userRepository = userRepository;
    }

    @Transactional
    public IndustrialStuff saveIndustrialAd(IndustrialStuffRequestDTO industrialStuffRequestDTO) throws IOException {
        // Find user using userId
        User user = userRepository.findById(industrialStuffRequestDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found for userId: " + industrialStuffRequestDTO.getUserId()));

        // Create IndustrialStuff entity
        IndustrialStuff industrialStuff = new IndustrialStuff();
        industrialStuff.setName(industrialStuffRequestDTO.getName());
        industrialStuff.setDescription(industrialStuffRequestDTO.getDescription());
        industrialStuff.setCategory(industrialStuffRequestDTO.getCategory());
        industrialStuff.setNicNumber(industrialStuffRequestDTO.getNicNumber());
        industrialStuff.setStock(industrialStuffRequestDTO.getStock());
        industrialStuff.setPrice(industrialStuffRequestDTO.getPrice());
        // Auto-set inStock based on stock quantity
        industrialStuff.setInStock(industrialStuffRequestDTO.getStock() > 0);

        // Set user relationship
        industrialStuff.setUser(user);

        // Save industrial stuff to get the ID
        IndustrialStuff savedIndustrialStuff = industrialStuffRepository.save(industrialStuff);

        // Save images and get paths if provided
        if (industrialStuffRequestDTO.getImages() != null && industrialStuffRequestDTO.getImages().length > 0) {
            List<String> imagePaths = industrialImgUploadService.saveImages(industrialStuffRequestDTO.getImages(), savedIndustrialStuff.getId());
            savedIndustrialStuff.setImagePaths(imagePaths);

            // Save again to update with image paths
            savedIndustrialStuff = industrialStuffRepository.save(savedIndustrialStuff);
        }

        return savedIndustrialStuff;
    }
}
