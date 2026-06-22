package com.socialblog.user.repository;
import com.socialblog.user.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    @Modifying @Query("delete from RefreshToken t where t.expiresAt < :now or (t.revokedAt is not null and t.revokedAt < :revokedBefore)")
    int deleteExpiredAndOldRevoked(@Param("now") Instant now,@Param("revokedBefore") Instant revokedBefore);
}
