package com.socialblog.user.application;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialblog.user.domain.*;
import org.springframework.stereotype.Component;
import com.socialblog.user.web.CorrelationIdProvider;
import java.time.Instant;
import java.util.*;
@Component
public class DomainEventFactory {
    private final ObjectMapper json; private final CorrelationIdProvider correlationIds;
    public DomainEventFactory(ObjectMapper json,CorrelationIdProvider correlationIds){this.json=json;this.correlationIds=correlationIds;}
    public OutboxEvent userRegistered(UserAccount user){
        UUID eventId=UUID.randomUUID(); Instant now=Instant.now(); Map<String,Object> envelope=new LinkedHashMap<>();
        envelope.put("eventId",eventId); envelope.put("eventType","UserRegistered"); envelope.put("eventVersion",1); envelope.put("occurredAt",now);
        envelope.put("correlationId",correlationIds.current()); envelope.put("actorId",user.getId());
        envelope.put("payload",Map.of("userId",user.getId(),"email",user.getEmail(),"displayName",user.getDisplayName()));
        try{return new OutboxEvent(eventId,"User",user.getId(),"UserRegistered",1,json.writeValueAsString(envelope),now);}catch(JsonProcessingException e){throw new IllegalStateException("Cannot serialize UserRegistered",e);}
    }
}
