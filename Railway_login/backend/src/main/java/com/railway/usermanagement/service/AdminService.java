package com.railway.usermanagement.service;

import com.railway.usermanagement.dto.AdminStatisticsResponse;
import com.railway.usermanagement.dto.LoginRequest;
import com.railway.usermanagement.dto.LoginResponse;
import com.railway.usermanagement.dto.PageResponse;
import com.railway.usermanagement.dto.PassengerAdminResponse;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.entity.Passenger;
import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.exception.InvalidCredentialsException;
import com.railway.usermanagement.exception.ResourceNotFoundException;
import com.railway.usermanagement.repository.PassengerRepository;
import com.railway.usermanagement.repository.UserRepository;
import com.railway.usermanagement.security.JwtService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PassengerRepository passengerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AdminService(
            UserRepository userRepository,
            PassengerRepository passengerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passengerRepository = passengerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        final String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid admin email or password"));

        // Verify password against BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid admin email or password");
        }

        // Verify user has ADMIN role
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException("Access denied. Admin privileges are required to access this endpoint.");
        }

        // Verify status is ACTIVE
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new InvalidCredentialsException("Admin account is not active (status: " + user.getStatus() + ")");
        }

        // Generate JWT token containing userId, email, and ADMIN role
        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), user.getRole());

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public AdminStatisticsResponse getStatistics() {
        long totalUsers = userRepository.count();
        long totalPassengers = passengerRepository.count();
        long activeUsers = userRepository.countByStatusIgnoreCase("ACTIVE");
        long inactiveUsers = userRepository.countByStatusIgnoreCase("INACTIVE");

        return new AdminStatisticsResponse(totalUsers, totalPassengers, activeUsers, inactiveUsers);
    }

    @Transactional(readOnly = true)
    public PageResponse<PassengerAdminResponse> getPassengers(
            Pageable pageable,
            String search,
            Long passengerId,
            String fullName,
            String email,
            String mobile
    ) {
        Page<Passenger> passengerPage;

        if (search != null && !search.trim().isEmpty()) {
            passengerPage = passengerRepository.searchPassengers(search.trim(), pageable);
        } else if (passengerId != null || fullName != null || email != null || mobile != null) {
            passengerPage = passengerRepository.findByFilters(
                    passengerId,
                    fullName != null && !fullName.trim().isEmpty() ? fullName.trim() : null,
                    email != null && !email.trim().isEmpty() ? email.trim() : null,
                    mobile != null && !mobile.trim().isEmpty() ? mobile.trim() : null,
                    pageable
            );
        } else {
            passengerPage = passengerRepository.findAll(pageable);
        }

        List<PassengerAdminResponse> content = passengerPage.getContent()
                .stream()
                .map(this::toPassengerAdminResponse)
                .toList();

        return new PageResponse<>(
                content,
                passengerPage.getNumber(),
                passengerPage.getSize(),
                passengerPage.getTotalElements(),
                passengerPage.getTotalPages(),
                passengerPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PassengerAdminResponse getPassengerById(Long id) {
        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with ID: " + id));
        return toPassengerAdminResponse(passenger);
    }

    @Transactional
    public PassengerAdminResponse updatePassenger(Long id, PassengerUpdateRequest request) {
        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with ID: " + id));

        // Update only allowed fields
        passenger.setFullName(request.getFullName().trim());
        passenger.setMobile(request.getMobile().trim());

        Passenger updatedPassenger = passengerRepository.save(passenger);
        return toPassengerAdminResponse(updatedPassenger);
    }

    @Transactional
    public PassengerAdminResponse updateStatus(Long id, String status) {
        if (status == null || (!status.equalsIgnoreCase("ACTIVE") && !status.equalsIgnoreCase("INACTIVE"))) {
            throw new IllegalArgumentException("Status must be either ACTIVE or INACTIVE");
        }

        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with ID: " + id));

        User user = passenger.getUser();
        user.setStatus(status.toUpperCase());
        userRepository.save(user);

        return toPassengerAdminResponse(passenger);
    }

    @Transactional
    public Map<String, Object> deletePassenger(Long id) {
        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with ID: " + id));

        User user = passenger.getUser();

        // Remove passenger then user to respect cascading integrity
        passengerRepository.delete(passenger);
        if (user != null) {
            userRepository.delete(user);
        }

        return Map.of(
                "message", "Passenger and associated user deleted successfully",
                "passenger_id", id
        );
    }

    private PassengerAdminResponse toPassengerAdminResponse(Passenger passenger) {
        User user = passenger.getUser();
        return new PassengerAdminResponse(
                passenger.getPassengerId(),
                user != null ? user.getUserId() : null,
                passenger.getFullName(),
                user != null ? user.getEmail() : null,
                passenger.getMobile(),
                user != null ? user.getRole() : "PASSENGER",
                user != null ? user.getStatus() : "ACTIVE",
                passenger.getCreatedAt(),
                passenger.getUpdatedAt()
        );
    }
}
