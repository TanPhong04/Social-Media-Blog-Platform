package com.socialblog.article.api;

import com.socialblog.article.api.ArticleDtos.*;
import com.socialblog.article.application.ArticleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/articles/livestream")
public class LivestreamController {
    private final ArticleService articleService;

    public LivestreamController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @PostMapping("/create")
    public ResponseEntity<LiveSessionResponse> createLiveSession(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateLiveRequest request
    ) {
        if (jwt == null) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện livestream.");
        }
        UUID authorId = UUID.fromString(jwt.getSubject());
        LiveSessionResponse response = articleService.createLiveSession(authorId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ActiveLiveResponse>> getActiveLiveSessions() {
        List<ActiveLiveResponse> active = articleService.getActiveLiveSessions();
        return ResponseEntity.ok(active);
    }

    @DeleteMapping("/{id}/end")
    public ResponseEntity<Void> endLiveSession(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id
    ) {
        if (jwt == null) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Vui lòng đăng nhập.");
        }
        UUID authorId = UUID.fromString(jwt.getSubject());
        articleService.endLiveSessionById(id, authorId);
        return ResponseEntity.noContent().build();
    }

    // SRS v5 gửi webhook dưới dạng JSON với Content-Type: application/json
    // Body mẫu: {"action":"on_publish","client_id":"xxx","ip":"xxx","vhost":"xxx","app":"live","stream":"stream_key_here","tcUrl":"rtmp://localhost/live","param":""}
    @PostMapping(value = "/webhook/on-publish")
    public ResponseEntity<Integer> onPublish(@RequestBody Map<String, Object> body) {
        System.out.println("[SRS Webhook] on-publish called with body: " + body);
        String streamKey = extractStreamKey(body);
        if (streamKey == null || streamKey.trim().isEmpty()) {
            System.err.println("[SRS Webhook] Stream Key not found in on-publish request.");
            return ResponseEntity.badRequest().body(1);
        }
        try {
            articleService.verifyStreamKey(streamKey);
            System.out.println("[SRS Webhook] Stream Key verified successfully: " + streamKey);
            return ResponseEntity.ok(0); // Trả về 0 báo cho SRS biết stream key hợp lệ
        } catch (Exception e) {
            System.err.println("[SRS Webhook] Stream Key verification failed for key [" + streamKey + "]: " + e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(1);
        }
    }

    @PostMapping(value = "/webhook/on-unpublish")
    public ResponseEntity<Integer> onUnpublish(@RequestBody Map<String, Object> body) {
        System.out.println("[SRS Webhook] on-unpublish called with body: " + body);
        String streamKey = extractStreamKey(body);
        if (streamKey == null || streamKey.trim().isEmpty()) {
            System.err.println("[SRS Webhook] Stream Key not found in on-unpublish request.");
            return ResponseEntity.badRequest().body(1);
        }
        try {
            articleService.endLiveSession(streamKey);
            System.out.println("[SRS Webhook] Livestream ended successfully for key: " + streamKey);
            return ResponseEntity.ok(0);
        } catch (Exception e) {
            System.err.println("[SRS Webhook] Failed to end livestream: " + e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(1);
        }
    }

    /**
     * SRS v5 gửi stream key trong trường "stream".
     * Hỗ trợ fallback sang "name" để tương thích với các phiên bản cũ hơn.
     */
    private String extractStreamKey(Map<String, Object> body) {
        Object val = body.get("stream");
        if (val == null || val.toString().trim().isEmpty()) {
            val = body.get("name");
        }
        return val != null ? val.toString().trim() : null;
    }
}
