package com.socialblog.article.api;

import com.socialblog.article.application.MediaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/articles/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @AuthenticationPrincipal Jwt jwt, 
            @RequestParam("file") MultipartFile file) {
        // Enforce that only authenticated users can upload files.
        // We could also enforce size limits here or in application.yml.
        String url = mediaService.uploadFile(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
