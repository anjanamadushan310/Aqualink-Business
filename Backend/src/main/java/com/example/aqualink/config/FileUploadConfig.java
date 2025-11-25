package com.example.aqualink.config;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;
    @Value("${industrialimages.upload.dir}")
    private String industrialImagesUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Create main upload directory if it doesn't exist
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }

        // Normalize upload directory path - ensure it ends with /
        String normalizedUploadDir = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";

        // Handle main upload directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + normalizedUploadDir);

        // Create and handle banner uploads directory
        File bannerDirectory = new File(uploadDir + "banners/");
        if (!bannerDirectory.exists()) {
            bannerDirectory.mkdirs();
        }
        registry.addResourceHandler("/uploads/banners/**")
                .addResourceLocations("file:" + normalizedUploadDir + "banners/");

        // Create and handle industrial images directory
        File industrialImagesDirectory = new File(industrialImagesUploadDir);
        if (!industrialImagesDirectory.exists()) {
            industrialImagesDirectory.mkdirs();
        }
        // Normalize industrial images path
        String normalizedIndustrialDir = industrialImagesUploadDir.endsWith("/") 
            ? industrialImagesUploadDir 
            : industrialImagesUploadDir + "/";
        registry.addResourceHandler("/uploads/industrial_images/**")
                .addResourceLocations("file:" + normalizedIndustrialDir);

        // Handle fish images (if needed)
        File fishImagesDirectory = new File(uploadDir + "fish_images/");
        if (!fishImagesDirectory.exists()) {
            fishImagesDirectory.mkdirs();
        }
        registry.addResourceHandler("/uploads/fish_images/**")
                .addResourceLocations("file:" + normalizedUploadDir + "fish_images/");

        // Handle service images (if needed)
        File serviceImagesDirectory = new File(uploadDir + "service_images/");
        if (!serviceImagesDirectory.exists()) {
            serviceImagesDirectory.mkdirs();
        }
        registry.addResourceHandler("/uploads/service_images/**")
                .addResourceLocations("file:" + normalizedUploadDir + "service_images/");

        // Handle blog images
        File blogImagesDirectory = new File(uploadDir + "blog/");
        if (!blogImagesDirectory.exists()) {
            blogImagesDirectory.mkdirs();
        }
        registry.addResourceHandler("/uploads/blog/**")
                .addResourceLocations("file:" + normalizedUploadDir + "blog/");
    }
}

