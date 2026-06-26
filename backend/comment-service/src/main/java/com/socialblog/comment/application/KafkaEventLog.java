package com.socialblog.comment.application;

import com.fasterxml.jackson.databind.*;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import java.util.*;

final class KafkaEventLog {
    private KafkaEventLog() {}
    static String failure(ObjectMapper json, ConsumerRecord<?, ?> record, Exception exception, String action, String deadLetterTopic, Integer deliveryAttempt) {
        Map<String, Object> fields = new LinkedHashMap<>();fields.put("logType","kafka_consumer_failure");fields.put("action",action);fields.put("topic",record.topic());fields.put("partition",record.partition());fields.put("offset",record.offset());if(deadLetterTopic!=null)fields.put("deadLetterTopic",deadLetterTopic);if(deliveryAttempt!=null)fields.put("deliveryAttempt",deliveryAttempt);addEventFields(json,record.value(),fields);addExceptionFields(exception,fields);return write(json,fields);
    }
    private static void addEventFields(ObjectMapper json,Object value,Map<String,Object>fields){if(value==null)return;try{JsonNode event=json.readTree(value.toString());putText(event,fields,"eventId");putText(event,fields,"eventType");putText(event,fields,"correlationId");putText(event,fields,"actorId");if(event.hasNonNull("eventVersion"))fields.put("eventVersion",event.path("eventVersion").asInt());}catch(Exception ex){fields.put("eventParseError",ex.getClass().getSimpleName());}}
    private static void putText(JsonNode event,Map<String,Object>fields,String name){if(event.hasNonNull(name))fields.put(name,event.path(name).asText());}
    private static void addExceptionFields(Throwable exception,Map<String,Object>fields){fields.put("exceptionClass",exception.getClass().getName());fields.put("exceptionMessage",exception.getMessage());Throwable root=exception;while(root.getCause()!=null)root=root.getCause();fields.put("rootCauseClass",root.getClass().getName());fields.put("rootCauseMessage",root.getMessage());}
    private static String write(ObjectMapper json,Map<String,Object>fields){try{return json.writeValueAsString(fields);}catch(Exception ex){return fields.toString();}}
}
