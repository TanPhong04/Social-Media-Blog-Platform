package com.socialblog.notification.repository;

import com.socialblog.notification.domain.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    @Query("select m from ChatMessage m where " +
           "(m.senderId = :user1 and m.recipientId = :user2) or " +
           "(m.senderId = :user2 and m.recipientId = :user1) " +
           "order by m.createdAt desc")
    Page<ChatMessage> findChatHistory(@Param("user1") UUID user1, @Param("user2") UUID user2, Pageable pageable);

    @Query("select m from ChatMessage m where " +
           "m.createdAt in (select max(m2.createdAt) from ChatMessage m2 where " +
           "m2.senderId = :userId or m2.recipientId = :userId " +
           "group by case when m2.senderId = :userId then m2.recipientId else m2.senderId end) " +
           "order by m.createdAt desc")
    List<ChatMessage> findRecentMessages(@Param("userId") UUID userId);

    long countBySenderIdAndRecipientIdAndIsReadFalse(UUID senderId, UUID recipientId);

    @Modifying
    @Query("update ChatMessage m set m.isRead = true where m.senderId = :senderId and m.recipientId = :recipientId and m.isRead = false")
    int markAsRead(@Param("senderId") UUID senderId, @Param("recipientId") UUID recipientId);
}
