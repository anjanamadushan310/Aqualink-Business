package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactFormDTO {
    private String name;
    private String email;
    private String subject;
    private String userType;
    private String message;
}
