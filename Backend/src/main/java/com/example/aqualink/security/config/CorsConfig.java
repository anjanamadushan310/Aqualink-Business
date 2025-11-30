package com.example.aqualink.security.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// DISABLED: CORS is handled by SecurityConfig.java to avoid conflicts
// Having two CORS configurations causes: "When allowCredentials is true, allowedOrigins cannot contain *"
// @Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${fishimages.upload.dir}")
    private String uploadDir;

    // CORS DISABLED - See SecurityConfig.java
//    @Override
//    public void addCorsMappings(CorsRegistry registry) {
//        // API endpoints CORS
//        registry.addMapping("/api/**")
//                .allowedOriginPatterns("http://localhost:5173", "http://localhost:3000")
//                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
//                .allowedHeaders("*")
//                .allowCredentials(true);
//
//        // File uploads CORS
//        registry.addMapping("/uploads/**")
//                .allowedOriginPatterns("http://localhost:5173", "http://localhost:3000")
//                .allowedMethods("GET", "OPTIONS")
//                .allowedHeaders("*")
//                .allowCredentials(true);
//
//        // Images serving CORS (for image display)
//        registry.addMapping("/images/**")
//                .allowedOriginPatterns("http://localhost:5173", "http://localhost:3000")
//                .allowedMethods("GET", "OPTIONS")
//                .allowedHeaders("*")
//                .allowCredentials(true);
//    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve fish images from the upload directory
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }
}
