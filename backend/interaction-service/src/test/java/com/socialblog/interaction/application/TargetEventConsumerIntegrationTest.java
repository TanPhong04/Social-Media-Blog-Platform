package com.socialblog.interaction.application;

import com.socialblog.interaction.domain.TargetKey;
import com.socialblog.interaction.domain.TargetType;
import com.socialblog.interaction.repository.ProcessedEventRepository;
import com.socialblog.interaction.repository.TargetProjectionRepository;
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
        topics = {"articles.events", "comments.events"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:0", "port=0"}
)
@TestPropertySource(properties = {
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=interaction-target-test",
        "app.kafka.consumer-enabled=true",
        "app.outbox.publisher-enabled=false"
})
@DirtiesContext
class TargetEventConsumerIntegrationTest {

    @Autowired
    KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    TargetProjectionRepository targetProjectionRepository;

    @Autowired
    ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanUp() {
        targetProjectionRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void articlePublishedEventCreatesActiveTargetProjection() {
        UUID eventId = UUID.randomUUID();
        UUID articleId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        kafkaTemplate.send("articles.events", articleId.toString(),
                articlePublishedEvent(eventId, articleId, authorId));

        TargetKey key = new TargetKey(TargetType.ARTICLE, articleId);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(targetProjectionRepository.findById(key)).isPresent();
            assertThat(targetProjectionRepository.findById(key).get().isActive()).isTrue();
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void commentCreatedEventCreatesActiveTargetProjection() {
        UUID eventId = UUID.randomUUID();
        UUID commentId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        kafkaTemplate.send("comments.events", commentId.toString(),
                commentCreatedEvent(eventId, commentId, authorId));

        TargetKey key = new TargetKey(TargetType.COMMENT, commentId);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(targetProjectionRepository.findById(key)).isPresent();
            assertThat(targetProjectionRepository.findById(key).get().isActive()).isTrue();
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void duplicateEventIsIgnored() {
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

    private String commentCreatedEvent(UUID eventId, UUID commentId, UUID authorId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"CommentCreated\",\"actorId\":\"%s\",\"payload\":{\"commentId\":\"%s\",\"authorId\":\"%s\"}}",
                eventId, authorId, commentId, authorId);
    }
}
