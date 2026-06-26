package com.socialblog.interaction.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnProperty(name = "app.kafka.consumer-enabled", havingValue = "true", matchIfMissing = true)
class KafkaConsumerErrorConfig {
    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerErrorConfig.class);

    @Bean
    CommonErrorHandler kafkaConsumerErrorHandler(KafkaTemplate<Object, Object> kafka,
                                                 ObjectMapper json,
                                                 @Value("${app.kafka.retry.backoff-ms:1000}") long backoffMs,
                                                 @Value("${app.kafka.retry.max-attempts:3}") long maxAttempts) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafka,
                (record, exception) -> {
                    TopicPartition destination = new TopicPartition(record.topic() + ".DLT", record.partition());
                    log.error(KafkaEventLog.failure(json, record, exception, "dead_letter", destination.topic(), null));
                    return destination;
                }
        );
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(backoffMs, Math.max(0, maxAttempts - 1)));
        handler.setRetryListeners((record, exception, deliveryAttempt) -> log.warn(KafkaEventLog.failure(json, record, exception, "retry", null, deliveryAttempt)));
        return handler;
    }
}
