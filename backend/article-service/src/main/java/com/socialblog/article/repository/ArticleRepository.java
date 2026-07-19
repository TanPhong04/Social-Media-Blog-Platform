package com.socialblog.article.repository;

import com.socialblog.article.domain.Article;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlugAndStatus(String slug, Article.Status status);
    long countByCreatedAtAfter(java.time.Instant date);

    Page<Article> findByStatusOrderByPublishedAtDesc(Article.Status status, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("select a from Article a where a.status = :status and a.authorId in (select f.id.followedId from FollowProjection f where f.id.followerId = :reader) order by a.publishedAt desc")
    Page<Article> findFollowingFeed(@org.springframework.data.repository.query.Param("status") Article.Status status, @org.springframework.data.repository.query.Param("reader") UUID reader, Pageable pageable);

    Page<Article> findByAuthorIdAndStatusNotOrderByUpdatedAtDesc(UUID authorId, Article.Status status, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Article> searchArticles(@org.springframework.data.repository.query.Param("query") String query, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT t, COUNT(a.id) FROM Article a JOIN a.tags t WHERE a.status = 'PUBLISHED' GROUP BY t ORDER BY COUNT(a.id) DESC")
    List<Object[]> findTrendingTags(Pageable pageable);
}
