package com.socialblog.article.application;

import com.socialblog.article.domain.FollowKey;
import com.socialblog.article.repository.FollowProjectionRepository;
import com.socialblog.article.repository.ProcessedEventRepository;
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
        topics = {"followers.events"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:0", "port=0"}
)
@TestPropertySource(properties = {
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=article-follow-test",
        "app.kafka.consumer-enabled=true",
        "app.outbox.publisher-enabled=false"
})
@DirtiesContext
class FollowEventConsumerIntegrationTest {

    @Autowired
    KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    FollowProjectionRepository followProjectionRepository;

    @Autowired
    ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanUp() {
        followProjectionRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void userFollowedEventSavesFollowProjection() {
        UUID eventId = UUID.randomUUID();
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();

        kafkaTemplate.send("followers.events", followedId.toString(), userFollowedEvent(eventId, followerId, followedId));

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            FollowKey key = new FollowKey(followerId, followedId);
            assertThat(followProjectionRepository.existsById(key)).isTrue();
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void duplicateUserFollowedEventIsIgnored() {
        UUID eventId = UUID.randomUUID();
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();
        String event = userFollowedEvent(eventId, followerId, followedId);

        kafkaTemplate.send("followers.events", followedId.toString(), event);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isTrue());

        // Send duplicate — should be ignored (no exception, processed_events unchanged)
        kafkaTemplate.send("followers.events", followedId.toString(), event);
        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(processedEventRepository.count()).isEqualTo(1));
    }

    @Test
    void userUnfollowedEventRemovesFollowProjection() {
        UUID followEventId = UUID.randomUUID();
        UUID unfollowEventId = UUID.randomUUID();
        UUID followerId = UUID.randomUUID();
        UUID followedId = UUID.randomUUID();

        kafkaTemplate.send("followers.events", followedId.toString(), userFollowedEvent(followEventId, followerId, followedId));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(followProjectionRepository.existsById(new FollowKey(followerId, followedId))).isTrue());

        kafkaTemplate.send("followers.events", followedId.toString(), userUnfollowedEvent(unfollowEventId, followerId, followedId));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(followProjectionRepository.existsById(new FollowKey(followerId, followedId))).isFalse());
    }

    private String userFollowedEvent(UUID eventId, UUID followerId, UUID followedId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"UserFollowed\",\"actorId\":\"%s\",\"payload\":{\"followerId\":\"%s\",\"followedId\":\"%s\"}}",
                eventId, followerId, followerId, followedId);
    }

    private String userUnfollowedEvent(UUID eventId, UUID followerId, UUID followedId) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"UserUnfollowed\",\"actorId\":\"%s\",\"payload\":{\"followerId\":\"%s\",\"followedId\":\"%s\"}}",
                eventId, followerId, followerId, followedId);
    }
}
