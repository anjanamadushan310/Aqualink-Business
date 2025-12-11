package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String nicNumber;
    private List<String> roles;
    private boolean active;
    private boolean enabled;
    private String verificationStatus;
    private LocalDateTime createdAt;
    private String logoUrl;
    private String businessName;
    private String district;
    private String town;
}
