package com.socialblog.article.application;
import com.fasterxml.jackson.core.JsonProcessingException;import com.fasterxml.jackson.databind.ObjectMapper;import com.socialblog.article.domain.*;import com.socialblog.article.web.CorrelationIdProvider;import org.springframework.stereotype.Component;import java.time.Instant;import java.util.*;
@Component public class DomainEventFactory{
 private final ObjectMapper json;private final CorrelationIdProvider correlations;public DomainEventFactory(ObjectMapper json,CorrelationIdProvider correlations){this.json=json;this.correlations=correlations;}
 public OutboxEvent articlePublished(Article a){return event("ArticlePublished",a,Map.of("articleId",a.getId(),"authorId",a.getAuthorId(),"title",a.getTitle(),"slug",a.getSlug(),"tags",a.getTags()));}
 public OutboxEvent articleDeleted(Article a){return event("ArticleDeleted",a,Map.of("articleId",a.getId(),"authorId",a.getAuthorId()));}
 private OutboxEvent event(String type,Article a,Map<String,Object>payload){UUID id=UUID.randomUUID();Instant now=Instant.now();Map<String,Object>e=new LinkedHashMap<>();e.put("eventId",id);e.put("eventType",type);e.put("eventVersion",1);e.put("occurredAt",now);e.put("correlationId",correlations.current());e.put("actorId",a.getAuthorId());e.put("payload",payload);try{return new OutboxEvent(id,a.getId(),type,json.writeValueAsString(e),now);}catch(JsonProcessingException x){throw new IllegalStateException("Cannot serialize "+type,x);}}
}
