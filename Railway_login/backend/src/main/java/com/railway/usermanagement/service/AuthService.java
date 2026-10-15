package com.railway.usermanagement.service;

import com.railway.usermanagement.dto.LoginRequest;
import com.railway.usermanagement.dto.LoginResponse;
import com.railway.usermanagement.dto.RegisterRequest;
import com.railway.usermanagement.dto.RegisterResponse;
import com.railway.usermanagement.entity.Passenger;
import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.exception.EmailAlreadyExistsException;
import com.railway.usermanagement.exception.InvalidCredentialsException;
import com.railway.usermanagement.exception.PasswordMismatchException;
import com.railway.usermanagement.repository.PassengerRepository;
import com.railway.usermanagement.repository.UserRepository;
import com.railway.usermanagement.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PassengerRepository passengerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
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

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // Validate password confirmation match
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Password and confirm password do not match");
        }

        final String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Check email uniqueness
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email is already registered: " + normalizedEmail);
        }

        // Hash password with BCrypt - never store plaintext
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // Create User record with default role and status (backend controlled)
        User user = new User(normalizedEmail, passwordHash, "PASSENGER", "ACTIVE");
        User savedUser = userRepository.save(user);

        // Create Passenger record maintaining 1:1 relationship
        Passenger passenger = new Passenger(savedUser, request.getFullName().trim(), request.getMobile().trim());
        Passenger savedPassenger = passengerRepository.save(passenger);

        savedUser.setPassenger(savedPassenger);

        return new RegisterResponse(
                "Passenger registered successfully",
                savedUser.getUserId(),
                savedPassenger.getPassengerId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        final String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // Verify password against BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new InvalidCredentialsException("Account is not active (status: " + user.getStatus() + ")");
        }

        // Generate JWT token containing userId, email, and role
        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), user.getRole());

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }
}
