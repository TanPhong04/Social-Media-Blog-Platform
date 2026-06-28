package com.socialblog.interaction.repository;

import com.socialblog.interaction.domain.Interaction;
import com.socialblog.interaction.domain.OutboxEvent;
import com.socialblog.interaction.domain.TargetKey;
import com.socialblog.interaction.domain.TargetProjection;
import com.socialblog.interaction.domain.TargetType;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
@EnabledIf(value = "postgresTestcontainersEnabled", disabledReason = "PostgreSQL Testcontainers tests are opt-in and require a valid Docker engine")
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class InteractionServicePostgresIntegrationTest {
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
    @Autowired InteractionRepository interactions;
    @Autowired TargetProjectionRepository targets;
    @Autowired OutboxEventRepository outboxEvents;

    @Test
    void flywayMigrationsCreateExpectedTablesAndIndexes() {
        assertThat(tableExists("target_projection")).isTrue();
        assertThat(tableExists("interactions")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(tableExists("processed_events")).isTrue();
        assertThat(columnExists("target_projection", "owner_id")).isTrue();
        assertThat(indexExists("idx_interactions_target")).isTrue();
        assertThat(indexExists("idx_interaction_outbox_pending")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(2);
    }

    @Test
    void repositoriesUsePostgresUniquenessProjectionAndNativeOutboxClaiming() {
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        TargetKey targetKey = new TargetKey(TargetType.ARTICLE, targetId);
        targets.saveAndFlush(new TargetProjection(targetKey, true, ownerId));

        assertThat(targets.existsByIdAndActiveTrue(targetKey)).isTrue();
        assertThat(targets.findById(targetKey)).get().extracting(TargetProjection::getOwnerId).isEqualTo(ownerId);

        interactions.saveAndFlush(new Interaction(actorId, TargetType.ARTICLE, targetId));

        assertThat(interactions.findByActorIdAndTargetTypeAndTargetId(actorId, TargetType.ARTICLE, targetId)).isPresent();
        assertThat(interactions.countByTargetTypeAndTargetId(TargetType.ARTICLE, targetId)).isEqualTo(1);

        UUID olderAggregateId = UUID.randomUUID();
        UUID newerAggregateId = UUID.randomUUID();
        outboxEvents.saveAndFlush(event(olderAggregateId, Instant.now().minusSeconds(10)));
        outboxEvents.saveAndFlush(event(newerAggregateId, Instant.now()));

        List<OutboxEvent> claimed = outboxEvents.lockPendingBatch(10);

        assertThat(claimed).extracting(OutboxEvent::getAggregateId).containsSequence(olderAggregateId, newerAggregateId);
        assertThat(outboxEvents.countByStatus(OutboxEvent.Status.PENDING)).isEqualTo(2);

        assertThatThrownBy(() -> interactions.saveAndFlush(new Interaction(actorId, TargetType.ARTICLE, targetId)))
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

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbc.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = 'public' and table_name = ? and column_name = ?
                """, Integer.class, tableName, columnName);
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
                aggregateId,
                "InteractionCreated",
                "{}",
                occurredAt
        );
    }
}
