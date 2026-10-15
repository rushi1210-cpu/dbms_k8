package com.railway.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LoginResponse {

    private String token;

    @JsonProperty("user_id")
    private Long userId;

    private String email;
    private String role;
    private String status;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long userId, String email, String role, String status) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.status = status;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
