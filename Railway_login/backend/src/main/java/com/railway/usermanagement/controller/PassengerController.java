package com.railway.usermanagement.controller;

import com.railway.usermanagement.dto.PassengerResponse;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.service.PassengerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passengers")
public class PassengerController {

    private final PassengerService passengerService;

    public PassengerController(PassengerService passengerService) {
        this.passengerService = passengerService;
    }

    @GetMapping("/profile")
    public ResponseEntity<PassengerResponse> getProfile(Authentication authentication) {
        String email = authentication.getName();
        PassengerResponse response = passengerService.getProfile(email);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<PassengerResponse> updateProfile(
            @Valid @RequestBody PassengerUpdateRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        PassengerResponse response = passengerService.updateProfile(email, request);
        return ResponseEntity.ok(response);
    }
}
