package com.socialblog.comment.api;

public final class AdminDtos {
    private AdminDtos() {}
    public record AdminCommentStats(long totalComments) {}
}
