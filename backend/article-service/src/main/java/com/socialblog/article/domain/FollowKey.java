package com.socialblog.article.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class FollowKey implements Serializable {
    @Column(name = "follower_id", nullable = false)
    private UUID followerId;
    @Column(name = "followed_id", nullable = false)
    private UUID followedId;

    protected FollowKey() {
    }

    public FollowKey(UUID followerId, UUID followedId) {
        this.followerId = followerId;
        this.followedId = followedId;
    }

    public UUID followerId() {
        return followerId;
    }

    public UUID followedId() {
        return followedId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FollowKey followKey)) return false;
        return Objects.equals(followerId, followKey.followerId) && Objects.equals(followedId, followKey.followedId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followedId);
    }
}
