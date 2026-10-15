package com.railway.usermanagement;

import com.railway.usermanagement.entity.Passenger;
import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.repository.PassengerRepository;
import com.railway.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RailwayUserManagementApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PassengerRepository passengerRepository;

    @Test
    void contextLoads() {
        assertNotNull(userRepository);
        assertNotNull(passengerRepository);
    }

    @Test
    @Transactional
    @DisplayName("Verify 1:1 relationship between User and Passenger entities")
    void testUserPassengerRelationship() {
        // Create user (email as login ID, no username field)
        User user = new User("passenger.demo@railway.com", "hashed_secret_pw", "PASSENGER", "ACTIVE");
        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getUserId());
        assertEquals("passenger.demo@railway.com", savedUser.getEmail());
        assertEquals("PASSENGER", savedUser.getRole());
        assertEquals("ACTIVE", savedUser.getStatus());

        // Create passenger profile associated 1:1 with saved user
        Passenger passenger = new Passenger(savedUser, "Rahul Sharma", "9876543210");
        savedUser.setPassenger(passenger);
        Passenger savedPassenger = passengerRepository.save(passenger);

        assertNotNull(savedPassenger.getPassengerId());
        assertEquals("Rahul Sharma", savedPassenger.getFullName());
        assertEquals("9876543210", savedPassenger.getMobile());
        assertEquals(savedUser.getUserId(), savedPassenger.getUser().getUserId());

        // Verify repository lookup methods
        Optional<User> foundByEmail = userRepository.findByEmail("passenger.demo@railway.com");
        assertTrue(foundByEmail.isPresent());

        Optional<Passenger> foundByUserId = passengerRepository.findByUser_UserId(savedUser.getUserId());
        assertTrue(foundByUserId.isPresent());
        assertEquals("Rahul Sharma", foundByUserId.get().getFullName());
    }
}
