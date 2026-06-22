package com.socialblog.user.application;

import com.socialblog.user.domain.OutboxEvent;
import com.socialblog.user.repository.OutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OutboxPublisherTest {
    @Test void marksEventPublishedAfterKafkaAcknowledges() {
        OutboxEventRepository repository=mock(OutboxEventRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String,String> kafka=mock(KafkaTemplate.class);
        OutboxEvent event=event();
        when(repository.lockPendingBatch(50)).thenReturn(List.of(event));
        when(kafka.send(anyString(),anyString(),anyString())).thenReturn(CompletableFuture.completedFuture(null));
        new OutboxPublisher(repository,kafka,"users.events",50,3).publish();
        assertThat(event.getStatus()).isEqualTo(OutboxEvent.Status.PUBLISHED);
    }
    @Test void movesEventToFailedAfterConfiguredAttempts() {
        OutboxEventRepository repository=mock(OutboxEventRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String,String> kafka=mock(KafkaTemplate.class);
        OutboxEvent event=event();
        when(repository.lockPendingBatch(50)).thenReturn(List.of(event));
        when(kafka.send(anyString(),anyString(),anyString())).thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker unavailable")));
        OutboxPublisher publisher=new OutboxPublisher(repository,kafka,"users.events",50,2); publisher.publish(); publisher.publish();
        assertThat(event.getStatus()).isEqualTo(OutboxEvent.Status.FAILED); assertThat(event.getAttempts()).isEqualTo(2);
    }
    private OutboxEvent event(){UUID id=UUID.randomUUID();return new OutboxEvent(id,"User",id,"UserRegistered",1,"{}",Instant.now());}
}
