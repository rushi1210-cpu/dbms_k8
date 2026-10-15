package com.railway.usermanagement.service;

import com.railway.usermanagement.dto.PassengerResponse;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.entity.Passenger;
import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.exception.ResourceNotFoundException;
import com.railway.usermanagement.repository.PassengerRepository;
import com.railway.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PassengerService {

    private final UserRepository userRepository;
    private final PassengerRepository passengerRepository;

    public PassengerService(UserRepository userRepository, PassengerRepository passengerRepository) {
        this.userRepository = userRepository;
        this.passengerRepository = passengerRepository;
    }

    @Transactional(readOnly = true)
    public PassengerResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Passenger passenger = passengerRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger profile not found for user: " + email));

        return toPassengerResponse(passenger, user);
    }

    @Transactional
    public PassengerResponse updateProfile(String email, PassengerUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Passenger passenger = passengerRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger profile not found for user: " + email));

        // Allow updating only full_name and mobile.
        // user_id, passenger_id, email, role, status, password_hash remain untouched.
        passenger.setFullName(request.getFullName().trim());
        passenger.setMobile(request.getMobile().trim());

        Passenger updatedPassenger = passengerRepository.save(passenger);

        return toPassengerResponse(updatedPassenger, user);
    }

    private PassengerResponse toPassengerResponse(Passenger passenger, User user) {
        return new PassengerResponse(
                passenger.getPassengerId(),
                user.getUserId(),
                passenger.getFullName(),
                user.getEmail(),
                passenger.getMobile(),
                user.getStatus(),
                passenger.getCreatedAt()
        );
    }
}
