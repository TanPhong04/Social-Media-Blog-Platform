package com.socialblog.article.application;

import com.socialblog.article.domain.OutboxEvent;
import com.socialblog.article.repository.OutboxEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnProperty(name = "app.outbox.publisher-enabled", havingValue = "true", matchIfMissing = true)
public class OutboxPublisher {
    private final OutboxEventRepository events;
    private final KafkaTemplate<String, String> kafka;
    private final String topic;
    private final int batch, max;

    public OutboxPublisher(OutboxEventRepository events, KafkaTemplate<String, String> kafka, @Value("${app.outbox.topic}") String topic, @Value("${app.outbox.batch-size}") int batch, @Value("${app.outbox.max-attempts}") int max) {
        this.events = events;
        this.kafka = kafka;
        this.topic = topic;
        this.batch = batch;
        this.max = max;
    }

    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms}")
    @Transactional
    public void publish() {
        for (OutboxEvent e : events.lockPendingBatch(batch)) {
            try {
                kafka.send(topic, e.getAggregateId().toString(), e.getPayload()).get(5, TimeUnit.SECONDS);
                e.published();
            } catch (InterruptedException x) {
                Thread.currentThread().interrupt();
                e.failedAttempt(max);
                return;
            } catch (Exception x) {
                e.failedAttempt(max);
            }
        }
    }
}
