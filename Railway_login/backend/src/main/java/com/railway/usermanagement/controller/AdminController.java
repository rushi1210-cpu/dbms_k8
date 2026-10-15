package com.railway.usermanagement.controller;

import com.railway.usermanagement.dto.AdminStatisticsResponse;
import com.railway.usermanagement.dto.LoginRequest;
import com.railway.usermanagement.dto.LoginResponse;
import com.railway.usermanagement.dto.PageResponse;
import com.railway.usermanagement.dto.PassengerAdminResponse;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.dto.StatusUpdateRequest;
import com.railway.usermanagement.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Admin login endpoint.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = adminService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get dynamic system statistics.
     */
    @GetMapping("/statistics")
    public ResponseEntity<AdminStatisticsResponse> getStatistics() {
        AdminStatisticsResponse statistics = adminService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Server-side paginated and searchable passenger list.
     */
    @GetMapping("/passengers")
    public ResponseEntity<PageResponse<PassengerAdminResponse>> getPassengers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "passengerId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long passengerId,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String mobile
    ) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<PassengerAdminResponse> response = adminService.getPassengers(
                pageable, search, passengerId, fullName, email, mobile
        );
        return ResponseEntity.ok(response);
    }

    /**
     * View detailed passenger information by ID.
     */
    @GetMapping("/passengers/{id}")
    public ResponseEntity<PassengerAdminResponse> getPassengerById(@PathVariable Long id) {
        PassengerAdminResponse response = adminService.getPassengerById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update passenger profile fields (full_name and mobile only).
     */
    @PutMapping("/passengers/{id}")
    public ResponseEntity<PassengerAdminResponse> updatePassenger(
            @PathVariable Long id,
            @Valid @RequestBody PassengerUpdateRequest request
    ) {
        PassengerAdminResponse response = adminService.updatePassenger(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Activate or deactivate a passenger account.
     */
    @PatchMapping("/passengers/{id}/status")
    public ResponseEntity<PassengerAdminResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        PassengerAdminResponse response = adminService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a passenger and their corresponding user record safely.
     */
    @DeleteMapping("/passengers/{id}")
    public ResponseEntity<Map<String, Object>> deletePassenger(@PathVariable Long id) {
        Map<String, Object> result = adminService.deletePassenger(id);
        return ResponseEntity.ok(result);
    }
}
