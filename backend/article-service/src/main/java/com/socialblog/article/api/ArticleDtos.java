package com.socialblog.article.api;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.*;

public final class ArticleDtos {
    private ArticleDtos() {
    }

    public record WriteRequest(@NotBlank @Size(max = 200) String title, @Size(max = 500) String summary,
                               @NotBlank @Size(max = 50000) String content,
                               @Size(max = 10) Set<@NotBlank @Size(max = 50) String> tags) {
    }

    public record Response(UUID id, UUID authorId, String title, String slug, String summary, String content,
                           String status, Set<String> tags, Instant createdAt, Instant updatedAt, Instant publishedAt) {
    }
}
