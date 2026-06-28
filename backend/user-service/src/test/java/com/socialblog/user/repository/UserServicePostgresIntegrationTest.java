package com.socialblog.user.repository;

import com.socialblog.user.domain.OutboxEvent;
import com.socialblog.user.domain.RefreshToken;
import com.socialblog.user.domain.UserAccount;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@EnabledIf(value = "postgresTestcontainersEnabled", disabledReason = "PostgreSQL Testcontainers tests are opt-in and require a valid Docker engine")
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserServicePostgresIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    static boolean postgresTestcontainersEnabled() {
        return Boolean.getBoolean("socialblog.testcontainers.enabled") && DockerClientFactory.instance().isDockerAvailable();
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired OutboxEventRepository outboxEvents;

    @Test
    void flywayMigrationsCreateExpectedTablesAndIndexes() {
        assertThat(tableExists("users")).isTrue();
        assertThat(tableExists("refresh_tokens")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(indexExists("idx_refresh_tokens_user_id")).isTrue();
        assertThat(indexExists("idx_outbox_events_pending")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(2);
    }

    @Test
    void repositoriesUsePostgresConstraintsAndNativeOutboxClaiming() {
        UserAccount user = users.saveAndFlush(new UserAccount("Alice@Example.com", "hash", "Alice"));

        assertThat(users.existsByEmailIgnoreCase("alice@example.com")).isTrue();
        assertThat(users.findByEmailIgnoreCase("ALICE@example.com")).contains(user);

        RefreshToken refreshToken = refreshTokens.saveAndFlush(
                new RefreshToken(user.getId(), "token-hash", Instant.now().plusSeconds(3600))
        );
        assertThat(refreshTokens.findByTokenHash("token-hash")).contains(refreshToken);

        UUID aggregateId = user.getId();
        OutboxEvent older = outboxEvents.saveAndFlush(event(aggregateId, Instant.now().minusSeconds(10)));
        OutboxEvent newer = outboxEvents.saveAndFlush(event(aggregateId, Instant.now()));

        List<OutboxEvent> claimed = outboxEvents.lockPendingBatch(10);

        assertThat(claimed).extracting(OutboxEvent::getId).containsExactly(older.getId(), newer.getId());
        assertThat(outboxEvents.countByStatus(OutboxEvent.Status.PENDING)).isEqualTo(2);

        users.delete(user);
        users.flush();
        assertThat(refreshTokens.findByTokenHash("token-hash")).isEmpty();
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbc.queryForObject("""
                select count(*)
                from information_schema.tables
                where table_schema = 'public' and table_name = ?
                """, Integer.class, tableName);
        return count != null && count == 1;
    }

    private boolean indexExists(String indexName) {
        Integer count = jdbc.queryForObject("""
                select count(*)
                from pg_indexes
                where schemaname = 'public' and indexname = ?
                """, Integer.class, indexName);
        return count != null && count == 1;
    }

    private OutboxEvent event(UUID aggregateId, Instant occurredAt) {
        return new OutboxEvent(
                UUID.randomUUID(),
                "User",
                aggregateId,
                "UserRegistered",
                1,
                "{}",
                occurredAt
        );
    }
}
