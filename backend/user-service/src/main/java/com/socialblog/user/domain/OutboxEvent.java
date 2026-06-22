package com.socialblog.user.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="outbox_events")
public class OutboxEvent {
    @Id private UUID id;
    @Column(name="aggregate_type",nullable=false) private String aggregateType;
    @Column(name="aggregate_id",nullable=false) private UUID aggregateId;
    @Column(name="event_type",nullable=false) private String eventType;
    @Column(name="event_version",nullable=false) private int eventVersion;
    @Column(nullable=false,columnDefinition="TEXT") private String payload;
    @Column(name="occurred_at",nullable=false) private Instant occurredAt;
    @Column(name="published_at") private Instant publishedAt;
    @Column(nullable=false) private int attempts;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Status status;
    protected OutboxEvent() {}
    public OutboxEvent(UUID id,String aggregateType,UUID aggregateId,String eventType,int eventVersion,String payload,Instant occurredAt){this.id=id;this.aggregateType=aggregateType;this.aggregateId=aggregateId;this.eventType=eventType;this.eventVersion=eventVersion;this.payload=payload;this.occurredAt=occurredAt;this.status=Status.PENDING;}
    public void published(){status=Status.PUBLISHED;publishedAt=Instant.now();}
    public void failedAttempt(int maxAttempts){attempts++;if(attempts>=maxAttempts)status=Status.FAILED;}
    public UUID getId(){return id;} public UUID getAggregateId(){return aggregateId;} public String getPayload(){return payload;} public int getAttempts(){return attempts;} public Status getStatus(){return status;}
    public enum Status { PENDING, PUBLISHED, FAILED }
}
