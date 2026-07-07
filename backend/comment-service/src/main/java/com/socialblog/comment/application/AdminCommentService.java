package com.socialblog.comment.application;

import com.socialblog.comment.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminCommentService {
    private final CommentRepository repository;

    public AdminCommentService(CommentRepository repository) {
        this.repository = repository;
    }

    public com.socialblog.comment.api.AdminDtos.AdminCommentStats getStats() {
        return new com.socialblog.comment.api.AdminDtos.AdminCommentStats(repository.count());
    }
}
