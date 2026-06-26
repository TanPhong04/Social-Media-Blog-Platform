package com.socialblog.article.application;

import com.fasterxml.jackson.databind.*;
import com.socialblog.article.domain.*;
import com.socialblog.article.repository.*;
import io.micrometer.core.instrument.Metrics;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.kafka.consumer-enabled", havingValue = "true", matchIfMissing = true)
public class FollowEventConsumer {
    private final ObjectMapper json;
    private final FollowProjectionRepository follows;
    private final ProcessedEventRepository processed;

    public FollowEventConsumer(ObjectMapper json, FollowProjectionRepository follows, ProcessedEventRepository processed) {
        this.json = json;
        this.follows = follows;
        this.processed = processed;
    }

    @KafkaListener(topics = "followers.events")
    @Transactional
    public void consume(String raw) throws Exception {
        JsonNode event = json.readTree(raw);
        UUID eventId = UUID.fromString(event.path("eventId").asText());
        if (processed.existsById(eventId)) return;

        String type = event.path("eventType").asText();
        JsonNode payload = event.path("payload");
        if ("UserFollowed".equals(type)) {
            follows.save(new FollowProjection(key(payload)));
        } else if ("UserUnfollowed".equals(type)) {
            follows.deleteById(key(payload));
        } else {
            return;
        }
        processed.save(new ProcessedEvent(eventId, type));
        Metrics.counter("socialblog.kafka.consumer.events", "topic", "followers.events", "eventType", type, "outcome", "processed").increment();
    }

    private FollowKey key(JsonNode payload) {
        return new FollowKey(UUID.fromString(payload.path("followerId").asText()), UUID.fromString(payload.path("followedId").asText()));
    }
}
