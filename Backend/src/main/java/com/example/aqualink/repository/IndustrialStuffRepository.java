package com.example.aqualink.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.aqualink.entity.ActiveStatus;
import com.example.aqualink.entity.IndustrialStuff;

@Repository
public interface IndustrialStuffRepository extends JpaRepository<IndustrialStuff, Long> {

    List<IndustrialStuff> findByActiveStatus(ActiveStatus activeStatus);

    @Query("SELECT i FROM IndustrialStuff i ORDER BY i.createDateAndTime DESC")
    List<IndustrialStuff> findAllByOrderByCreateDateAndTimeDesc();

    @Query("SELECT i FROM IndustrialStuff i LEFT JOIN FETCH i.user WHERE i.activeStatus = 'VERIFIED' AND i.stock > 0")
    List<IndustrialStuff> findAvailableIndustrialWithProfile();

    List<IndustrialStuff> findByNameContainingIgnoreCase(String name);
    List<IndustrialStuff> findByCategoryContainingIgnoreCase(String category);

    @Query("SELECT i FROM IndustrialStuff i LEFT JOIN FETCH i.user WHERE i.user.id = :userId")
    List<IndustrialStuff> findByUserIdWithProfile(@Param("userId") Long userId);

    @Query("SELECT i FROM IndustrialStuff i LEFT JOIN FETCH i.user WHERE i.id = :id")
    Optional<IndustrialStuff> findByIdWithProfile(@Param("id") Long id);

    boolean existsByNameAndUserId(String name, Long userId);
}
