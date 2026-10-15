package com.railway.usermanagement;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.railway.usermanagement.dto.LoginRequest;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.dto.RegisterRequest;
import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthAndPassengerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("End-to-End Test: Registration, Login, Token Security, Profile View, and Profile Update")
    void testCompleteAuthAndProfileLifecycle() throws Exception {
        String uniqueEmail = "priya.sharma" + System.currentTimeMillis() + "@railway.test";
        String plaintextPassword = "SecretPassword123";

        // 1. Test Registration
        RegisterRequest registerReq = new RegisterRequest(
                "Priya Sharma",
                uniqueEmail,
                plaintextPassword,
                plaintextPassword,
                "9876501234"
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.role").value("PASSENGER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.user_id").isNumber())
                .andExpect(jsonPath("$.passenger_id").isNumber())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist())
                .andReturn();

        // 2. Verify BCrypt hashing in database (never stored plaintext, starts with $2a$ or $2b$)
        User dbUser = userRepository.findByEmail(uniqueEmail).orElseThrow();
        assertNotEquals(plaintextPassword, dbUser.getPasswordHash());
        assertTrue(dbUser.getPasswordHash().startsWith("$2a$") || dbUser.getPasswordHash().startsWith("$2b$") || dbUser.getPasswordHash().startsWith("$2y$"),
                "Password hash should be standard BCrypt format");

        // 3. Test Duplicate Registration (must fail with 409 Conflict)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));

        // 4. Test Password Mismatch Registration (must fail with 400 Bad Request)
        RegisterRequest mismatchReq = new RegisterRequest(
                "Test User",
                "diff" + System.currentTimeMillis() + "@railway.test",
                "PasswordOne1",
                "PasswordTwo2",
                "9876543210"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mismatchReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // 5. Test Login with Incorrect Password (must fail with 401 Unauthorized)
        LoginRequest badLogin = new LoginRequest(uniqueEmail, "WrongPassword!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // 6. Test Login with Correct Password (must return JWT token, user_id, email, role, status)
        LoginRequest goodLogin = new LoginRequest(uniqueEmail, plaintextPassword);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.role").value("PASSENGER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.user_id").isNumber())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String jwtToken = loginJson.get("token").asText();
        assertNotNull(jwtToken);
        assertFalse(jwtToken.isBlank());

        // 7. Test Protected Profile Endpoint WITHOUT JWT (must return 401 Unauthorized)
        mockMvc.perform(get("/api/passengers/profile"))
                .andExpect(status().isUnauthorized());

        // 8. Test Protected Profile Endpoint WITH Valid JWT (must return passenger profile)
        mockMvc.perform(get("/api/passengers/profile")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.full_name").value("Priya Sharma"))
                .andExpect(jsonPath("$.mobile").value("9876501234"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.passenger_id").isNumber())
                .andExpect(jsonPath("$.user_id").isNumber())
                .andExpect(jsonPath("$.created_at").exists())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist());

        // 9. Test Profile Update (authenticated passenger can update ONLY full_name and mobile)
        PassengerUpdateRequest updateReq = new PassengerUpdateRequest("Priya Sharma Verma", "9988776655");
        mockMvc.perform(put("/api/passengers/profile")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.full_name").value("Priya Sharma Verma"))
                .andExpect(jsonPath("$.mobile").value("9988776655"))
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist());

        // 10. Verify updated profile is reflected in subsequent GET request
        mockMvc.perform(get("/api/passengers/profile")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.full_name").value("Priya Sharma Verma"))
                .andExpect(jsonPath("$.mobile").value("9988776655"));
    }
}
