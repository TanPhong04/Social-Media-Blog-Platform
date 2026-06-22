package com.socialblog.user.api;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(@NotBlank @Email @Size(max=320) String email,
                                  @NotBlank @Size(min=8,max=72) String password,
                                  @NotBlank @Size(max=80) String displayName) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {}
    public record ProfileResponse(UUID id, String email, String displayName, String bio, String avatarUrl, String role, Instant createdAt) {}
    public record UpdateProfileRequest(@NotBlank @Size(max=80) String displayName, @Size(max=500) String bio, @Size(max=500) String avatarUrl) {}
}

