package com.socialblog.article.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    private UUID id;
    @Column(name = "aggregate_type", nullable = false)
    private String aggregateType;
    @Column(name = "aggregate_id", nullable = false)
    private UUID aggregateId;
    @Column(name = "event_type", nullable = false)
    private String eventType;
    @Column(name = "event_version", nullable = false)
    private int eventVersion;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
    @Column(name = "published_at")
    private Instant publishedAt;
    @Column(nullable = false)
    private int attempts;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    protected OutboxEvent() {
    }

    public OutboxEvent(UUID id, UUID aggregateId, String eventType, String payload, Instant occurredAt) {
        this.id = id;
        this.aggregateType = "Article";
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.eventVersion = 1;
        this.payload = payload;
        this.occurredAt = occurredAt;
        this.status = Status.PENDING;
    }

    public void published() {
        status = Status.PUBLISHED;
        publishedAt = Instant.now();
    }

    public void failedAttempt(int max) {
        attempts++;
        if (attempts >= max) status = Status.FAILED;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public String getPayload() {
        return payload;
    }

    public Status getStatus() {
        return status;
    }

    public int getAttempts() {
        return attempts;
    }

    public enum Status {PENDING, PUBLISHED, FAILED}
}
