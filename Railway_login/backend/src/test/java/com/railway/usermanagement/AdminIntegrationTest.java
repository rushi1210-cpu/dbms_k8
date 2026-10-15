package com.railway.usermanagement;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.railway.usermanagement.dto.LoginRequest;
import com.railway.usermanagement.dto.PassengerUpdateRequest;
import com.railway.usermanagement.dto.RegisterRequest;
import com.railway.usermanagement.dto.StatusUpdateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Admin Full Lifecycle: Login, Stats, Pagination, Search, View, Edit, Status Toggle, and Delete")
    void testAdminLifecycleAndSecurity() throws Exception {
        // 1. Create a regular passenger to verify separation of roles
        String passengerEmail = "regular.passenger." + System.currentTimeMillis() + "@railway.test";
        String passengerPassword = "PassPassword@123";
        RegisterRequest registerReq = new RegisterRequest(
                "Regular User", passengerEmail, passengerPassword, passengerPassword, "9876543210"
        );
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        long createdPassengerId = regJson.get("passenger_id").asLong();

        // 2. Regular passenger login to get passenger JWT
        LoginRequest passengerLogin = new LoginRequest(passengerEmail, passengerPassword);
        MvcResult passengerLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passengerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        String passengerToken = objectMapper.readTree(passengerLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 3. Regular passenger CANNOT log in via admin login endpoint
        mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passengerLogin)))
                .andExpect(status().isForbidden());

        // 4. Regular passenger CANNOT access admin statistics or admin endpoints
        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + passengerToken))
                .andExpect(status().isForbidden());

        // 5. Unauthenticated request to admin endpoints receives 401
        mockMvc.perform(get("/api/admin/statistics"))
                .andExpect(status().isUnauthorized());

        // 6. Admin login with bad password fails with 401
        LoginRequest badAdminLogin = new LoginRequest("admin@railway.com", "WrongAdminPass");
        mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badAdminLogin)))
                .andExpect(status().isUnauthorized());

        // 7. Admin login with correct password succeeds and returns JWT with role ADMIN
        LoginRequest goodAdminLogin = new LoginRequest("admin@railway.com", "Admin@123");
        MvcResult adminLoginResult = mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodAdminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist())
                .andReturn();

        String adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).get("token").asText();

        // 8. Admin GET /api/admin/statistics returns dynamic counts
        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.totalPassengers").isNumber())
                .andExpect(jsonPath("$.activeUsers").isNumber())
                .andExpect(jsonPath("$.inactiveUsers").isNumber());

        // 9. Admin GET /api/admin/passengers server-side pagination
        mockMvc.perform(get("/api/admin/passengers?page=0&size=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.totalPages").isNumber());

        // 10. Admin search by keyword
        mockMvc.perform(get("/api/admin/passengers?search=" + passengerEmail)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value(passengerEmail))
                .andExpect(jsonPath("$.content[0].password_hash").doesNotExist());

        // 11. Admin view single passenger
        mockMvc.perform(get("/api/admin/passengers/" + createdPassengerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passenger_id").value(createdPassengerId))
                .andExpect(jsonPath("$.email").value(passengerEmail))
                .andExpect(jsonPath("$.password_hash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());

        // 12. Admin edit passenger profile
        PassengerUpdateRequest updateReq = new PassengerUpdateRequest("Updated Regular User", "9112233445");
        mockMvc.perform(put("/api/admin/passengers/" + createdPassengerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.full_name").value("Updated Regular User"))
                .andExpect(jsonPath("$.mobile").value("9112233445"));

        // 13. Admin deactivate passenger
        StatusUpdateRequest deactivateReq = new StatusUpdateRequest("INACTIVE");
        mockMvc.perform(patch("/api/admin/passengers/" + createdPassengerId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deactivateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        // 14. Deactivated passenger CANNOT log in
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passengerLogin)))
                .andExpect(status().isUnauthorized());

        // 15. Deactivated passenger's old JWT token is rejected
        mockMvc.perform(get("/api/passengers/profile")
                        .header("Authorization", "Bearer " + passengerToken))
                .andExpect(status().isUnauthorized());

        // 16. Admin reactivates passenger
        StatusUpdateRequest activateReq = new StatusUpdateRequest("ACTIVE");
        mockMvc.perform(patch("/api/admin/passengers/" + createdPassengerId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(activateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 17. Passenger can log in again
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passengerLogin)))
                .andExpect(status().isOk());

        // 18. Admin deletes passenger
        mockMvc.perform(delete("/api/admin/passengers/" + createdPassengerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passenger_id").value(createdPassengerId));

        // 19. Subsequent GET for deleted passenger returns 404
        mockMvc.perform(get("/api/admin/passengers/" + createdPassengerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
