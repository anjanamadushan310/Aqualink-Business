package com.example.aqualink.dto;

import com.example.aqualink.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleAssignmentDTO {
    private Long userId;
    private Role role;
    private String reason;
}
