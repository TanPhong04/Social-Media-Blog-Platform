package com.socialblog.article.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "follow_projection")
public class FollowProjection {
    @EmbeddedId
    private FollowKey id;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FollowProjection() {
    }

    public FollowProjection(FollowKey id) {
        this.id = id;
        createdAt = Instant.now();
    }

    public FollowKey getId() {
        return id;
    }
}
