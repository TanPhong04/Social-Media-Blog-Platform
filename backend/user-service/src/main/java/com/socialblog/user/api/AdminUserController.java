package com.socialblog.user.api;

import com.socialblog.user.api.AdminDtos.AdminUserResponse;
import com.socialblog.user.application.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    private void requireAdmin(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }

    @GetMapping
    public Page<AdminUserResponse> list(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        requireAdmin(jwt);
        return service.getUsers(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @GetMapping("/stats")
    public com.socialblog.user.api.AdminDtos.AdminUserStats stats(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return service.getStats();
    }

    @PutMapping("/{id}/suspend")
    public void suspend(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        requireAdmin(jwt);
        service.suspendUser(id);
    }

    @PutMapping("/{id}/activate")
    public void activate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        requireAdmin(jwt);
        service.activateUser(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        requireAdmin(jwt);
        service.deleteUser(id);
    }
}
