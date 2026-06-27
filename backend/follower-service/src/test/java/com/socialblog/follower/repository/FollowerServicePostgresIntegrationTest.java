package com.socialblog.follower.repository;

import com.socialblog.follower.domain.Follow;
import com.socialblog.follower.domain.OutboxEvent;
import com.socialblog.follower.domain.UserProjection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
@EnabledIf(value = "postgresTestcontainersEnabled", disabledReason = "PostgreSQL Testcontainers tests are opt-in and require a valid Docker engine")
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FollowerServicePostgresIntegrationTest {
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
    @Autowired FollowRepository follows;
    @Autowired UserProjectionRepository users;
    @Autowired OutboxEventRepository outboxEvents;

    @Test
    void flywayMigrationCreatesExpectedTablesIndexesAndConstraints() {
        assertThat(tableExists("user_projection")).isTrue();
        assertThat(tableExists("follows")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(tableExists("processed_events")).isTrue();
        assertThat(indexExists("idx_follows_follower")).isTrue();
        assertThat(indexExists("idx_follows_followed")).isTrue();
        assertThat(indexExists("idx_follower_outbox_pending")).isTrue();
        assertThat(constraintExists("uk_follow_pair")).isTrue();
        assertThat(constraintExists("ck_no_self_follow")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(1);
    }

    @Test
    void repositoriesUsePostgresConstraintsProjectionAndNativeOutboxClaiming() {
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();
        users.saveAndFlush(new UserProjection(followerId, true, "Follower"));
        users.saveAndFlush(new UserProjection(followedId, true, "Followed"));

        assertThat(users.existsByIdAndActiveTrue(followedId)).isTrue();

        follows.saveAndFlush(new Follow(followerId, followedId));

        assertThat(follows.existsByFollowerIdAndFollowedId(followerId, followedId)).isTrue();
        assertThat(follows.findByFollowerIdOrderByCreatedAtDesc(followerId, PageRequest.of(0, 10)))
                .extracting(Follow::getFollowedId)
                .containsExactly(followedId);
        assertThat(follows.countByFollowerId(followerId)).isEqualTo(1);
        assertThat(follows.countByFollowedId(followedId)).isEqualTo(1);

        UUID olderAggregateId = UUID.randomUUID();
        UUID newerAggregateId = UUID.randomUUID();
        outboxEvents.saveAndFlush(event(olderAggregateId, Instant.now().minusSeconds(10)));
        outboxEvents.saveAndFlush(event(newerAggregateId, Instant.now()));

        List<OutboxEvent> claimed = outboxEvents.lockPendingBatch(10);

        assertThat(claimed).extracting(OutboxEvent::getAggregateId).containsSequence(olderAggregateId, newerAggregateId);
        assertThat(outboxEvents.countByStatus(OutboxEvent.Status.PENDING)).isEqualTo(2);

        assertThatThrownBy(() -> follows.saveAndFlush(new Follow(followerId, followedId)))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
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

    private boolean constraintExists(String constraintName) {
        Integer count = jdbc.queryForObject("""
                select count(*)
                from information_schema.table_constraints
                where table_schema = 'public' and constraint_name = ?
                """, Integer.class, constraintName);
        return count != null && count == 1;
    }

    private OutboxEvent event(UUID aggregateId, Instant occurredAt) {
        return new OutboxEvent(
                UUID.randomUUID(),
                aggregateId,
                "UserFollowed",
                "{}",
                occurredAt
        );
    }
}
