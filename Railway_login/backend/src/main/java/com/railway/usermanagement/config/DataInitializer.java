package com.railway.usermanagement.config;

import com.railway.usermanagement.entity.User;
import com.railway.usermanagement.repository.PassengerRepository;
import com.railway.usermanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PassengerRepository passengerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${admin.email:admin@railway.com}")
    private String adminEmail;

    @Value("${admin.password:Admin@123}")
    private String adminPassword;

    @Value("${synthetic.passengers.target-count:10000}")
    private int targetPassengerCount;

    @Value("${synthetic.passengers.batch-size:1000}")
    private int batchSize;

    private static final String[] FIRST_NAMES = {
            "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Arnav", "Aayan", "Krishna",
            "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav", "Aryan", "Dhruv", "Kabir", "Rohan", "Rahul",
            "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Anika", "Navya", "Avani", "Myra", "Sara",
            "Ira", "Riya", "Sneha", "Pooja", "Neha", "Priya", "Kavita", "Sunita", "Anita", "Divya",
            "Amit", "Rohit", "Suresh", "Ramesh", "Vikas", "Deepak", "Manoj", "Rajesh", "Sanjay", "Alok"
    };

    private static final String[] LAST_NAMES = {
            "Sharma", "Verma", "Patel", "Gupta", "Kumar", "Singh", "Mishra", "Yadav", "Das", "Ghosh",
            "Roy", "Banerjee", "Chatterjee", "Joshi", "Kulkarni", "Deshmukh", "Patil", "Nair", "Menon", "Pillai",
            "Reddy", "Rao", "Hegde", "Bhatt", "Mehta", "Shah", "Agarwal", "Jain", "Chauhan", "Pandey",
            "Trivedi", "Shukla", "Saxena", "Bose", "Dutta", "Sengupta", "Chakraborty", "Choudhury", "Bhardwaj", "Kapoor",
            "Malhotra", "Bhatia", "Seth", "Khanna", "Soni", "Chopra", "Chhabra", "Talwar", "Ahuja", "Arora"
    };

    public DataInitializer(
            UserRepository userRepository,
            PassengerRepository passengerRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate
    ) {
        this.userRepository = userRepository;
        this.passengerRepository = passengerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        initializeAdminAccount();
        initializeSyntheticPassengers();
    }

    private void initializeAdminAccount() {
        if (!userRepository.existsByEmail(adminEmail.trim().toLowerCase())) {
            String encodedPassword = passwordEncoder.encode(adminPassword);
            User admin = new User(adminEmail.trim().toLowerCase(), encodedPassword, "ADMIN", "ACTIVE");
            userRepository.save(admin);
            logger.info("Admin account initialized successfully with email: {}", adminEmail);
        } else {
            logger.info("Admin account already exists ({}), skipping creation.", adminEmail);
        }
    }

    private void initializeSyntheticPassengers() {
        long currentTotalPassengers = passengerRepository.count();
        if (currentTotalPassengers >= targetPassengerCount) {
            logger.info("Database already contains {} passenger records (target: {}). Skipping synthetic generation.",
                    currentTotalPassengers, targetPassengerCount);
            return;
        }

        logger.info("Starting synthetic passenger initialization. Target count: {}", targetPassengerCount);

        // Fetch existing synthetic emails to avoid any duplicates and make generation fully restart-safe
        List<String> existingEmails = jdbcTemplate.query(
                "SELECT email FROM users WHERE email LIKE 'passenger%@railwaydemo.com'",
                (rs, rowNum) -> rs.getString("email")
        );
        Set<Integer> existingIndices = new HashSet<>();
        for (String email : existingEmails) {
            try {
                int prefixIndex = email.indexOf("passenger");
                int atIndex = email.indexOf("@railwaydemo.com");
                if (prefixIndex == 0 && atIndex > 9) {
                    String numStr = email.substring(9, atIndex);
                    existingIndices.add(Integer.parseInt(numStr));
                }
            } catch (Exception ignored) {
            }
        }

        List<Integer> missingIndices = new ArrayList<>();
        for (int i = 1; i <= targetPassengerCount; i++) {
            if (!existingIndices.contains(i)) {
                missingIndices.add(i);
            }
        }

        if (missingIndices.isEmpty()) {
            logger.info("All {} synthetic passenger records already exist. Initialization skipped.", targetPassengerCount);
            return;
        }

        logger.info("Identified {} missing synthetic passenger records to generate.", missingIndices.size());

        // Pre-compute one secure BCrypt hash for all demo accounts to optimize startup performance
        String demoPasswordHash = passwordEncoder.encode("Passenger@123");

        int processed = 0;
        int totalToGenerate = missingIndices.size();

        for (int i = 0; i < totalToGenerate; i += batchSize) {
            int endIndex = Math.min(i + batchSize, totalToGenerate);
            List<Integer> currentBatchIndices = missingIndices.subList(i, endIndex);

            insertBatch(currentBatchIndices, demoPasswordHash);
            processed += currentBatchIndices.size();

            logger.info("Generated {}/{} passengers", processed, targetPassengerCount);
        }

        logger.info("Passenger data initialization completed. Total database passengers: {}", passengerRepository.count());
    }

    @Transactional
    protected void insertBatch(List<Integer> batchIndices, String passwordHash) {
        List<Object[]> userArgs = new ArrayList<>(batchIndices.size());
        List<String> batchEmails = new ArrayList<>(batchIndices.size());

        for (int index : batchIndices) {
            String email = String.format("passenger%05d@railwaydemo.com", index);
            userArgs.add(new Object[]{ email, passwordHash, "PASSENGER", "ACTIVE" });
            batchEmails.add(email);
        }

        // 1. Batch insert users
        jdbcTemplate.batchUpdate(
                "INSERT INTO users (email, password_hash, role, status, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                userArgs
        );

        // 2. Fetch the generated user IDs for this batch
        String inPlaceholders = String.join(",", Collections.nCopies(batchEmails.size(), "?"));
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT user_id, email FROM users WHERE email IN (" + inPlaceholders + ")",
                batchEmails.toArray()
        );

        Map<String, Long> emailToUserId = new HashMap<>(rows.size());
        for (Map<String, Object> row : rows) {
            String email = (String) row.get("email");
            Long userId = ((Number) row.get("user_id")).longValue();
            emailToUserId.put(email, userId);
        }

        // 3. Batch insert passengers
        List<Object[]> passengerArgs = new ArrayList<>(batchIndices.size());
        for (int index : batchIndices) {
            String email = String.format("passenger%05d@railwaydemo.com", index);
            Long userId = emailToUserId.get(email);
            if (userId != null) {
                String fullName = generateFullName(index);
                String mobile = generateMobile(index);
                passengerArgs.add(new Object[]{ userId, fullName, mobile });
            }
        }

        jdbcTemplate.batchUpdate(
                "INSERT INTO passengers (user_id, full_name, mobile, created_at, updated_at) " +
                        "VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                passengerArgs
        );
    }

    private String generateFullName(int index) {
        String first = FIRST_NAMES[index % FIRST_NAMES.length];
        String last = LAST_NAMES[(index / FIRST_NAMES.length) % LAST_NAMES.length];
        return first + " " + last;
    }

    private String generateMobile(int index) {
        // Valid 10-digit mobile starting with 98xxxxxx
        return String.format("98%08d", index);
    }
}
