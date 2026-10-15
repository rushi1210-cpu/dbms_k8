package com.railway.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RegisterResponse {

    private String message;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("passenger_id")
    private Long passengerId;

    private String email;
    private String role;
    private String status;

    public RegisterResponse() {
    }

    public RegisterResponse(String message, Long userId, Long passengerId, String email, String role, String status) {
        this.message = message;
        this.userId = userId;
        this.passengerId = passengerId;
        this.email = email;
        this.role = role;
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPassengerId() {
        return passengerId;
    }

    public void setPassengerId(Long passengerId) {
        this.passengerId = passengerId;
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
