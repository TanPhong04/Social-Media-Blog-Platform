package com.socialblog.user.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "users")
public class UserAccount {
    @Id private UUID id;
    @Column(nullable=false, unique=true) private String email;
    @Column(name="password_hash", nullable=false) private String passwordHash;
    @Column(name="display_name", nullable=false) private String displayName;
    private String bio;
    @Column(name="avatar_url") private String avatarUrl;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Status status;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;

    protected UserAccount() {}
    public UserAccount(String email, String passwordHash, String displayName) {
        this.id=UUID.randomUUID(); this.email=email; this.passwordHash=passwordHash; this.displayName=displayName;
        this.role=Role.USER; this.status=Status.ACTIVE; this.createdAt=Instant.now(); this.updatedAt=this.createdAt;
    }
    public void updateProfile(String displayName, String bio, String avatarUrl) { this.displayName=displayName; this.bio=bio; this.avatarUrl=avatarUrl; this.updatedAt=Instant.now(); }
    public UUID getId(){return id;} public String getEmail(){return email;} public String getPasswordHash(){return passwordHash;}
    public String getDisplayName(){return displayName;} public String getBio(){return bio;} public String getAvatarUrl(){return avatarUrl;}
    public Role getRole(){return role;} public Status getStatus(){return status;} public Instant getCreatedAt(){return createdAt;}
    public enum Role { USER, ADMIN } public enum Status { ACTIVE, SUSPENDED, DELETED }
}

