package com.socialblog.user.repository;
import com.socialblog.user.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserRepository extends JpaRepository<UserAccount, UUID> { Optional<UserAccount> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); }

