package com.socialblog.user.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "email_otps")
public class EmailOtp {
    @Id private UUID id;
    @Column(nullable=false) private String email;
    @Column(nullable=false) private String otp;
    @Column(name="expires_at", nullable=false) private Instant expiresAt;
    @Column(nullable=false) private boolean used;

    protected EmailOtp() {}
    public EmailOtp(String email, String otp, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.email = email;
        this.otp = otp;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getOtp() { return otp; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }

    public void markUsed() { this.used = true; }
}
