package com.socialblog.notification.application;

import com.socialblog.notification.repository.NotificationRepository;
import com.socialblog.notification.repository.ProcessedEventRepository;
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
        topics = {"followers.events", "comments.events", "interactions.events", "articles.events"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:0", "port=0"}
)
@TestPropertySource(properties = {
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=notification-event-test",
        "app.kafka.consumer-enabled=true",
        "app.outbox.publisher-enabled=false"
})
@DirtiesContext
class NotificationEventConsumerIntegrationTest {

    @Autowired
    KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanUp() {
        notificationRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void userFollowedEventCreatesNewFollowerNotification() {
        UUID eventId = UUID.randomUUID();
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();

        kafkaTemplate.send("followers.events", followedId.toString(),
                userFollowedEvent(eventId, followerId, followedId));

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(notificationRepository.count()).isEqualTo(1);
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void commentCreatedEventCreatesNewCommentNotification() {
        UUID eventId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID commentId = UUID.randomUUID();

        kafkaTemplate.send("comments.events", commentId.toString(),
                commentCreatedEvent(eventId, authorId, recipientId, commentId));

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(notificationRepository.count()).isEqualTo(1);
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void selfFollowDoesNotCreateNotification() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID(); // actor == recipient => no notification

        kafkaTemplate.send("followers.events", userId.toString(),
                userFollowedEvent(eventId, userId, userId));

        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(notificationRepository.count()).isEqualTo(0));
        // processed_event should still be saved
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isTrue());
    }

    @Test
    void duplicateEventIsIgnored() {
        UUID eventId = UUID.randomUUID();
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();
        String event = userFollowedEvent(eventId, followerId, followedId);

        kafkaTemplate.send("followers.events", followedId.toString(), event);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isTrue());

        kafkaTemplate.send("followers.events", followedId.toString(), event);
        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(processedEventRepository.count()).isEqualTo(1));
    }

    private String userFollowedEvent(UUID eventId, UUID followerId, UUID followedId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"UserFollowed\",\"actorId\":\"%s\",\"occurredAt\":\"2026-01-01T00:00:00Z\",\"payload\":{\"followerId\":\"%s\",\"followedId\":\"%s\"}}",
                eventId, followerId, followerId, followedId);
    }

    private String commentCreatedEvent(UUID eventId, UUID authorId, UUID recipientId, UUID commentId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"CommentCreated\",\"actorId\":\"%s\",\"occurredAt\":\"2026-01-01T00:00:00Z\",\"payload\":{\"commentId\":\"%s\",\"recipientId\":\"%s\"}}",
                eventId, authorId, commentId, recipientId);
    }
}
