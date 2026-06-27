package com.socialblog.comment.repository;

import com.socialblog.comment.domain.ArticleProjection;
import com.socialblog.comment.domain.Comment;
import com.socialblog.comment.domain.OutboxEvent;
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

@Testcontainers
@EnabledIf(value = "postgresTestcontainersEnabled", disabledReason = "PostgreSQL Testcontainers tests are opt-in and require a valid Docker engine")
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CommentServicePostgresIntegrationTest {
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
    @Autowired CommentRepository comments;
    @Autowired ArticleProjectionRepository articles;
    @Autowired OutboxEventRepository outboxEvents;

    @Test
    void flywayMigrationsCreateExpectedTablesAndIndexes() {
        assertThat(tableExists("comments")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(tableExists("article_projection")).isTrue();
        assertThat(tableExists("processed_events")).isTrue();
        assertThat(columnExists("article_projection", "author_id")).isTrue();
        assertThat(indexExists("idx_comments_article_created")).isTrue();
        assertThat(indexExists("idx_comments_parent")).isTrue();
        assertThat(indexExists("idx_comment_outbox_pending")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(3);
    }

    @Test
    void repositoriesUsePostgresProjectionOrderingAndNativeOutboxClaiming() {
        UUID articleId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        articles.saveAndFlush(new ArticleProjection(articleId, true, authorId));

        assertThat(articles.existsByArticleIdAndActiveTrue(articleId)).isTrue();
        assertThat(articles.findById(articleId)).get().extracting(ArticleProjection::getAuthorId).isEqualTo(authorId);

        Comment root = comments.saveAndFlush(new Comment(articleId, authorId, null, "Root"));
        Comment reply = comments.saveAndFlush(new Comment(articleId, UUID.randomUUID(), root.getId(), "Reply"));

        assertThat(comments.findByArticleIdOrderByCreatedAtAsc(articleId, PageRequest.of(0, 10)))
                .extracting(Comment::getId)
                .contains(root.getId(), reply.getId());

        UUID olderAggregateId = UUID.randomUUID();
        UUID newerAggregateId = UUID.randomUUID();
        outboxEvents.saveAndFlush(event(olderAggregateId, Instant.now().minusSeconds(10)));
        outboxEvents.saveAndFlush(event(newerAggregateId, Instant.now()));

        List<OutboxEvent> claimed = outboxEvents.lockPendingBatch(10);

        assertThat(claimed).extracting(OutboxEvent::getAggregateId).containsSequence(olderAggregateId, newerAggregateId);
        assertThat(outboxEvents.countByStatus(OutboxEvent.Status.PENDING)).isEqualTo(2);
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
                "CommentCreated",
                "{}",
                occurredAt
        );
    }
}
