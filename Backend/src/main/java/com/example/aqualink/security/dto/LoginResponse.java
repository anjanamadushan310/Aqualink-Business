package com.example.aqualink.security.dto;

import java.util.Set;

import com.example.aqualink.entity.Role;

public class LoginResponse {
    private String token;
    private Set<Role> roles;
    private String nicNumber;
    private Long userId;
    private String userName; // User's name
    private String message; // Add message field for error handling



    public LoginResponse() {}


    public LoginResponse(String token, Set<Role> roles,  String nicNumber, Long userId, String userName) {
        this.token = token;
        this.roles = roles;
        this.nicNumber = nicNumber;
        this.userId = userId;
        this.userName = userName;
    }

    // Constructor with message (useful for error responses)
    public LoginResponse(String message) {
        this.message = message;
    }



    public LoginResponse(String token, Set<Role> roles, String nicNumber, String message, Long userId) {

  

        this.token = token;
        this.roles = roles;
        this.nicNumber = nicNumber;
        this.message = message;
        this.userId = userId;
    }


    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public String getNicNumber() { return nicNumber; }
    public void setNicNumber(String nicNumber) { this.nicNumber = nicNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "token='" + (token != null ? "***" : null) + '\'' +
                ", roles=" + roles +
                ", nicNumber='" + nicNumber + '\'' +
                ", userId=" + userId +
                ", message='" + message + '\'' +
                ", userId=" + userId +
                '}';
    }
}