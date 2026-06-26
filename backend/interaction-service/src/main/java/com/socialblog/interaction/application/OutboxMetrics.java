package com.socialblog.interaction.application;

import com.socialblog.interaction.domain.OutboxEvent;
import com.socialblog.interaction.repository.OutboxEventRepository;
import io.micrometer.core.instrument.*;
import org.springframework.stereotype.Component;

@Component
class OutboxMetrics {
    OutboxMetrics(MeterRegistry registry, OutboxEventRepository events) {
        Gauge.builder("socialblog.outbox.events", () -> events.countByStatus(OutboxEvent.Status.PENDING)).tag("status", "pending").register(registry);
        Gauge.builder("socialblog.outbox.events", () -> events.countByStatus(OutboxEvent.Status.FAILED)).tag("status", "failed").register(registry);
    }
}
