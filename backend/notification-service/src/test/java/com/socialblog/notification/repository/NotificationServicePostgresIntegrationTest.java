package com.socialblog.notification.repository;

import com.socialblog.notification.domain.FollowKey;
import com.socialblog.notification.domain.FollowProjection;
import com.socialblog.notification.domain.Notification;
import com.socialblog.notification.domain.ProcessedEvent;
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
class NotificationServicePostgresIntegrationTest {
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
    @Autowired NotificationRepository notifications;
    @Autowired FollowProjectionRepository follows;
    @Autowired ProcessedEventRepository processedEvents;

    @Test
    void flywayMigrationCreatesExpectedTablesIndexesAndConstraints() {
        assertThat(tableExists("notifications")).isTrue();
        assertThat(tableExists("follow_projection")).isTrue();
        assertThat(tableExists("processed_events")).isTrue();
        assertThat(indexExists("idx_notifications_recipient_created")).isTrue();
        assertThat(indexExists("idx_notifications_unread")).isTrue();
        assertThat(indexExists("idx_notification_followed")).isTrue();
        assertThat(constraintExists("uk_notification_event_recipient")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(1);
    }

    @Test
    void repositoriesUsePostgresUniquenessInboxUpdatesAndFollowProjection() {
        UUID recipientId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID sourceEventId = UUID.randomUUID();
        Notification older = notifications.saveAndFlush(notification(sourceEventId, recipientId, actorId, Instant.now().minusSeconds(10)));
        Notification newer = notifications.saveAndFlush(notification(UUID.randomUUID(), recipientId, actorId, Instant.now()));

        assertThat(notifications.findByRecipientIdOrderByCreatedAtDesc(recipientId, PageRequest.of(0, 10)))
                .extracting(Notification::getId)
                .containsSequence(newer.getId(), older.getId());
        assertThat(notifications.countByRecipientIdAndReadAtIsNull(recipientId)).isEqualTo(2);
        assertThat(notifications.findByIdAndRecipientId(older.getId(), recipientId)).contains(older);

        assertThat(notifications.markAllRead(recipientId, Instant.now())).isEqualTo(2);
        assertThat(notifications.countByRecipientIdAndReadAtIsNull(recipientId)).isZero();

        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();
        follows.saveAndFlush(new FollowProjection(new FollowKey(followerId, followedId)));
        assertThat(follows.findByIdFollowedId(followedId))
                .extracting(follow -> follow.getId().followerId())
                .containsExactly(followerId);

        UUID processedEventId = UUID.randomUUID();
        processedEvents.saveAndFlush(new ProcessedEvent(processedEventId, "UserFollowed"));
        assertThat(processedEvents.existsById(processedEventId)).isTrue();

        assertThatThrownBy(() -> notifications.saveAndFlush(notification(sourceEventId, recipientId, UUID.randomUUID(), Instant.now())))
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

    private Notification notification(UUID sourceEventId, UUID recipientId, UUID actorId, Instant createdAt) {
        return new Notification(
                sourceEventId,
                recipientId,
                actorId,
                Notification.Type.NEW_FOLLOWER,
                "USER",
                actorId,
                "{}",
                createdAt
        );
    }
}
