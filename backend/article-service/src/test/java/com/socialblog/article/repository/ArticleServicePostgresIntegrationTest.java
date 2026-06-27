package com.socialblog.article.repository;

import com.socialblog.article.domain.Article;
import com.socialblog.article.domain.FollowKey;
import com.socialblog.article.domain.FollowProjection;
import com.socialblog.article.domain.OutboxEvent;
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
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@EnabledIf(value = "postgresTestcontainersEnabled", disabledReason = "PostgreSQL Testcontainers tests are opt-in and require a valid Docker engine")
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ArticleServicePostgresIntegrationTest {
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
    @Autowired ArticleRepository articles;
    @Autowired FollowProjectionRepository follows;
    @Autowired OutboxEventRepository outboxEvents;

    @Test
    void flywayMigrationsCreateExpectedTablesAndIndexes() {
        assertThat(tableExists("articles")).isTrue();
        assertThat(tableExists("article_tags")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(tableExists("follow_projection")).isTrue();
        assertThat(tableExists("processed_events")).isTrue();
        assertThat(indexExists("idx_articles_status_published")).isTrue();
        assertThat(indexExists("idx_article_outbox_pending")).isTrue();
        assertThat(indexExists("idx_article_follow_projection_follower")).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(3);
    }

    @Test
    void repositoriesUsePostgresConstraintsTagsCascadeAndNativeOutboxClaiming() {
        UUID authorId = UUID.randomUUID();
        Article article = new Article(authorId, "Postgres Article", "Summary", "Content", Set.of("java", "postgres"));
        article.publish();
        articles.saveAndFlush(article);

        assertThat(articles.findBySlugAndStatus(article.getSlug(), Article.Status.PUBLISHED)).contains(article);
        assertThat(articles.findByStatusOrderByPublishedAtDesc(Article.Status.PUBLISHED, org.springframework.data.domain.PageRequest.of(0, 10)))
                .extracting(Article::getId)
                .contains(article.getId());
        assertThat(jdbc.queryForObject("select count(*) from article_tags where article_id = ?", Integer.class, article.getId()))
                .isEqualTo(2);

        UUID followerId = UUID.randomUUID();
        follows.saveAndFlush(new FollowProjection(new FollowKey(followerId, authorId)));
        assertThat(follows.findByIdFollowerId(followerId))
                .extracting(follow -> follow.getId().followedId())
                .containsExactly(authorId);

        UUID olderAggregateId = UUID.randomUUID();
        UUID newerAggregateId = UUID.randomUUID();
        outboxEvents.saveAndFlush(event(olderAggregateId, Instant.now().minusSeconds(10)));
        outboxEvents.saveAndFlush(event(newerAggregateId, Instant.now()));

        List<OutboxEvent> claimed = outboxEvents.lockPendingBatch(10);

        assertThat(claimed).extracting(OutboxEvent::getAggregateId).containsSequence(olderAggregateId, newerAggregateId);
        assertThat(outboxEvents.countByStatus(OutboxEvent.Status.PENDING)).isEqualTo(2);

        articles.delete(article);
        articles.flush();
        assertThat(jdbc.queryForObject("select count(*) from article_tags where article_id = ?", Integer.class, article.getId()))
                .isZero();
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
                aggregateId,
                "ArticlePublished",
                "{}",
                occurredAt
        );
    }
}
