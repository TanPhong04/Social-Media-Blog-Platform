package com.socialblog.notification.api;

import com.socialblog.notification.application.NotificationService;
import com.socialblog.notification.application.NotificationService.*;
import org.springframework.data.domain.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.ArrayList;

@RestController 
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;
    private final JwtDecoder jwtDecoder;

    // Quản lý các SSE emitters kết nối realtime
    private static final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public NotificationController(NotificationService s, JwtDecoder j) {
        service = s;
        jwtDecoder = j;
    }

    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            UUID userId = UUID.fromString(jwt.getSubject());
            
            SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L); // 24 giờ timeout
            
            emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
            
            emitter.onCompletion(() -> removeEmitter(userId, emitter));
            emitter.onTimeout(() -> removeEmitter(userId, emitter));
            emitter.onError((e) -> removeEmitter(userId, emitter));
            
            // Gửi một tin nhắn CONNECT để trình duyệt thiết lập EventSource thành công
            try {
                emitter.send(SseEmitter.event().name("CONNECT").data("connected"));
            } catch (Exception e) {
                removeEmitter(userId, emitter);
            }
            
            return emitter;
        } catch (Exception e) {
            throw new RuntimeException("Invalid token for notification stream", e);
        }
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }

    public static void sendRealtimeNotification(UUID userId, Object notification) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            List<SseEmitter> deadEmitters = new ArrayList<>();
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().name("NOTIFICATION").data(notification));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            list.removeAll(deadEmitters);
            if (list.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }

    public static void sendRealtimeChatMessage(UUID userId, Object chatMessage) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            List<SseEmitter> deadEmitters = new ArrayList<>();
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().name("CHAT_MESSAGE").data(chatMessage));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            list.removeAll(deadEmitters);
            if (list.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }

    public static boolean isUserOnline(UUID userId) {
        List<SseEmitter> list = emitters.get(userId);
        return list != null && !list.isEmpty();
    }

    @GetMapping 
    Page<Response> list(@AuthenticationPrincipal Jwt j, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return service.list(user(j), PageRequests.of(page, size, 100));
    }

    @GetMapping("/unread-count")
    UnreadCount unread(@AuthenticationPrincipal Jwt j) {
        return service.unread(user(j));
    }

    @PatchMapping("/{id}/read")
    Response read(@PathVariable UUID id, @AuthenticationPrincipal Jwt j) {
        return service.read(id, user(j));
    }

    @PatchMapping("/read-all")
    UnreadCount readAll(@AuthenticationPrincipal Jwt j) {
        return service.readAll(user(j));
    }

    private UUID user(Jwt j) {
        return UUID.fromString(j.getSubject());
    }
}
