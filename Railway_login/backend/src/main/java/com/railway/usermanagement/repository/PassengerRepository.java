package com.railway.usermanagement.repository;

import com.railway.usermanagement.entity.Passenger;
import com.railway.usermanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {

    /**
     * Find passenger profile by User entity.
     *
     * @param user Associated User entity
     * @return Optional containing Passenger profile
     */
    Optional<Passenger> findByUser(User user);

    /**
     * Find passenger profile by User ID foreign key.
     *
     * @param userId Associated user_id
     * @return Optional containing Passenger profile
     */
    Optional<Passenger> findByUser_UserId(Long userId);

    /**
     * Find passenger profile by mobile number.
     *
     * @param mobile Passenger contact mobile
     * @return Optional containing Passenger profile
     */
    Optional<Passenger> findByMobile(String mobile);

    /**
     * Check if a passenger exists with the given mobile number.
     *
     * @param mobile Mobile number to check
     * @return true if exists, false otherwise
     */
    boolean existsByMobile(String mobile);

    /**
     * Server-side paginated search matching passengerId, fullName, email, or mobile.
     *
     * @param search keyword to search
     * @param pageable pagination parameters
     * @return Page of matching Passenger records
     */
    @Query("SELECT p FROM Passenger p JOIN p.user u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "CAST(p.passengerId AS string) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "p.mobile LIKE CONCAT('%', :search, '%'))")
    Page<Passenger> searchPassengers(@Param("search") String search, Pageable pageable);

    /**
     * Server-side paginated search with specific parameterized filters.
     *
     * @param passengerId optional passenger ID
     * @param fullName optional passenger full name
     * @param email optional user email
     * @param mobile optional mobile number
     * @param pageable pagination parameters
     * @return Page of matching Passenger records
     */
    @Query("SELECT p FROM Passenger p JOIN p.user u WHERE " +
           "(:passengerId IS NULL OR p.passengerId = :passengerId) AND " +
           "(:fullName IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
           "(:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:mobile IS NULL OR p.mobile LIKE CONCAT('%', :mobile, '%'))")
    Page<Passenger> findByFilters(
            @Param("passengerId") Long passengerId,
            @Param("fullName") String fullName,
            @Param("email") String email,
            @Param("mobile") String mobile,
            Pageable pageable);
}

