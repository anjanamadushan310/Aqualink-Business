package com.example.aqualink.repository;

import com.example.aqualink.entity.BlogPost;
import com.example.aqualink.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    
    Page<BlogPost> findByPublishedTrue(Pageable pageable);
    
    Page<BlogPost> findByPublishedFalse(Pageable pageable);
    
    Page<BlogPost> findByAuthorAndPublishedTrue(User author, Pageable pageable);
    
    Page<BlogPost> findByAuthor(User author, Pageable pageable);
    
    @Query("SELECT b FROM BlogPost b WHERE " +
           "(b.published = true) AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(b.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(b.summary) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<BlogPost> searchPublishedPosts(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM BlogPost b WHERE b.author = :user")
    long countByAuthor(@Param("user") User user);
    
    boolean existsByTitleAndAuthor(String title, User author);
}