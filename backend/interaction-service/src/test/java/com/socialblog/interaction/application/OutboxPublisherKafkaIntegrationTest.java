package com.socialblog.interaction.application;

import com.socialblog.interaction.domain.OutboxEvent;
import com.socialblog.interaction.repository.OutboxEventRepository;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Testcontainers
@EnabledIf(value = "kafkaTestcontainersEnabled", disabledReason = "Kafka Testcontainers tests are opt-in and require a valid Docker engine")
class OutboxPublisherKafkaIntegrationTest {
    @Container
    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("apache/kafka-native:3.8.0"));

    static boolean kafkaTestcontainersEnabled() {
        return Boolean.getBoolean("socialblog.testcontainers.enabled") && DockerClientFactory.instance().isDockerAvailable();
    }

    @Test
    void publishesPendingOutboxEventToKafkaAndMarksItPublished() throws Exception {
        String topic = "interactions.events.test-" + UUID.randomUUID();
        createTopic(topic);

        OutboxEvent event = event();
        OutboxEventRepository repository = mock(OutboxEventRepository.class);
        when(repository.lockPendingBatch(10)).thenReturn(List.of(event));

        KafkaTemplate<String, String> kafkaTemplate = kafkaTemplate();
        try (KafkaConsumer<String, String> consumer = consumer()) {
            consumer.subscribe(List.of(topic));

            new OutboxPublisher(repository, kafkaTemplate, topic, 10, 3).publish();

            ConsumerRecord<String, String> record = pollOne(consumer);
            assertThat(record.key()).isEqualTo(event.getAggregateId().toString());
            assertThat(record.value()).isEqualTo(event.getPayload());
            assertThat(event.getStatus()).isEqualTo(OutboxEvent.Status.PUBLISHED);
        } finally {
            kafkaTemplate.destroy();
        }
    }

    private void createTopic(String topic) throws Exception {
        try (AdminClient admin = AdminClient.create(Map.of(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers()))) {
            admin.createTopics(List.of(new NewTopic(topic, 1, (short) 1))).all().get();
        }
    }

    private KafkaTemplate<String, String> kafkaTemplate() {
        Map<String, Object> producerProperties = Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers(),
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.ACKS_CONFIG, "all"
        );
        return new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerProperties));
    }

    private KafkaConsumer<String, String> consumer() {
        Properties properties = new Properties();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "outbox-publisher-test-" + UUID.randomUUID());
        properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return new KafkaConsumer<>(properties);
    }

    private ConsumerRecord<String, String> pollOne(KafkaConsumer<String, String> consumer) {
        AtomicReference<ConsumerRecord<String, String>> received = new AtomicReference<>();
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            consumer.poll(Duration.ofMillis(250)).forEach(record -> received.compareAndSet(null, record));
            assertThat(received.get()).isNotNull();
        });
        return received.get();
    }

    private OutboxEvent event() {
        UUID id = UUID.randomUUID();
        return new OutboxEvent(id, id, "InteractionCreated", "{\"eventType\":\"InteractionCreated\"}", Instant.now());
    }
}
