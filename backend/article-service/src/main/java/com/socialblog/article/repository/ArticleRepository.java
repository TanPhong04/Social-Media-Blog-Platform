package com.socialblog.article.repository;

import com.socialblog.article.domain.Article;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlugAndStatus(String slug, Article.Status status);

    Page<Article> findByStatusOrderByPublishedAtDesc(Article.Status status, Pageable pageable);

    Page<Article> findByStatusAndAuthorIdInOrderByPublishedAtDesc(Article.Status status, Collection<UUID> authorIds, Pageable pageable);

    Page<Article> findByAuthorIdAndStatusNotOrderByUpdatedAtDesc(UUID authorId, Article.Status status, Pageable pageable);
}
