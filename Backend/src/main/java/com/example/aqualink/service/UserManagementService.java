package com.example.aqualink.service;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.Role;
import com.example.aqualink.entity.User;
import com.example.aqualink.entity.UserRole;
import com.example.aqualink.entity.VerificationStatus;
import com.example.aqualink.repository.OrderRepository;
import com.example.aqualink.repository.ProductReviewRepository;
import com.example.aqualink.repository.UserRepository;
import com.example.aqualink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final OrderRepository orderRepository;
    private final ProductReviewRepository productReviewRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserManagementDTO> getAllUsers(UserFilterDTO filterDTO) {
        Sort sort = Sort.by(
                filterDTO.getSortDirection().equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC,
                filterDTO.getSortBy()
        );
        Pageable pageable = PageRequest.of(filterDTO.getPage(), filterDTO.getSize(), sort);

        Page<User> users;

        if (filterDTO.getSearch() != null && !filterDTO.getSearch().isEmpty()) {
            VerificationStatus verificationStatus = filterDTO.getVerificationStatus() != null ? 
                VerificationStatus.valueOf(filterDTO.getVerificationStatus()) : null;
            users = userRepository.searchAndFilter(
                    filterDTO.getSearch(),
                    filterDTO.getRole(),
                    filterDTO.getActive(),
                    filterDTO.getEnabled(),
                    verificationStatus,
                    pageable
            );
        } else if (filterDTO.getRole() != null || filterDTO.getActive() != null ||
                filterDTO.getEnabled() != null || filterDTO.getVerificationStatus() != null) {
            VerificationStatus verificationStatus = filterDTO.getVerificationStatus() != null ? 
                VerificationStatus.valueOf(filterDTO.getVerificationStatus()) : null;
            users = userRepository.findByFilters(
                    filterDTO.getRole(),
                    filterDTO.getActive(),
                    filterDTO.getEnabled(),
                    verificationStatus,
                    pageable
            );
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::convertToManagementDTO);
    }

    public UserDetailDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDetailDTO(user);
    }

    @Transactional
    public UserManagementDTO updateUser(Long id, UserUpdateDTO updateDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check email uniqueness if changed
        if (!user.getEmail().equals(updateDTO.getEmail())) {
            if (userRepository.existsByEmail(updateDTO.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(updateDTO.getEmail());
        }

        user.setName(updateDTO.getName());
        user.setPhoneNumber(updateDTO.getPhoneNumber());
        
        if (updateDTO.getEnabled() != null) {
            user.setEnabled(updateDTO.getEnabled());
        }
        if (updateDTO.getActive() != null) {
            user.setActive(updateDTO.getActive());
        }

        User saved = userRepository.save(user);
        return convertToManagementDTO(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Soft delete
        user.setEnabled(false);
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public UserManagementDTO toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setEnabled(!user.isEnabled());
        User saved = userRepository.save(user);
        return convertToManagementDTO(saved);
    }

    @Transactional
    public UserManagementDTO addRoleToUser(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Check if role already exists
        boolean hasRole = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRoleName() == role);

        if (hasRole) {
            throw new RuntimeException("User already has this role");
        }

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRoleName(role);
        userRole.setVerificationStatus(VerificationStatus.PENDING);
        userRoleRepository.save(userRole);

        user.getUserRoles().add(userRole);
        return convertToManagementDTO(user);
    }

    @Transactional
    public UserManagementDTO removeRoleFromUser(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserRole userRole = user.getUserRoles().stream()
                .filter(ur -> ur.getRoleName() == role)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User does not have this role"));

        user.getUserRoles().remove(userRole);
        userRoleRepository.delete(userRole);

        return convertToManagementDTO(user);
    }

    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void bulkUpdateStatus(List<Long> userIds, boolean enabled) {
        List<User> users = userRepository.findAllById(userIds);
        users.forEach(user -> user.setEnabled(enabled));
        userRepository.saveAll(users);
    }

    public Map<String, Object> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActiveTrue();
        long inactiveUsers = userRepository.countByActiveFalse();
        long enabledUsers = userRepository.countByEnabledTrue();
        long disabledUsers = userRepository.countByEnabledFalse();

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("enabledUsers", enabledUsers);
        stats.put("disabledUsers", disabledUsers);

        // Count by role
        Map<String, Long> roleStats = new HashMap<>();
        for (Role role : Role.values()) {
            roleStats.put(role.name(), userRepository.countByRole(role));
        }
        stats.put("byRole", roleStats);

        return stats;
    }

    private UserManagementDTO convertToManagementDTO(User user) {
        UserManagementDTO dto = new UserManagementDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setActive(user.isActive());
        dto.setEnabled(user.isEnabled());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getUserProfile() != null) {
            dto.setLogoUrl(user.getUserProfile().getLogoPath());
            dto.setBusinessName(user.getUserProfile().getBusinessName());
            dto.setDistrict(user.getUserProfile().getAddressDistrict());
            dto.setTown(user.getUserProfile().getAddressTown());
        }

        // Get verification status from first role (or use a default logic)
        user.getUserRoles().stream()
                .findFirst()
                .ifPresent(ur -> dto.setVerificationStatus(ur.getVerificationStatus().name()));

        List<String> roles = user.getUserRoles().stream()
                .map(ur -> ur.getRoleName().name())
                .collect(Collectors.toList());
        dto.setRoles(roles);

        return dto;
    }

    private UserDetailDTO convertToDetailDTO(User user) {
        UserDetailDTO dto = new UserDetailDTO();
        
        // Set base fields
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setActive(user.isActive());
        dto.setEnabled(user.isEnabled());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getUserProfile() != null) {
            dto.setLogoUrl(user.getUserProfile().getLogoPath());
            dto.setBusinessName(user.getUserProfile().getBusinessName());
            dto.setDistrict(user.getUserProfile().getAddressDistrict());
            dto.setTown(user.getUserProfile().getAddressTown());
            dto.setBusinessType(user.getUserProfile().getBusinessType());
            dto.setAddress(user.getUserProfile().getAddressPlace() + ", " + user.getUserProfile().getAddressStreet());
        }

        // Get verification status from first role
        user.getUserRoles().stream()
                .findFirst()
                .ifPresent(ur -> dto.setVerificationStatus(ur.getVerificationStatus().name()));

        List<String> roles = user.getUserRoles().stream()
                .map(ur -> ur.getRoleName().name())
                .collect(Collectors.toList());
        dto.setRoles(roles);

        // Role details with document paths from UserRole
        List<UserDetailDTO.RoleDetailInfo> roleDetails = user.getUserRoles().stream()
                .map(ur -> {
                    UserDetailDTO.RoleDetailInfo info = new UserDetailDTO.RoleDetailInfo();
                    info.setRole(ur.getRoleName().name());
                    info.setBadge(ur.getHasBadge() != null && ur.getHasBadge() ? "EARNED" : "NOT_EARNED");
                    info.setVerificationStatus(ur.getVerificationStatus().name());
                    return info;
                })
                .collect(Collectors.toList());
        dto.setRoleDetails(roleDetails);

        // Set NIC and selfie paths from first UserRole with documents
        user.getUserRoles().stream()
                .filter(ur -> ur.getNicFrontDocumentPath() != null)
                .findFirst()
                .ifPresent(ur -> {
                    dto.setNicFrontPath(ur.getNicFrontDocumentPath());
                    dto.setNicBackPath(ur.getNicBackDocumentPath());
                    dto.setSelfiePath(ur.getSelfieDocumentPath());
                });

        // Statistics
        dto.setOrderCount(orderRepository.countByUserEmail(user.getEmail()));
        dto.setReviewCount(productReviewRepository.countByUserEmail(user.getEmail()));
        
        if (user.getCreatedAt() != null) {
            dto.setAccountAgeDays(ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now()));
        }

        return dto;
    }
}
