package com.example.aqualink.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.aqualink.entity.ActiveStatus;
import com.example.aqualink.entity.Fish;

@Repository
public interface FishRepository extends JpaRepository<Fish, Long> {

    List<Fish> findByActiveStatus(ActiveStatus activeStatus);

    @Query("SELECT f FROM Fish f ORDER BY f.createDateAndTime DESC")
    List<Fish> findAllByOrderByCreateDateAndTimeDesc();

    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.activeStatus = 'VERIFIED' AND f.stock > 0")
    List<Fish> findAvailableFishWithProfile();

    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.activeStatus = 'VERIFIED' AND f.stock > 0")
    List<Fish> findAvailableFish();

    List<Fish> findByNameContainingIgnoreCase(String name);

    //@Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.id = :id")
    //Optional<Fish> findByIdWithProfile(@Param("id") Long id);

    // FIX THIS QUERY: use user.id instead of userProfile.user.id
    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.user.id = :userId")
    List<Fish> findByUserIdWithProfile(@Param("userId") Long userId);

    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.id = :id")
    Optional<Fish> findByIdWithProfile(@Param("id") Long id);

    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user WHERE f.id = :id")
    Optional<Fish> findByIdWithUser(@Param("id") Long id);

    // If you need to fetch user and their profile together
    @Query("SELECT f FROM Fish f LEFT JOIN FETCH f.user u LEFT JOIN FETCH u.userProfile WHERE f.id = :id")
    Optional<Fish> findByIdWithUserAndProfile(@Param("id") Long id);

    boolean existsByNameAndUserId(String name, Long userId);
}