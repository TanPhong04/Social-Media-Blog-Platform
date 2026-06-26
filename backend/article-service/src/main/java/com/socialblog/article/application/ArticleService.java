package com.socialblog.article.application;

import com.socialblog.article.api.*;
import com.socialblog.article.api.ArticleDtos.*;
import com.socialblog.article.domain.Article;
import com.socialblog.article.repository.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ArticleService {
    private final ArticleRepository articles;
    private final FollowProjectionRepository follows;
    private final OutboxEventRepository outbox;
    private final DomainEventFactory events;

    public ArticleService(ArticleRepository articles, FollowProjectionRepository follows, OutboxEventRepository outbox, DomainEventFactory events) {
        this.articles = articles;
        this.follows = follows;
        this.outbox = outbox;
        this.events = events;
    }

    @Transactional
    public Response create(UUID author, WriteRequest r) {
        return map(articles.save(new Article(author, r.title(), r.summary(), r.content(), clean(r.tags()))));
    }

    @Transactional
    public Response update(UUID id, UUID author, WriteRequest r) {
        Article a = owned(id, author);
        a.update(r.title(), r.summary(), r.content(), clean(r.tags()));
        return map(a);
    }

    @Transactional
    public Response publish(UUID id, UUID author) {
        Article a = owned(id, author);
        if (a.publish()) outbox.save(events.articlePublished(a));
        return map(a);
    }

    @Transactional
    public Response unpublish(UUID id, UUID author) {
        Article a = owned(id, author);
        a.unpublish();
        return map(a);
    }

    @Transactional
    public void delete(UUID id, UUID author) {
        Article a = owned(id, author);
        if (a.delete()) outbox.save(events.articleDeleted(a));
    }

    @Transactional(readOnly = true)
    public Response publicBySlug(String slug) {
        return map(articles.findBySlugAndStatus(slug, Article.Status.PUBLISHED).orElseThrow(this::notFound));
    }

    @Transactional(readOnly = true)
    public Page<Response> feed(Pageable p) {
        return articles.findByStatusOrderByPublishedAtDesc(Article.Status.PUBLISHED, p).map(this::map);
    }

    @Transactional(readOnly = true)
    public Page<Response> followingFeed(UUID reader, Pageable p) {
        List<UUID> authorIds = follows.findByIdFollowerId(reader).stream().map(f -> f.getId().followedId()).toList();
        if (authorIds.isEmpty()) return Page.empty(p);
        return articles.findByStatusAndAuthorIdInOrderByPublishedAtDesc(Article.Status.PUBLISHED, authorIds, p).map(this::map);
    }

    @Transactional(readOnly = true)
    public Page<Response> mine(UUID author, Pageable p) {
        return articles.findByAuthorIdAndStatusNotOrderByUpdatedAtDesc(author, Article.Status.DELETED, p).map(this::map);
    }

    private Article owned(UUID id, UUID author) {
        Article a = articles.findById(id).orElseThrow(this::notFound);
        if (!a.getAuthorId().equals(author))
            throw new ApiException(HttpStatus.FORBIDDEN, "ARTICLE_FORBIDDEN", "Only the author can modify this article");
        return a;
    }

    private ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "ARTICLE_NOT_FOUND", "Article not found");
    }

    private Set<String> clean(Set<String> tags) {
        if (tags == null) return Set.of();
        Set<String> result = new LinkedHashSet<>();
        tags.forEach(t -> result.add(t.trim().toLowerCase(Locale.ROOT)));
        return result;
    }

    private Response map(Article a) {
        return new Response(a.getId(), a.getAuthorId(), a.getTitle(), a.getSlug(), a.getSummary(), a.getContent(), a.getStatus().name(), a.getTags(), a.getCreatedAt(), a.getUpdatedAt(), a.getPublishedAt());
    }
}
