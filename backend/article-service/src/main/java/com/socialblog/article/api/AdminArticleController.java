package com.socialblog.article.api;

import com.socialblog.article.api.AdminDtos.AdminArticleResponse;
import com.socialblog.article.application.AdminArticleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/articles")
public class AdminArticleController {
    private final AdminArticleService service;

    public AdminArticleController(AdminArticleService service) {
        this.service = service;
    }

    private void requireAdmin(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }

    @GetMapping
    public Page<AdminArticleResponse> list(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        requireAdmin(jwt);
        return service.getArticles(PageRequest.of(page, size));
    }

    @PutMapping("/{id}/archive")
    public void archive(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        requireAdmin(jwt);
        service.archiveArticle(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        requireAdmin(jwt);
        service.deleteArticle(id);
    }
}
