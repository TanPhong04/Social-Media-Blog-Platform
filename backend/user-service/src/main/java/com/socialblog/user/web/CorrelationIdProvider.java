package com.socialblog.user.web;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;
import java.util.UUID;

@Component
public class CorrelationIdProvider {
    public String current(){
        RequestAttributes attributes=RequestContextHolder.getRequestAttributes();
        if(attributes!=null){Object value=attributes.getAttribute(CorrelationIdFilter.ATTRIBUTE,RequestAttributes.SCOPE_REQUEST);if(value instanceof String id)return id;}
        return UUID.randomUUID().toString();
    }
}

