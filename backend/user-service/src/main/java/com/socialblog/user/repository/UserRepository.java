package com.socialblog.user.repository;
import com.socialblog.user.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByStatus(UserAccount.Status status);
    long countByCreatedAtAfter(java.time.Instant date);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID id);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserAccount u WHERE u.status = 'ACTIVE' AND (LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<UserAccount> searchActiveUsers(@org.springframework.data.repository.query.Param("query") String query, org.springframework.data.domain.Pageable pageable);
}

