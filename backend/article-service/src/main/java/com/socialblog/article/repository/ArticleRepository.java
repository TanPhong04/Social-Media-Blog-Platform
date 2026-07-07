package com.socialblog.article.repository;

import com.socialblog.article.domain.Article;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlugAndStatus(String slug, Article.Status status);

    Page<Article> findByStatusOrderByPublishedAtDesc(Article.Status status, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("select a from Article a where a.status = :status and a.authorId in (select f.id.followedId from FollowProjection f where f.id.followerId = :reader) order by a.publishedAt desc")
    Page<Article> findFollowingFeed(@org.springframework.data.repository.query.Param("status") Article.Status status, @org.springframework.data.repository.query.Param("reader") UUID reader, Pageable pageable);

    Page<Article> findByAuthorIdAndStatusNotOrderByUpdatedAtDesc(UUID authorId, Article.Status status, Pageable pageable);
}
