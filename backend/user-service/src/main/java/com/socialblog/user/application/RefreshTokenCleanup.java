package com.socialblog.user.application;
import com.socialblog.user.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
@Component
public class RefreshTokenCleanup {
    private final RefreshTokenRepository tokens; private final long retentionDays;
    public RefreshTokenCleanup(RefreshTokenRepository tokens,@Value("${app.security.revoked-token-retention-days:7}") long retentionDays){this.tokens=tokens;this.retentionDays=retentionDays;}
    @Scheduled(cron="${app.security.refresh-cleanup-cron:0 0 3 * * *}") @Transactional
    public void cleanup(){Instant now=Instant.now();tokens.deleteExpiredAndOldRevoked(now,now.minus(Duration.ofDays(retentionDays)));}
}
