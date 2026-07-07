package com.socialblog.comment.api;

import com.socialblog.comment.application.AdminCommentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/comments")
public class AdminCommentController {
    private final AdminCommentService service;

    public AdminCommentController(AdminCommentService service) {
        this.service = service;
    }

    private void requireAdmin(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }

    @GetMapping("/stats")
    public AdminDtos.AdminCommentStats stats(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return service.getStats();
    }
}
