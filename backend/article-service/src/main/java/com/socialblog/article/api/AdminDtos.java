package com.socialblog.article.api;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public final class AdminDtos {
    private AdminDtos() {}
    public record AdminArticleResponse(UUID id, UUID authorId, String authorName, String title, String slug, String summary, String status, Set<String> tags, Instant createdAt, Instant publishedAt) {}
    public record AdminArticleStats(long totalArticles, long newArticlesToday) {}
}
