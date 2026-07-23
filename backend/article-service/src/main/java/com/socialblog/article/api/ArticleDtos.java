package com.socialblog.article.api;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.*;

public final class ArticleDtos {
    private ArticleDtos() {
    }

    public record WriteRequest(@NotBlank @Size(max = 200) String title, @Size(max = 500) String summary,
                               @NotBlank @Size(max = 10000000) String content,
                               @Size(max = 10) Set<@NotBlank @Size(max = 50) String> tags) {
    }

    public record Response(UUID id, UUID authorId, String title, String slug, String summary, String content,
                           String status, Set<String> tags, Instant createdAt, Instant updatedAt, Instant publishedAt,
                           boolean isLivestream, String liveStatus, Instant liveStartedAt, Instant liveEndedAt, String hlsUrl) {
    }

    public record CreateLiveRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String summary,
        @Size(max = 10) Set<@NotBlank @Size(max = 50) String> tags
    ) {}

    public record LiveSessionResponse(
        UUID id,
        String title,
        String rtmpUrl,
        String streamKey,
        String hlsUrl
    ) {}

    public record ActiveLiveResponse(
        UUID id,
        UUID authorId,
        String title,
        String slug,
        String summary,
        String hlsUrl,
        Instant startedAt
    ) {}

    public record TrendingTagResponse(String tag, long posts) {}
}
