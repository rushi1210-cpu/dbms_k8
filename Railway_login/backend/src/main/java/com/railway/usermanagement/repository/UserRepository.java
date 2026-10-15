package com.railway.usermanagement.repository;

import com.railway.usermanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their unique login email.
     *
     * @param email user login email
     * @return Optional containing the User if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user exists with the given email.
     *
     * @param email user email to check
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Count users by status (e.g. ACTIVE or INACTIVE).
     *
     * @param status account status
     * @return count of matching users
     */
    long countByStatusIgnoreCase(String status);

    /**
     * Count users by role (e.g. PASSENGER or ADMIN).
     *
     * @param role user role
     * @return count of matching users
     */
    long countByRoleIgnoreCase(String role);
}

