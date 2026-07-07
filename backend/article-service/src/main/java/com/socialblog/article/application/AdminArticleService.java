package com.socialblog.article.application;

import com.socialblog.article.api.AdminDtos.AdminArticleResponse;
import com.socialblog.article.domain.Article;
import com.socialblog.article.repository.ArticleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AdminArticleService {
    private final ArticleRepository repository;

    public AdminArticleService(ArticleRepository repository) {
        this.repository = repository;
    }

    public Page<AdminArticleResponse> getArticles(Pageable pageable) {
        return repository.findAll(pageable)
            .map(a -> new AdminArticleResponse(a.getId(), a.getAuthorId(), "User " + a.getAuthorId().toString().substring(0, 4), a.getTitle(), a.getSlug(), a.getSummary(), a.getStatus().name(), a.getTags(), a.getCreatedAt(), a.getPublishedAt()));
    }

    public void archiveArticle(UUID id) {
        Article article = repository.findById(id).orElseThrow();
        article.archive();
    }

    public void deleteArticle(UUID id) {
        Article article = repository.findById(id).orElseThrow();
        article.delete();
    }
}
