package com.socialblog.article.domain;

import jakarta.persistence.*;

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "articles")
public class Article {
    @Id
    private UUID id;
    @Column(name = "author_id", nullable = false)
    private UUID authorId;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(nullable = false, unique = true, length = 240)
    private String slug;
    @Column(length = 500)
    private String summary;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "article_tags", joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "tag")
    private Set<String> tags = new LinkedHashSet<>();
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Column(name = "published_at")
    private Instant publishedAt;

    protected Article() {
    }

    public Article(UUID authorId, String title, String summary, String content, Set<String> tags) {
        id = UUID.randomUUID();
        this.authorId = authorId;
        status = Status.DRAFT;
        createdAt = Instant.now();
        update(title, summary, content, tags);
    }

    public void update(String title, String summary, String content, Set<String> tags) {
        if (status == Status.DELETED) throw new IllegalStateException("Deleted article cannot be edited");
        this.title = title.trim();
        this.slug = slugify(title) + "-" + id.toString().substring(0, 8);
        this.summary = summary;
        this.content = content;
        this.tags = new LinkedHashSet<>(tags);
        updatedAt = Instant.now();
    }

    public boolean publish() {
        if (status == Status.PUBLISHED) return false;
        status = Status.PUBLISHED;
        if (publishedAt == null) publishedAt = Instant.now();
        updatedAt = Instant.now();
        return true;
    }

    public void unpublish() {
        status = Status.DRAFT;
        updatedAt = Instant.now();
    }

    public boolean delete() {
        if (status == Status.DELETED) return false;
        status = Status.DELETED;
        updatedAt = Instant.now();
        return true;
    }

    private String slugify(String value) {
        String s = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return s.isBlank() ? "article" : s;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getSummary() {
        return summary;
    }

    public String getContent() {
        return content;
    }

    public Status getStatus() {
        return status;
    }

    public Set<String> getTags() {
        return tags;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public enum Status {DRAFT, PUBLISHED, DELETED}
}
