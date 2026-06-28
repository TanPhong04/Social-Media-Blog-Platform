package com.socialblog.comment.application;

import com.socialblog.comment.repository.ArticleProjectionRepository;
import com.socialblog.comment.repository.ProcessedEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest
@EmbeddedKafka(
        partitions = 1,
        topics = {"articles.events"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:0", "port=0"}
)
@TestPropertySource(properties = {
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=comment-article-test",
        "app.kafka.consumer-enabled=true",
        "app.outbox.publisher-enabled=false"
})
@DirtiesContext
class ArticleEventConsumerIntegrationTest {

    @Autowired
    KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    ArticleProjectionRepository articleProjectionRepository;

    @Autowired
    ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanUp() {
        articleProjectionRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void articlePublishedEventCreatesActiveProjection() {
        UUID eventId = UUID.randomUUID();
        UUID articleId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        kafkaTemplate.send("articles.events", articleId.toString(),
                articlePublishedEvent(eventId, articleId, authorId));

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(articleProjectionRepository.existsByArticleIdAndActiveTrue(articleId)).isTrue();
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void articleDeletedEventDeactivatesProjection() {
        UUID publishEventId = UUID.randomUUID();
        UUID deleteEventId = UUID.randomUUID();
        UUID articleId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        kafkaTemplate.send("articles.events", articleId.toString(),
                articlePublishedEvent(publishEventId, articleId, authorId));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(articleProjectionRepository.existsByArticleIdAndActiveTrue(articleId)).isTrue());

        kafkaTemplate.send("articles.events", articleId.toString(),
                articleDeletedEvent(deleteEventId, articleId, authorId));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(articleProjectionRepository.existsByArticleIdAndActiveTrue(articleId)).isFalse());
    }

    @Test
    void duplicateArticlePublishedEventIsIgnored() {
        UUID eventId = UUID.randomUUID();
        UUID articleId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        String event = articlePublishedEvent(eventId, articleId, authorId);

        kafkaTemplate.send("articles.events", articleId.toString(), event);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isTrue());

        kafkaTemplate.send("articles.events", articleId.toString(), event);
        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(processedEventRepository.count()).isEqualTo(1));
    }

    private String articlePublishedEvent(UUID eventId, UUID articleId, UUID authorId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"ArticlePublished\",\"actorId\":\"%s\",\"payload\":{\"articleId\":\"%s\",\"authorId\":\"%s\"}}",
                eventId, authorId, articleId, authorId);
    }

    private String articleDeletedEvent(UUID eventId, UUID articleId, UUID authorId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"ArticleDeleted\",\"actorId\":\"%s\",\"payload\":{\"articleId\":\"%s\",\"authorId\":\"%s\"}}",
                eventId, authorId, articleId, authorId);
    }
}
