package com.example.aqualink.controller;

import com.example.aqualink.dto.*;
import com.example.aqualink.entity.Role;
import com.example.aqualink.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/user-management")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) String verificationStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        try {
            UserFilterDTO filterDTO = new UserFilterDTO();
            filterDTO.setSearch(search);
            filterDTO.setRole(role);
            filterDTO.setActive(active);
            filterDTO.setEnabled(enabled);
            filterDTO.setVerificationStatus(verificationStatus);
            filterDTO.setPage(page);
            filterDTO.setSize(size);
            filterDTO.setSortBy(sortBy);
            filterDTO.setSortDirection(sortDirection);

            Page<UserManagementDTO> users = userManagementService.getAllUsers(filterDTO);

            Map<String, Object> response = Map.of(
                    "users", users.getContent(),
                    "currentPage", users.getNumber(),
                    "totalItems", users.getTotalElements(),
                    "totalPages", users.getTotalPages()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching users", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDetailDTO> getUserById(@PathVariable Long id) {
        try {
            UserDetailDTO user = userManagementService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Error fetching user with id: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching user details", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserManagementDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDTO updateDTO
    ) {
        try {
            UserManagementDTO updated = userManagementService.updateUser(id, updateDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating user with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating user", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userManagementService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting user with id: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting user", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<UserManagementDTO> toggleUserStatus(@PathVariable Long id) {
        try {
            UserManagementDTO updated = userManagementService.toggleUserStatus(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error toggling status for user with id: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error toggling user status", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<UserManagementDTO> addRoleToUser(
            @PathVariable Long id,
            @Valid @RequestBody RoleAssignmentDTO roleAssignmentDTO
    ) {
        try {
            UserManagementDTO updated = userManagementService.addRoleToUser(id, roleAssignmentDTO.getRole());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error adding role to user with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error adding role to user", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}/roles/{role}")
    public ResponseEntity<UserManagementDTO> removeRoleFromUser(
            @PathVariable Long id,
            @PathVariable Role role
    ) {
        try {
            UserManagementDTO updated = userManagementService.removeRoleFromUser(id, role);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error removing role from user with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error removing role from user", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetUserPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            String newPassword = request.get("newPassword");
            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            userManagementService.resetUserPassword(id, newPassword);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error resetting password for user with id: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error resetting user password", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/bulk-update-status")
    public ResponseEntity<Void> bulkUpdateStatus(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> userIds = (List<Long>) request.get("userIds");
            Boolean enabled = (Boolean) request.get("enabled");

            if (userIds == null || userIds.isEmpty() || enabled == null) {
                return ResponseEntity.badRequest().build();
            }

            userManagementService.bulkUpdateStatus(userIds, enabled);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error in bulk update status", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        try {
            Map<String, Object> statistics = userManagementService.getUserStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error fetching user statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
