package com.socialblog.user.api;

import java.time.Instant;
import java.util.UUID;

public final class AdminDtos {
    private AdminDtos() {}
    public record AdminUserResponse(UUID id, String email, String displayName, String bio, String avatarUrl, String role, String status, Instant createdAt) {}
    public record AdminUserStats(long totalUsers, long activeUsers, long newUsersToday) {}
}
