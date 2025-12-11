package com.example.aqualink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UserDetailDTO extends UserManagementDTO {
    private String businessType;
    private String address;
    private String nicFrontPath;
    private String nicBackPath;
    private String selfiePath;
    private List<RoleDetailInfo> roleDetails;
    private long orderCount;
    private long reviewCount;
    private long accountAgeDays;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDetailInfo {
        private String role;
        private String badge;
        private String verificationStatus;
    }
}
