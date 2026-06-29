package com.socialblog.follower.application;

import com.socialblog.follower.repository.ProcessedEventRepository;
import com.socialblog.follower.repository.UserProjectionRepository;
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
        topics = {"users.events"},
        brokerProperties = {"listeners=PLAINTEXT://localhost:0", "port=0"}
)
@TestPropertySource(properties = {
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=follower-user-test",
        "app.kafka.consumer-enabled=true",
        "app.outbox.publisher-enabled=false"
})
@DirtiesContext
class UserEventConsumerIntegrationTest {

    @Autowired
    KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    UserProjectionRepository userProjectionRepository;

    @Autowired
    ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanUp() {
        userProjectionRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void userRegisteredEventCreatesUserProjection() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        kafkaTemplate.send("users.events", userId.toString(),
                userRegisteredEvent(eventId, userId, "Alice"));

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            assertThat(userProjectionRepository.findById(userId)).isPresent();
            assertThat(userProjectionRepository.findById(userId).get().getDisplayName()).isEqualTo("Alice");
            assertThat(processedEventRepository.existsById(eventId)).isTrue();
        });
    }

    @Test
    void duplicateUserRegisteredEventIsIgnored() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String event = userRegisteredEvent(eventId, userId, "Bob");

        kafkaTemplate.send("users.events", userId.toString(), event);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isTrue());

        kafkaTemplate.send("users.events", userId.toString(), event);
        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(processedEventRepository.count()).isEqualTo(1));
    }

    @Test
    void unknownEventTypeIsIgnored() {
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String unknownEvent = String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"UserDeleted\",\"actorId\":\"%s\",\"payload\":{\"userId\":\"%s\",\"displayName\":\"Charlie\"}}",
                eventId, userId, userId);

        kafkaTemplate.send("users.events", userId.toString(), unknownEvent);

        await().atMost(Duration.ofSeconds(5)).pollDelay(Duration.ofMillis(500)).untilAsserted(() ->
                assertThat(processedEventRepository.existsById(eventId)).isFalse());
    }

    private String userRegisteredEvent(UUID eventId, UUID userId, String displayName) {
        return String.format(
                "{\"eventId\":\"%s\",\"eventType\":\"UserRegistered\",\"actorId\":\"%s\",\"payload\":{\"userId\":\"%s\",\"displayName\":\"%s\"}}",
                eventId, userId, userId, displayName);
    }
}
