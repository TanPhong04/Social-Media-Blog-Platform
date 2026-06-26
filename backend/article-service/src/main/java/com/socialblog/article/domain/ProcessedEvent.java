package com.socialblog.article.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processed_events")
public class ProcessedEvent {
    @Id
    @Column(name = "event_id")
    private UUID id;
    @Column(name = "event_type", nullable = false)
    private String type;
    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    protected ProcessedEvent() {
    }

    public ProcessedEvent(UUID id, String type) {
        this.id = id;
        this.type = type;
        processedAt = Instant.now();
    }
}
