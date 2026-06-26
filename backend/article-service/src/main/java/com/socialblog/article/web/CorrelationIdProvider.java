package com.socialblog.article.web;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;

import java.util.UUID;

@Component
public class CorrelationIdProvider {
    public String current() {
        RequestAttributes a = RequestContextHolder.getRequestAttributes();
        if (a != null) {
            Object value = a.getAttribute(CorrelationIdFilter.ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
            if (value instanceof String id) return id;
        }
        return UUID.randomUUID().toString();
    }
}
