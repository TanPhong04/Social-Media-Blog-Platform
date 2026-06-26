package com.socialblog.article.repository;

import com.socialblog.article.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface FollowProjectionRepository extends JpaRepository<FollowProjection, FollowKey> {
    List<FollowProjection> findByIdFollowerId(UUID followerId);
}
