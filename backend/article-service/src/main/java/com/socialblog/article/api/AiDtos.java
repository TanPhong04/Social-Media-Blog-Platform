package com.socialblog.article.api;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public final class AiDtos {
    private AiDtos() {}

    public record ChatMessageDto(@NotBlank String role, @NotBlank String text) {}

    public record AiChatRequest(
        @NotBlank String question,
        List<ChatMessageDto> conversationHistory
    ) {}

    public record AiChatResponse(String reply) {}
}
