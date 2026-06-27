# Operations runbook

This runbook covers backend observability and first-response procedures. It assumes services are reached through the API Gateway for user traffic and that operators can access service databases, Kafka admin tooling, service logs, and Prometheus.

## Prometheus scrape targets

All backend services and the API Gateway expose Prometheus metrics at `/actuator/prometheus`. Health probes are available at `/actuator/health`, `/actuator/health/liveness`, and `/actuator/health/readiness`.

Local default targets:

| Service | Port | Metrics endpoint |
| --- | ---: | --- |
| API Gateway | 8080 | `http://localhost:8080/actuator/prometheus` |
| User Service | 8081 | `http://localhost:8081/actuator/prometheus` |
| Article Service | 8082 | `http://localhost:8082/actuator/prometheus` |
| Comment Service | 8083 | `http://localhost:8083/actuator/prometheus` |
| Interaction Service | 8084 | `http://localhost:8084/actuator/prometheus` |
| Follower Service | 8085 | `http://localhost:8085/actuator/prometheus` |
| Notification Service | 8086 | `http://localhost:8086/actuator/prometheus` |

Production scraping should use service discovery or Kubernetes service monitors rather than fixed localhost targets.

## Dashboard notes

Create one overview dashboard with these panels:

- Service availability: `up` by job/service, plus readiness health status from the deployment platform.
- HTTP traffic: request rate, error rate, and latency from Spring/Micrometer HTTP server metrics.
- Outbox backlog: `socialblog_outbox_events{status="pending"}` and `socialblog_outbox_events{status="failed"}` by service.
- Outbox publish throughput: `rate(socialblog_outbox_publish_total[5m])` grouped by `topic` and `result`.
- Outbox publish latency: p50/p95/p99 from `socialblog_outbox_publish_latency_seconds`.
- Kafka consumer outcomes: `rate(socialblog_kafka_consumer_events[5m])` grouped by `topic`, `eventType`, and `outcome`.
- Notification fan-out: `socialblog_notifications_fanout_size` p50/p95/p99 to detect abnormal follower fan-out spikes.
- JVM health: heap usage, GC pause time, thread count, and process CPU by service.
- Database pool health: Hikari active/idle/pending connections by service.

Suggested first alerts:

- Any service `up == 0` for more than 2 minutes.
- `socialblog_outbox_events{status="failed"} > 0` for more than 5 minutes.
- `socialblog_outbox_events{status="pending"}` grows continuously for 10 minutes.
- Kafka consumer `outcome="dead_letter"` rate is greater than zero for 5 minutes.
- API Gateway 5xx rate exceeds 1% of requests for 5 minutes.
- p95 HTTP latency exceeds the service-specific SLO for 10 minutes.

## Failed outbox rows

Symptoms:

- `socialblog_outbox_events{status="failed"}` is non-zero.
- Logs include outbox publish failures or Kafka send exceptions.
- Downstream projections stop updating even though user-facing writes succeed.

Triage:

1. Identify the affected service and topic from `socialblog_outbox_publish_total{result="failure"}` and service logs.
2. Check Kafka broker health and topic availability.
3. Query failed rows in that service database:

   ```sql
   SELECT id, aggregate_type, aggregate_id, event_type, event_version, attempts, occurred_at, published_at
   FROM outbox_events
   WHERE status = 'FAILED'
   ORDER BY occurred_at;
   ```

4. Inspect a small sample payload. Do not edit payloads unless the incident owner has confirmed a producer bug and documented the correction.
5. If the broker issue is fixed and payloads are valid, reset rows for retry:

   ```sql
   UPDATE outbox_events
   SET status = 'PENDING'
   WHERE status = 'FAILED'
     AND id IN ('00000000-0000-0000-0000-000000000000');
   ```

6. Watch pending/failed gauges and publish counters until the backlog drains.

Do not delete outbox rows to clear an alert. Deletion loses the durable event source for downstream side effects.

## Stuck consumers

Symptoms:

- Source topic receives events but local projections stop changing.
- `socialblog_kafka_consumer_events` has no `processed` increments for an expected consumer.
- Consumer lag grows in Kafka tooling.
- DLT topics may grow if records are poison messages.

Triage:

1. Check service readiness and recent deployment changes.
2. Inspect logs for `topic`, `partition`, `offset`, `eventId`, `eventType`, `correlationId`, `deliveryAttempt`, and root cause fields.
3. Verify the local `processed_events` table is accepting inserts and is not blocked by database locks.
4. If records are landing in `<source-topic>.DLT`, inspect one record and confirm whether the failure is transient, schema-related, or a code bug.
5. For transient infrastructure failures, restart only the affected consumer service after the dependency is healthy.
6. For poison messages, deploy the consumer fix first, then replay from DLT or reset offsets as described below.

## Migration failures

Symptoms:

- A service fails startup during Flyway migration.
- Readiness stays down after deployment.
- Logs reference a failed `V*__*.sql` migration.

Triage:

1. Stop or roll back the affected service deployment. Do not start multiple instances retrying the same broken migration.
2. Check the service-specific `flyway_schema_history` table and identify the failed version.
3. Compare the migration file in the deployed artifact with the database state.
4. If the migration never committed application changes, fix the migration in a new version and redeploy.
5. If partial manual repair is required, record every SQL statement in the incident notes and run it during a controlled maintenance window.
6. Verify `mvn test` and, when Docker/Testcontainers is available, migration integration tests before redeploying.

Never edit an already-applied migration file in a way that changes its checksum for existing environments. Add a new migration instead.

## Kafka replay and DLT recovery

Replay rules:

- Preserve the original event envelope whenever possible.
- Consumers deduplicate by `eventId`; replaying an already processed event should be safe.
- Replaying from before the desired recovery point requires understanding the service's `processed_events` table state.
- Do not replay a poison payload until the consumer can handle it or a documented corrected payload is produced.

Offset replay:

1. Stop the affected consumer service.
2. Capture current consumer group offsets and target topic partitions.
3. Decide whether to retain or clear relevant rows in `processed_events`. Keeping rows prevents duplicate side effects for already processed events.
4. Reset offsets with Kafka admin tooling for the affected consumer group and topic.
5. Restart the service.
6. Monitor processed/dead-letter counters, service logs, and projection row counts.

DLT replay:

1. Identify the DLT topic, partition, offset range, and root cause.
2. Deploy the fix or document the payload correction.
3. Republish records to the original source topic with the original key and value unless the incident owner approves a corrected payload.
4. Monitor `socialblog_kafka_consumer_events` for `processed` and `dead_letter` outcomes.

See `docs/kafka-topics.md` for topic ownership, retention assumptions, and event compatibility rules.
