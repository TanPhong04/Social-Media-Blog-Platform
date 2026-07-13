package com.socialblog.notification.api;

import com.socialblog.notification.application.ChatService;
import com.socialblog.notification.application.ChatService.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    public record SendMessageRequest(
            UUID recipientId,
            String content
    ) {}

    @PostMapping
    public ChatMessageResponse sendMessage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody SendMessageRequest request
    ) {
        return chatService.sendMessage(user(jwt), request.recipientId(), request.content());
    }

    @GetMapping("/{contactId}")
    public Page<ChatMessageResponse> getChatHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return chatService.getChatHistory(user(jwt), contactId, PageRequest.of(page, size));
    }

    @GetMapping("/contacts")
    public List<ChatContactResponse> getContacts(@AuthenticationPrincipal Jwt jwt) {
        return chatService.getContacts(user(jwt));
    }

    @PutMapping("/{contactId}/read")
    public void markAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID contactId
    ) {
        chatService.markAsRead(user(jwt), contactId);
    }

    @PostMapping("/online-statuses")
    public Map<UUID, Map<String, Object>> checkOnlineStatuses(@RequestBody List<UUID> userIds) {
        return chatService.checkOnlineStatuses(userIds);
    }

    private UUID user(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
