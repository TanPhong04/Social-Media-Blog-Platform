# Kafka topics and replay notes

All domain events use the common envelope fields documented in `docs/architecture.md`: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `correlationId`, `actorId`, and `payload`.

## Source topics

| Topic | Owning publisher | Event types | Current consumers |
| --- | --- | --- | --- |
| `users.events` | User Service | `UserRegistered` | Follower Service |
| `articles.events` | Article Service | `ArticlePublished`, `ArticleDeleted` | Comment Service, Interaction Service, Notification Service |
| `comments.events` | Comment Service | `CommentCreated`, `CommentDeleted` | Interaction Service, Notification Service |
| `interactions.events` | Interaction Service | `InteractionCreated`, `InteractionRemoved` | Notification Service |
| `followers.events` | Follower Service | `UserFollowed`, `UserUnfollowed` | Article Service, Notification Service |

## Dead-letter topics

Each consumer service publishes exhausted records to `<source-topic>.DLT` after the configured retry attempts are exhausted. The DLT retains the original Kafka record value and headers as handled by Spring Kafka's `DeadLetterPublishingRecoverer`.

## Ownership rules

- Only the owning publisher may write to a source topic.
- Consumers must treat events as eventually consistent projections, never as permission to read another service database.
- Consumers must deduplicate by `eventId` before mutating local state.
- Event payloads are append-compatible. New consumers must ignore unknown event types and unknown payload fields.
- `eventVersion` starts at `1`; breaking payload changes require a new event type or explicit version handling.

## Retention assumptions

Local development does not enforce production retention values. Production should retain source topics long enough to rebuild service projections after downtime and should retain DLT topics long enough for incident triage and replay.

Recommended starting points:

- Source topics: 7 to 14 days for early staging, longer if projection rebuilds need more history.
- DLT topics: 14 to 30 days, aligned with operational incident response windows.
- Compaction is not assumed for these append-only domain event topics.

## Replay behavior

To replay a consumer safely:

1. Stop the affected consumer service.
2. Confirm the service's `processed_events` table contains the desired deduplication state.
3. Reset the consumer group offset for the relevant topic and partition range.
4. Restart the consumer and monitor `socialblog.kafka.consumer.events`, DLT growth, and service logs.

If a DLT record is replayed manually, preserve the original event envelope. Fix poison payloads only when the target consumer code expects the corrected envelope and the correction is documented in the incident notes.
