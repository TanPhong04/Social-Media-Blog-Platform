package com.socialblog.user.application;
import com.socialblog.user.domain.OutboxEvent;
import com.socialblog.user.repository.OutboxEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.TimeUnit;
@Component @ConditionalOnProperty(name="app.outbox.publisher-enabled",havingValue="true",matchIfMissing=true)
public class OutboxPublisher {
    private final OutboxEventRepository events; private final KafkaTemplate<String,String> kafka; private final String topic; private final int batchSize; private final int maxAttempts;
    public OutboxPublisher(OutboxEventRepository events,KafkaTemplate<String,String> kafka,@Value("${app.outbox.topic}") String topic,@Value("${app.outbox.batch-size}") int batchSize,@Value("${app.outbox.max-attempts}") int maxAttempts){this.events=events;this.kafka=kafka;this.topic=topic;this.batchSize=batchSize;this.maxAttempts=maxAttempts;}
    @Scheduled(fixedDelayString="${app.outbox.fixed-delay-ms}") @Transactional
    public void publish(){for(OutboxEvent event:events.lockPendingBatch(batchSize)){try{kafka.send(topic,event.getAggregateId().toString(),event.getPayload()).get(5,TimeUnit.SECONDS);event.published();}catch(InterruptedException ex){Thread.currentThread().interrupt();event.failedAttempt(maxAttempts);return;}catch(Exception ex){event.failedAttempt(maxAttempts);}}}
}
