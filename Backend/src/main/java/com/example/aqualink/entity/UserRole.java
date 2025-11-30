//package com.example.aqualink.entity;
//
//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.time.LocalDateTime;
//
//@Entity
//@Data
//@AllArgsConstructor
//@NoArgsConstructor
//@Table(name = "user_roles")
//public class UserRole {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @Enumerated(EnumType.STRING)
//    @Column(name = "role_name", nullable = false, length = 50) // Add length specification
//    private Role roleName;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id", nullable = false)
//    private User user;
//
//    @Column(name = "created_at")
//    private LocalDateTime createdAt;
//
//    @PrePersist
//    protected void onCreate() {
//        createdAt = LocalDateTime.now();
//    }
//}

package com.example.aqualink.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_roles")
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false, length = 50)
    private Role roleName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "has_badge")
    private Boolean hasBadge = false;

    @Column(name = "badge_earned_date")
    private LocalDateTime badgeEarnedDate;

    @Column(name = "badge_criteria_met")
    private String badgeCriteriaMet; // What criteria was met to earn the badge

    // Document paths for role-specific verification
    @Column(name = "nic_front_document_path")
    private String nicFrontDocumentPath;

    @Column(name = "nic_back_document_path")
    private String nicBackDocumentPath;

    @Column(name = "selfie_document_path")
    private String selfieDocumentPath;

    // Verification status for this specific role
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Method to award badge
    public void awardBadge(String criteria) {
        this.hasBadge = true;
        this.badgeEarnedDate = LocalDateTime.now();
        this.badgeCriteriaMet = criteria;
    }

    // Method to remove badge
    public void removeBadge() {
        this.hasBadge = false;
        this.badgeEarnedDate = null;
        this.badgeCriteriaMet = null;
    }
}
