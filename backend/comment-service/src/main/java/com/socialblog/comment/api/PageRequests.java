package com.socialblog.comment.api;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

final class PageRequests {
    private PageRequests() {
    }

    static PageRequest of(int page, int size, int maxSize) {
        if (page < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAGE", "page must be greater than or equal to 0");
        }
        if (size < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PAGE_SIZE", "size must be greater than or equal to 1");
        }
        return PageRequest.of(page, Math.min(size, maxSize));
    }
}
