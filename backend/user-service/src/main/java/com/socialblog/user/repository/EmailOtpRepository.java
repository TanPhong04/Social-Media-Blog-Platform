package com.socialblog.user.repository;

import com.socialblog.user.domain.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, UUID> {
    Optional<EmailOtp> findFirstByEmailAndUsedFalseOrderByExpiresAtDesc(String email);
}
