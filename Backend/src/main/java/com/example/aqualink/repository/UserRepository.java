package com.example.aqualink.repository;

import com.example.aqualink.entity.Role;
import com.example.aqualink.entity.User;
import com.example.aqualink.entity.UserProfile;
import com.example.aqualink.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    boolean existsByNicNumber(String nicNumber);

    // Get all users ordered by ID
    List<User> findAllByOrderByIdAsc();

    // Get active users only
    List<User> findByActiveTrue();

    // Get inactive users only
    List<User> findByActiveFalse();

    // Find user by email for login
    Optional<User> findByEmail(String email);

    // Find active user by email
    Optional<User> findByEmailAndActiveTrue(String email);

    // Find user by NIC number
    Optional<User> findByNicNumber(String nicNumber);
    
    // Find active user by NIC number
    Optional<User> findByNicNumberAndActiveTrue(String nicNumber);

    // New method to fetch user with roles eagerly
    @EntityGraph(attributePaths = {"userRoles"})
    Optional<User> findWithRolesByEmail(String email);

    // Admin verification methods
    List<User> findByActiveFalseOrderByCreatedAtDesc();
    
    List<User> findByActiveTrueOrderByCreatedAtDesc();
    
    List<User> findAllByOrderByCreatedAtDesc();
    
    // Find users by verification status
    List<User> findByVerificationStatusOrderByCreatedAtDesc(VerificationStatus verificationStatus);
    
    // Find users with null verification status (for backward compatibility)
    List<User> findByVerificationStatusIsNullAndActiveFalseOrderByCreatedAtDesc();
    
    List<User> findByVerificationStatusIsNullAndActiveTrueOrderByCreatedAtDesc();
    
    // Find all users with null verification status
    List<User> findByVerificationStatusIsNull();

    // Count methods for verification stats
    long countByVerificationStatus(VerificationStatus verificationStatus);
    long countByVerificationStatusIsNull();
    
    // ===== USER MANAGEMENT QUERIES =====
    
    // Pagination support
    Page<User> findAll(Pageable pageable);
    
    // Search by name or email
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.nicNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Filter by role
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur WHERE ur.roleName = :role")
    Page<User> findByRole(@Param("role") Role role, Pageable pageable);
    
    // Combined filter with role and status
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur WHERE " +
           "(:role IS NULL OR ur.roleName = :role) AND " +
           "(:active IS NULL OR u.active = :active) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled) AND " +
           "(:verificationStatus IS NULL OR u.verificationStatus = :verificationStatus)")
    Page<User> findByFilters(
        @Param("role") Role role,
        @Param("active") Boolean active,
        @Param("enabled") Boolean enabled,
        @Param("verificationStatus") VerificationStatus verificationStatus,
        Pageable pageable
    );
    
    // Combined filter with search
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.userRoles ur WHERE " +
           "(:searchTerm IS NULL OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.nicNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:role IS NULL OR ur.roleName = :role) AND " +
           "(:active IS NULL OR u.active = :active) AND " +
           "(:enabled IS NULL OR u.enabled = :enabled) AND " +
           "(:verificationStatus IS NULL OR u.verificationStatus = :verificationStatus)")
    Page<User> searchAndFilter(
        @Param("searchTerm") String searchTerm,
        @Param("role") Role role,
        @Param("active") Boolean active,
        @Param("enabled") Boolean enabled,
        @Param("verificationStatus") VerificationStatus verificationStatus,
        Pageable pageable
    );
    
    // Date range queries
    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    // Count by role
    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.userRoles ur WHERE ur.roleName = :role")
    long countByRole(@Param("role") Role role);
    
    // Count active users
    long countByActiveTrue();
    long countByActiveFalse();
    long countByEnabledTrue();
    long countByEnabledFalse();
}