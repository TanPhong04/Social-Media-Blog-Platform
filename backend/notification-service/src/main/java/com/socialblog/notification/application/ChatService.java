package com.socialblog.notification.application;

import com.socialblog.notification.api.ApiException;
import com.socialblog.notification.api.NotificationController;
import com.socialblog.notification.domain.ChatMessage;
import com.socialblog.notification.repository.ChatMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    public record ChatMessageResponse(
            UUID id,
            UUID senderId,
            UUID recipientId,
            String content,
            Instant createdAt,
            boolean isRead
    ) {}

    public record ChatContactResponse(
            UUID contactId,
            String lastMessage,
            Instant lastMessageTime,
            long unreadCount,
            boolean isOnline
    ) {}

    private final ChatMessageRepository chatMessageRepository;

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Transactional
    public ChatMessageResponse sendMessage(UUID senderId, UUID recipientId, String content) {
        if (senderId.equals(recipientId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_CHAT", "You cannot send messages to yourself");
        }

        ChatMessage message = new ChatMessage(senderId, recipientId, content);
        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageResponse response = map(saved);

        NotificationController.sendRealtimeChatMessage(recipientId, response);
        NotificationController.sendRealtimeChatMessage(senderId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getChatHistory(UUID userId, UUID contactId, Pageable pageable) {
        return chatMessageRepository.findChatHistory(userId, contactId, pageable).map(this::map);
    }

    @Transactional(readOnly = true)
    public List<ChatContactResponse> getContacts(UUID userId) {
        List<ChatMessage> recents = chatMessageRepository.findRecentMessages(userId);
        
        return recents.stream().map(msg -> {
            UUID contactId = msg.getSenderId().equals(userId) ? msg.getRecipientId() : msg.getSenderId();
            long unread = chatMessageRepository.countBySenderIdAndRecipientIdAndIsReadFalse(contactId, userId);
            boolean isOnline = NotificationController.isUserOnline(contactId);

            return new ChatContactResponse(
                    contactId,
                    msg.getContent(),
                    msg.getCreatedAt(),
                    unread,
                    isOnline
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID userId, UUID contactId) {
        chatMessageRepository.markAsRead(contactId, userId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, Boolean> checkOnlineStatuses(List<UUID> userIds) {
        Map<UUID, Boolean> statuses = new HashMap<>();
        for (UUID uid : userIds) {
            statuses.put(uid, NotificationController.isUserOnline(uid));
        }
        return statuses;
    }

    private ChatMessageResponse map(ChatMessage m) {
        return new ChatMessageResponse(
                m.getId(),
                m.getSenderId(),
                m.getRecipientId(),
                m.getContent(),
                m.getCreatedAt(),
                m.isRead()
        );
    }
}
