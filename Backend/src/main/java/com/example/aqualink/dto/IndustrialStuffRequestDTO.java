package com.example.aqualink.dto;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

@Data
public class IndustrialStuffRequestDTO {
    private String name;
    private String description;
    private String category;
    private String nicNumber;
    private Integer stock;
    private Double price;
    private Long userId;
    private MultipartFile[] images;
}
