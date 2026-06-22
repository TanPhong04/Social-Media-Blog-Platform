package com.socialblog.comment.repository;import com.socialblog.comment.domain.Comment;import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface CommentRepository extends JpaRepository<Comment,UUID>{Page<Comment>findByArticleIdOrderByCreatedAtAsc(UUID article,Pageable pageable);}
