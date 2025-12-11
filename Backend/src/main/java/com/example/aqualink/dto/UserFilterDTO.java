package com.example.aqualink.dto;

import com.example.aqualink.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFilterDTO {
    private Role role;
    private Boolean active;
    private Boolean enabled;
    private String verificationStatus;
    private LocalDateTime dateFrom;
    private LocalDateTime dateTo;
    private String search;
    private int page = 0;
    private int size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}
