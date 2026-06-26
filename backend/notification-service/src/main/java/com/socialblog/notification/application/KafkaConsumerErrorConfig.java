package com.socialblog.notification.application;

import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnProperty(name = "app.kafka.consumer-enabled", havingValue = "true", matchIfMissing = true)
class KafkaConsumerErrorConfig {
    @Bean
    CommonErrorHandler kafkaConsumerErrorHandler(KafkaTemplate<Object, Object> kafka,
                                                 @Value("${app.kafka.retry.backoff-ms:1000}") long backoffMs,
                                                 @Value("${app.kafka.retry.max-attempts:3}") long maxAttempts) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafka,
                (record, exception) -> new TopicPartition(record.topic() + ".DLT", record.partition())
        );
        return new DefaultErrorHandler(recoverer, new FixedBackOff(backoffMs, Math.max(0, maxAttempts - 1)));
    }
}
