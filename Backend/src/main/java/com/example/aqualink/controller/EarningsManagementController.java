package com.example.aqualink.controller;

import com.example.aqualink.dto.EarningsFilterDTO;
import com.example.aqualink.dto.EarningsStatisticsDTO;
import com.example.aqualink.dto.EarningsTransactionDTO;
import com.example.aqualink.service.EarningsManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/earnings-management")
@PreAuthorize("hasRole(''ADMIN'')")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class EarningsManagementController {

    private final EarningsManagementService earningsManagementService;

    @PostMapping("/list")
    public ResponseEntity<Page<EarningsTransactionDTO>> getAllTransactions(
            @RequestBody(required = false) EarningsFilterDTO filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching earnings transactions - page: {}, size: {}", page, size);
        
        if (filter == null) {
            filter = new EarningsFilterDTO();
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<EarningsTransactionDTO> transactions = earningsManagementService.getAllTransactions(filter, pageable);
        
        log.info("Retrieved {} transactions", transactions.getTotalElements());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/statistics")
    public ResponseEntity<EarningsStatisticsDTO> getStatistics() {
        log.info("Fetching earnings statistics");
        EarningsStatisticsDTO statistics = earningsManagementService.getEarningsStatistics();
        return ResponseEntity.ok(statistics);
    }
}